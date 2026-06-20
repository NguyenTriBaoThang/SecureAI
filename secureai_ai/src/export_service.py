"""
Export Service — tạo báo cáo từ kết quả phân tích
Hỗ trợ: JSON summary, CSV batch results
"""
import csv
import json
import io
from datetime import datetime
from src.predictor import predict_url
from src.baseline import run_baseline_comparison


def export_batch_csv(urls: list[str], include_baseline: bool = False) -> str:
    """
    Phân tích nhiều URL và xuất kết quả dạng CSV string.
    """
    output = io.StringIO()
    fieldnames = [
        "url", "label", "risk_score",
        "benign_prob", "phishing_prob", "malware_prob", "defacement_prob",
        "action", "analyzed_at"
    ]
    if include_baseline:
        fieldnames += ["blacklist_label", "rule_based_label", "lgb_label", "agreement"]

    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()

    for url in urls:
        try:
            result = predict_url(url)
            row = {
                "url":             url,
                "label":           result["label"],
                "risk_score":      result["risk_score"],
                "benign_prob":     result["probabilities"]["benign"],
                "phishing_prob":   result["probabilities"]["phishing"],
                "malware_prob":    result["probabilities"]["malware"],
                "defacement_prob": result["probabilities"]["defacement"],
                "action":          result["action"],
                "analyzed_at":     datetime.utcnow().isoformat(),
            }
            if include_baseline:
                comparison = run_baseline_comparison(url, result)
                summary    = comparison["summary"]
                row["blacklist_label"]  = summary.get("blacklist", "")
                row["rule_based_label"] = summary.get("rule_based", "")
                row["lgb_label"]        = summary.get("lightgbm", "")
                row["agreement"]        = comparison["agreement"]
            writer.writerow(row)
        except Exception as e:
            writer.writerow({"url": url, "label": f"ERROR: {e}", "risk_score": 0,
                             "benign_prob": 0, "phishing_prob": 0,
                             "malware_prob": 0, "defacement_prob": 0,
                             "action": "error", "analyzed_at": datetime.utcnow().isoformat()})

    return output.getvalue()


def export_summary_json(urls: list[str]) -> dict:
    """
    Phân tích nhiều URL và xuất JSON summary report.
    """
    results     = []
    label_count = {"benign": 0, "phishing": 0, "malware": 0, "defacement": 0}
    action_count= {"allow": 0, "alert": 0, "block": 0}

    for url in urls:
        try:
            r = predict_url(url)
            results.append(r)
            label_count[r["label"]] = label_count.get(r["label"], 0) + 1
            action_count[r["action"]] = action_count.get(r["action"], 0) + 1
        except Exception:
            pass

    total     = len(results)
    malicious = total - label_count.get("benign", 0)

    return {
        "report_generated_at": datetime.utcnow().isoformat(),
        "total_urls":          total,
        "malicious_count":     malicious,
        "malicious_rate":      round(malicious / total, 4) if total else 0,
        "label_breakdown":     label_count,
        "action_breakdown":    action_count,
        "high_risk_urls": [
            {"url": r["url"], "label": r["label"], "risk_score": r["risk_score"]}
            for r in results if r["risk_score"] >= 0.85
        ],
        "results": results,
    }
