from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
import io, os
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


# ── Health ────────────────────────────────────────────────────────────────────
@router.get("/health")
def health():
    return {
        "status":      "ok" if ModelStore.is_ready() else "model_not_loaded",
        "model_ready": ModelStore.is_ready(),
        "device":      str(ModelStore.device),
    }


# ── Model info ────────────────────────────────────────────────────────────────
@router.get("/model/info")
def model_info():
    if not ModelStore.is_ready():
        raise HTTPException(503, "Model chưa được load")
    meta = ModelStore.metadata or {}
    return {
        "model_version":  meta.get("model_version",    "unknown"),
        "architecture":   meta.get("architecture",     "BiLSTM + Self-Attention"),
        "accuracy":       meta.get("best_metrics", {}).get("accuracy"),
        "f1_weighted":    meta.get("best_metrics", {}).get("f1_weighted"),
        "roc_auc":        meta.get("best_metrics", {}).get("roc_auc"),
        "label_classes":  meta.get("label_classes",    []),
        "dataset_size":   meta.get("dataset_size",     0),
        "epochs_trained": meta.get("epochs_trained",   0),
        "generated_at":   meta.get("generated_at",     ""),
        "all_metrics":    meta.get("all_metrics",      []),
    }


# ── Single URL predict ────────────────────────────────────────────────────────
@router.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    if not ModelStore.is_ready():
        raise HTTPException(503, "Model chưa được load — kiểm tra thư mục models/")
    try:
        return predict_url(request.url)
    except Exception as e:
        raise HTTPException(500, f"Lỗi inference: {str(e)}")


# ── Batch predict ─────────────────────────────────────────────────────────────
@router.post("/predict/batch")
def predict_batch_endpoint(request: BatchPredictRequest):
    if not ModelStore.is_ready():
        raise HTTPException(503, "Model chưa được load")
    try:
        results = predict_batch(request.urls)
        return {"results": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(500, f"Lỗi batch inference: {str(e)}")


# ── Export CSV ────────────────────────────────────────────────────────────────
@router.post("/export/csv")
def export_csv(request: BatchPredictRequest):
    """Export kết quả phân tích nhiều URL ra file CSV."""
    if not ModelStore.is_ready():
        raise HTTPException(503, "Model chưa được load")
    try:
        csv_content = export_batch_csv(request.urls)
        return StreamingResponse(
            io.StringIO(csv_content),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=secureai_report.csv"}
        )
    except Exception as e:
        raise HTTPException(500, str(e))


# ── Export JSON Summary ───────────────────────────────────────────────────────
@router.post("/export/json")
def export_json(request: BatchPredictRequest):
    """Export summary report dạng JSON."""
    if not ModelStore.is_ready():
        raise HTTPException(503, "Model chưa được load")
    try:
        return export_summary_json(request.urls)
    except Exception as e:
        raise HTTPException(500, str(e))


# ── Stats ─────────────────────────────────────────────────────────────────────
@router.post("/stats")
def stats(request: BatchPredictRequest):
    """Thống kê nhanh cho danh sách URLs — dùng cho Dashboard charts."""
    if not ModelStore.is_ready():
        raise HTTPException(503, "Model chưa được load")
    try:
        results     = predict_batch(request.urls)
        label_count = {"benign": 0, "phishing": 0, "malware": 0, "defacement": 0}
        risk_scores = []
        for r in results:
            label_count[r["label"]] = label_count.get(r["label"], 0) + 1
            risk_scores.append(r["risk_score"])
        return {
            "total":           len(results),
            "label_breakdown": label_count,
            "avg_risk_score":  round(sum(risk_scores) / len(risk_scores), 4) if risk_scores else 0,
            "high_risk_count": sum(1 for s in risk_scores if s >= 0.85),
        }
    except Exception as e:
        raise HTTPException(500, str(e))


# ── Email analyze ─────────────────────────────────────────────────────────────
@router.post("/analyze/email", response_model=EmailAnalyzeResponse)
def analyze_email(request: EmailAnalyzeRequest):
    """Phân tích email phishing: header + body + URL predict."""
    try:
        msg = _parse_email(request.raw_email)
    except Exception as e:
        raise HTTPException(400, f"Không parse được email: {e}")

    header_features = extract_header_features(msg)
    body_features   = extract_body_features(msg)

    url_results = []
    if request.analyze_urls and ModelStore.is_ready():
        for url in extract_urls(request.raw_email)[:20]:
            try:
                url_results.append(predict_url(url))
            except Exception:
                pass

    risk_score, verdict, reasons = compute_email_risk_score(
        header_features, body_features, url_results)

    action = "block" if risk_score >= 0.75 else ("review" if risk_score >= 0.45 else "allow")

    return EmailAnalyzeResponse(
        verdict    = verdict,
        risk_score = risk_score,
        reasons    = reasons,
        header_flags = {
            "spf_pass":           header_features.get("has_spf_pass"),
            "dkim_pass":          header_features.get("has_dkim_pass"),
            "dmarc_pass":         header_features.get("has_dmarc_pass"),
            "reply_to_mismatch":  header_features.get("reply_to_mismatch"),
            "suspicious_xmailer": header_features.get("suspicious_xmailer"),
            "from_domain":        header_features.get("from_domain"),
            "subject":            header_features.get("subject"),
        },
        body_flags = {
            "urgency_keywords":  body_features.get("urgency_keyword_count"),
            "phishing_keywords": body_features.get("phishing_keyword_count"),
            "brand_mismatch":    body_features.get("brand_mismatch"),
            "mentioned_brands":  body_features.get("mentioned_brands"),
            "has_html_form":     body_features.get("has_html_form"),
            "link_count":        body_features.get("link_count"),
        },
        urls_found = [
            UrlResult(url=u.get("url",""), label=u.get("label","unknown"),
                      risk_score=u.get("risk_score",0), action=u.get("action","allow"))
            for u in url_results
        ],
        action = action,
    )


# ── Baseline compare ──────────────────────────────────────────────────────────
@router.post("/baseline/compare", response_model=BaselineResponse)
def baseline_compare(request: BaselineRequest):
    """So sánh BiLSTM với Blacklist, Rule-based, LightGBM."""
    if not ModelStore.is_ready():
        raise HTTPException(503, "Model chưa được load")
    try:
        bilstm_result = predict_url(request.url)
    except Exception as e:
        raise HTTPException(500, f"BiLSTM predict lỗi: {e}")

    comparison = run_baseline_comparison(request.url, bilstm_result)

    return BaselineResponse(
        url             = comparison["url"],
        methods         = [MethodResult(**m) for m in comparison["methods"]],
        agreement       = comparison["agreement"],
        consensus_label = comparison["consensus_label"],
        summary         = comparison["summary"],
    )


# ── Health check ──────────────────────────────────────────────────────────────
@router.get("/health")
def health():
    return {
        "status":       "ok" if ModelStore.is_ready() else "model_not_loaded",
        "model_ready":  ModelStore.is_ready(),
        "device":       str(ModelStore.device),
    }


# ── Model info ────────────────────────────────────────────────────────────────
@router.get("/model/info")
def model_info():
    if not ModelStore.is_ready():
        raise HTTPException(503, "Model chưa được load")
    meta = ModelStore.metadata or {}
    return {
        "model_version":  meta.get("model_version",    "unknown"),
        "architecture":   meta.get("architecture",     "BiLSTM + Self-Attention"),
        "accuracy":       meta.get("best_metrics", {}).get("accuracy"),
        "f1_weighted":    meta.get("best_metrics", {}).get("f1_weighted"),
        "roc_auc":        meta.get("best_metrics", {}).get("roc_auc"),
        "label_classes":  meta.get("label_classes",    []),
        "dataset_size":   meta.get("dataset_size",     0),
        "epochs_trained": meta.get("epochs_trained",   0),
        "generated_at":   meta.get("generated_at",     ""),
    }


# ── Single URL predict ────────────────────────────────────────────────────────
@router.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    if not ModelStore.is_ready():
        raise HTTPException(503, "Model chưa được load — kiểm tra thư mục models/")
    try:
        result = predict_url(request.url)
        return result
    except Exception as e:
        raise HTTPException(500, f"Lỗi inference: {str(e)}")


# ── Batch predict ─────────────────────────────────────────────────────────────
@router.post("/predict/batch")
def predict_batch_endpoint(request: BatchPredictRequest):
    if not ModelStore.is_ready():
        raise HTTPException(503, "Model chưa được load")
    try:
        results = predict_batch(request.urls)
        return {"results": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(500, f"Lỗi batch inference: {str(e)}")


# ── Email analyze ─────────────────────────────────────────────────────────────
@router.post("/analyze/email", response_model=EmailAnalyzeResponse)
def analyze_email(request: EmailAnalyzeRequest):
    """
    Phân tích email phishing:
    - Header features (SPF/DKIM/DMARC, Reply-To mismatch)
    - Body/NLP features (urgency keywords, brand mismatch, HTML form)
    - URL extraction + BiLSTM predict từng URL
    - Tổng hợp risk score
    """
    try:
        msg = _parse_email(request.raw_email)
    except Exception as e:
        raise HTTPException(400, f"Không parse được email: {e}")

    # Extract features
    header_features = extract_header_features(msg)
    body_features   = extract_body_features(msg)

    # Predict URLs trong email
    url_results = []
    if request.analyze_urls and ModelStore.is_ready():
        urls = extract_urls(request.raw_email)
        for url in urls[:20]:   # giới hạn 20 URLs
            try:
                r = predict_url(url)
                url_results.append(r)
            except Exception:
                pass

    # Compute overall score
    risk_score, verdict, reasons = compute_email_risk_score(
        header_features, body_features, url_results
    )

    # Action mapping
    if risk_score >= 0.75:
        action = "block"
    elif risk_score >= 0.45:
        action = "review"
    else:
        action = "allow"

    # Build response
    url_dtos = [
        UrlResult(
            url        = u.get("url", ""),
            label      = u.get("label", "unknown"),
            risk_score = u.get("risk_score", 0),
            action     = u.get("action", "allow"),
        )
        for u in url_results
    ]

    return EmailAnalyzeResponse(
        verdict      = verdict,
        risk_score   = risk_score,
        reasons      = reasons,
        header_flags = {
            "spf_pass":          header_features.get("has_spf_pass"),
            "dkim_pass":         header_features.get("has_dkim_pass"),
            "dmarc_pass":        header_features.get("has_dmarc_pass"),
            "reply_to_mismatch": header_features.get("reply_to_mismatch"),
            "suspicious_xmailer":header_features.get("suspicious_xmailer"),
            "from_domain":       header_features.get("from_domain"),
            "subject":           header_features.get("subject"),
        },
        body_flags = {
            "urgency_keywords":  body_features.get("urgency_keyword_count"),
            "phishing_keywords": body_features.get("phishing_keyword_count"),
            "brand_mismatch":    body_features.get("brand_mismatch"),
            "mentioned_brands":  body_features.get("mentioned_brands"),
            "has_html_form":     body_features.get("has_html_form"),
            "link_count":        body_features.get("link_count"),
        },
        urls_found = url_dtos,
        action     = action,
    )


# ── Baseline comparison ───────────────────────────────────────────────────────
@router.post("/baseline/compare", response_model=BaselineResponse)
def baseline_compare(request: BaselineRequest):
    """
    So sánh BiLSTM với 3 phương pháp truyền thống:
    - Blacklist check
    - Rule-based heuristics
    - LightGBM (classical ML)
    - BiLSTM + Attention (proposed model)
    """
    if not ModelStore.is_ready():
        raise HTTPException(503, "Model chưa được load")

    try:
        bilstm_result = predict_url(request.url)
    except Exception as e:
        raise HTTPException(500, f"BiLSTM predict lỗi: {e}")

    comparison = run_baseline_comparison(
        url           = request.url,
        bilstm_result = bilstm_result,
        lgb_model     = None,   # TODO: load LightGBM pkl nếu có
        label_encoder = None,
    )

    method_dtos = [
        MethodResult(
            method     = m["method"],
            label      = m["label"],
            risk_score = m["risk_score"],
            confidence = m["confidence"],
            reason     = m["reason"],
            latency_ms = m["latency_ms"],
        )
        for m in comparison["methods"]
    ]

    return BaselineResponse(
        url             = comparison["url"],
        methods         = method_dtos,
        agreement       = comparison["agreement"],
        consensus_label = comparison["consensus_label"],
        summary         = comparison["summary"],
    )


# ── Extract email từ ảnh/PDF ──────────────────────────────────────────────────
@router.post("/extract/email")
async def extract_email(file: UploadFile = File(...)):
    """Upload ảnh/PDF → Gemini đọc → trả về { from, to, subject, body }"""

    # 1. Kiểm tra API key
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        raise HTTPException(400,
            "Chưa set GEMINI_API_KEY. Tạo file .env trong thư mục secureai_ai:\n"
            "GEMINI_API_KEY=AIzaSy...")

    # 2. Kiểm tra file type — linh hoạt hơn
    ct = (file.content_type or "").lower()
    if not (ct.startswith("image/") or ct == "application/pdf"):
        raise HTTPException(400,
            f"Chỉ hỗ trợ ảnh (PNG/JPG/WEBP) hoặc PDF. Nhận được: '{ct}'")

    # Normalize content type
    if ct in ("image/jpg", "image/pjpeg"):
        ct = "image/jpeg"

    # 3. Đọc file
    file_bytes = await file.read()
    size_mb = len(file_bytes) / 1024 / 1024
    if size_mb > 10:
        raise HTTPException(400, f"File quá lớn: {size_mb:.1f}MB (tối đa 10MB)")

    print(f"📎 Extract email — file: {file.filename}, type: {ct}, size: {size_mb:.2f}MB")

    # 4. Gọi Gemini
    try:
        result = await extract_email_from_file(file_bytes, ct, api_key)
        print(f"✅ Extract thành công — from: {result.get('from', '')}")
        return result
    except Exception as e:
        print(f"❌ Gemini error: {e}")
        raise HTTPException(500, f"Gemini API lỗi: {str(e)}")