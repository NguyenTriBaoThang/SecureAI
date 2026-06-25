from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
import io

from src.schemas import (
    PredictRequest, BatchPredictRequest, PredictResponse,
    EmailAnalyzeRequest, EmailAnalyzeResponse, UrlResult,
    BaselineRequest, BaselineResponse, MethodResult,
)
from src.predictor import predict_url, predict_batch
from src.loader import ModelStore
from src.email_analyzer import (
    _parse_email, extract_header_features,
    extract_body_features, extract_urls, compute_email_risk_score,
)
from src.baseline import run_baseline_comparison
from src.export_service import export_batch_csv, export_summary_json
from src.extract_service import extract_email_from_file

router = APIRouter()


def require_model_ready() -> None:
    if not ModelStore.is_ready():
        raise HTTPException(503, "Model chua duoc load - kiem tra thu muc models/")


def model_metadata() -> dict:
    meta = ModelStore.metadata or {}
    return {
        "model_version": meta.get("model_version", "unknown"),
        "architecture": meta.get("architecture", "BiLSTM + Self-Attention"),
        "accuracy": meta.get("best_metrics", {}).get("accuracy"),
        "f1_weighted": meta.get("best_metrics", {}).get("f1_weighted"),
        "roc_auc": meta.get("best_metrics", {}).get("roc_auc"),
        "label_classes": meta.get("label_classes", []),
        "dataset_size": meta.get("dataset_size", 0),
        "epochs_trained": meta.get("epochs_trained", 0),
        "generated_at": meta.get("generated_at", ""),
        "all_metrics": meta.get("all_metrics", []),
    }


@router.get("/health")
def health():
    return {
        "status": "ok" if ModelStore.is_ready() else "model_not_loaded",
        "model_ready": ModelStore.is_ready(),
        "device": str(ModelStore.device),
    }


@router.get("/model/info")
def model_info():
    require_model_ready()
    return model_metadata()


@router.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    require_model_ready()
    try:
        return predict_url(request.url)
    except Exception as e:
        raise HTTPException(500, f"Loi inference: {e}")


@router.post("/predict/batch")
def predict_batch_endpoint(request: BatchPredictRequest):
    require_model_ready()
    try:
        results = predict_batch(request.urls)
        return {"results": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(500, f"Loi batch inference: {e}")


@router.post("/export/csv")
def export_csv(request: BatchPredictRequest):
    require_model_ready()
    try:
        csv_content = export_batch_csv(request.urls)
        return StreamingResponse(
            io.StringIO(csv_content),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=secureai_report.csv"},
        )
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/export/json")
def export_json(request: BatchPredictRequest):
    require_model_ready()
    try:
        return export_summary_json(request.urls)
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/stats")
def stats(request: BatchPredictRequest):
    require_model_ready()
    try:
        results = predict_batch(request.urls)
        label_count = {"benign": 0, "phishing": 0, "malware": 0, "defacement": 0}
        risk_scores = []

        for result in results:
            label = result.get("label", "unknown")
            label_count[label] = label_count.get(label, 0) + 1
            risk_scores.append(result.get("risk_score", 0))

        return {
            "total": len(results),
            "label_breakdown": label_count,
            "avg_risk_score": round(sum(risk_scores) / len(risk_scores), 4) if risk_scores else 0,
            "high_risk_count": sum(1 for score in risk_scores if score >= 0.85),
        }
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/analyze/email", response_model=EmailAnalyzeResponse)
def analyze_email(request: EmailAnalyzeRequest):
    try:
        msg = _parse_email(request.raw_email)
    except Exception as e:
        raise HTTPException(400, f"Khong parse duoc email: {e}")

    header_features = extract_header_features(msg)
    body_features = extract_body_features(msg)

    url_results = []
    if request.analyze_urls and ModelStore.is_ready():
        for url in extract_urls(request.raw_email)[:20]:
            try:
                url_results.append(predict_url(url))
            except Exception:
                continue

    risk_score, verdict, reasons = compute_email_risk_score(
        header_features,
        body_features,
        url_results,
    )

    if risk_score >= 0.75:
        action = "block"
    elif risk_score >= 0.45:
        action = "review"
    else:
        action = "allow"

    return EmailAnalyzeResponse(
        verdict=verdict,
        risk_score=risk_score,
        reasons=reasons,
        header_flags={
            "spf_pass": header_features.get("has_spf_pass"),
            "dkim_pass": header_features.get("has_dkim_pass"),
            "dmarc_pass": header_features.get("has_dmarc_pass"),
            "reply_to_mismatch": header_features.get("reply_to_mismatch"),
            "suspicious_xmailer": header_features.get("suspicious_xmailer"),
            "from_domain": header_features.get("from_domain"),
            "subject": header_features.get("subject"),
        },
        body_flags={
            "urgency_keywords": body_features.get("urgency_keyword_count"),
            "phishing_keywords": body_features.get("phishing_keyword_count"),
            "brand_mismatch": body_features.get("brand_mismatch"),
            "mentioned_brands": body_features.get("mentioned_brands"),
            "has_html_form": body_features.get("has_html_form"),
            "link_count": body_features.get("link_count"),
        },
        urls_found=[
            UrlResult(
                url=result.get("url", ""),
                label=result.get("label", "unknown"),
                risk_score=result.get("risk_score", 0),
                action=result.get("action", "allow"),
            )
            for result in url_results
        ],
        action=action,
    )


@router.post("/baseline/compare", response_model=BaselineResponse)
def baseline_compare(request: BaselineRequest):
    require_model_ready()
    try:
        bilstm_result = predict_url(request.url)
        comparison = run_baseline_comparison(request.url, bilstm_result)
    except Exception as e:
        raise HTTPException(500, f"Baseline compare loi: {e}")

    return BaselineResponse(
        url=comparison["url"],
        methods=[MethodResult(**method) for method in comparison["methods"]],
        agreement=comparison["agreement"],
        consensus_label=comparison["consensus_label"],
        summary=comparison["summary"],
    )


@router.post("/extract/email")
async def extract_email(file: UploadFile = File(...)):
    content_type = (file.content_type or "").lower()
    if content_type in ("image/jpg", "image/pjpeg"):
        content_type = "image/jpeg"

    if not (content_type.startswith("image/") or content_type == "application/pdf"):
        raise HTTPException(
            400,
            f"Chi ho tro anh PNG/JPG/WEBP hoac PDF. Nhan duoc: '{content_type}'",
        )

    file_bytes = await file.read()
    size_mb = len(file_bytes) / 1024 / 1024
    if size_mb > 10:
        raise HTTPException(400, f"File qua lon: {size_mb:.1f}MB (toi da 10MB)")

    try:
        return await extract_email_from_file(file_bytes, content_type)
    except Exception as e:
        raise HTTPException(500, f"Extract email loi: {e}")
