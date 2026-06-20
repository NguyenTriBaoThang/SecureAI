"""
Baseline Comparison Module
So sánh BiLSTM với 3 phương pháp truyền thống:
  1. Blacklist check (domain/URL blacklist)
  2. Rule-based heuristics (regex patterns)
  3. LightGBM (classical ML baseline — load từ pkl nếu có)

Mỗi method trả về: { label, risk_score, confidence, reason }
"""

import re
import time
from urllib.parse import urlparse
from src.features import clean_url, extract_features


# ── Built-in blacklist (demo — production cần PhishTank/OpenPhish feed) ───────
BLACKLIST_DOMAINS = {
    "free-apple-login-verify.net",
    "secure-paypal-update-info.com",
    "icloud-locked-device.support",
    "amazon-security-alert.info",
    "facebook-account-suspended.net",
    "banking-alert-login.com",
    "download-crack-software.ru",
    "malware-payload-download.ru",
    "trojan-dropper-host.xyz",
    "warez-full-crack.net",
    "hack-deface-site.org",
    "government-hacked.net",
}

# Suspicious TLDs (high-risk)
SUSPICIOUS_TLDS = {
    ".xyz", ".top", ".click", ".work", ".party", ".loan",
    ".win", ".download", ".accountant", ".cricket", ".science",
    ".ru", ".cn", ".tk", ".ml", ".ga", ".cf",
}

# Regex patterns for rule-based
RULE_PATTERNS = [
    (r"(login|signin|verify|confirm|secure|update|account)\.(php|html?|aspx)", 0.7, "Credential harvesting page"),
    (r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}",           0.8, "IP address in URL"),
    (r"@",                                               0.7, "@ symbol in URL"),
    (r"-{2,}",                                           0.5, "Multiple dashes (obfuscation)"),
    (r"(free|win|prize|lucky|claim)",                    0.5, "Prize/free keyword"),
    (r"(setup|install|crack|keygen|patch)\.exe",         0.9, "Executable file"),
    (r"\.(zip|rar|exe|bat|cmd|scr|pif)$",               0.8, "Dangerous file extension"),
    (r"[a-z0-9]{20,}\.(com|net|org)",                   0.6, "Random long subdomain"),
    (r"(paypal|apple|amazon|google|microsoft|facebook)"
     r"[^.]*\.(net|org|info|biz|xyz)",                  0.85, "Brand impersonation"),
]


# ── Method 1: Blacklist ───────────────────────────────────────────────────────
def blacklist_check(url: str) -> dict:
    """Kiểm tra URL trong blacklist domain."""
    t0 = time.perf_counter()

    clean  = clean_url(url)
    parsed = urlparse(url if url.startswith("http") else f"http://{url}")
    domain = parsed.netloc.lower().lstrip("www.")

    # Exact match
    if domain in BLACKLIST_DOMAINS:
        return _result("phishing", 0.99, 0.99,
                       f"Domain {domain} có trong blacklist",
                       time.perf_counter() - t0, "blacklist")

    # Substring match
    for bd in BLACKLIST_DOMAINS:
        if bd in clean:
            return _result("phishing", 0.90, 0.85,
                           f"URL chứa domain blacklist: {bd}",
                           time.perf_counter() - t0, "blacklist")

    return _result("benign", 0.05, 0.60,
                   "Không tìm thấy trong blacklist (chưa chắc an toàn)",
                   time.perf_counter() - t0, "blacklist")


# ── Method 2: Rule-based ─────────────────────────────────────────────────────
def rule_based_check(url: str) -> dict:
    """Áp dụng regex rules để phát hiện phishing patterns."""
    t0 = time.perf_counter()

    clean      = clean_url(url)
    max_score  = 0.0
    fired_rules = []

    for pattern, score, reason in RULE_PATTERNS:
        if re.search(pattern, clean, re.I):
            fired_rules.append(reason)
            max_score = max(max_score, score)

    # TLD check
    for tld in SUSPICIOUS_TLDS:
        if clean.lower().endswith(tld) or f"{tld}/" in clean.lower():
            fired_rules.append(f"Suspicious TLD: {tld}")
            max_score = max(max_score, 0.65)

    # URL length
    if len(clean) > 100:
        fired_rules.append(f"URL quá dài ({len(clean)} ký tự)")
        max_score = max(max_score, 0.55)

    if not fired_rules:
        return _result("benign", 0.10, 0.55,
                       "Không trigger rule nào",
                       time.perf_counter() - t0, "rule_based")

    label = "phishing" if max_score >= 0.70 else "suspicious"
    return _result(label, max_score, 0.70,
                   f"Rules triggered: {'; '.join(fired_rules)}",
                   time.perf_counter() - t0, "rule_based")


# ── Method 3: LightGBM (classical ML) ────────────────────────────────────────
def lightgbm_check(url: str, lgb_model=None, label_encoder=None) -> dict:
    """
    LightGBM với 15 handcrafted features.
    Nếu không có model → dùng rule-based fallback với features.
    """
    t0 = time.perf_counter()

    features = extract_features(url)

    if lgb_model is None:
        # Heuristic scoring từ features (không có model thật)
        score = _heuristic_from_features(features)
        label = "phishing" if score >= 0.70 else ("suspicious" if score >= 0.40 else "benign")
        return _result(label, round(score, 4), 0.65,
                       "LightGBM heuristic (model chưa load)",
                       time.perf_counter() - t0, "lightgbm")

    try:
        import numpy as np
        X     = np.array(features).reshape(1, -1)
        proba = lgb_model.predict_proba(X)[0]
        classes = label_encoder.classes_ if label_encoder else ["benign", "defacement", "malware", "phishing"]
        idx   = int(np.argmax(proba))
        label = str(classes[idx])
        score = float(1.0 - proba[list(classes).index("benign")] if "benign" in list(classes) else proba[idx])
        return _result(label, round(score, 4), round(float(proba[idx]), 4),
                       f"LightGBM predict: {dict(zip(classes, proba.round(3)))}",
                       time.perf_counter() - t0, "lightgbm")
    except Exception as e:
        return _result("error", 0.0, 0.0, str(e),
                       time.perf_counter() - t0, "lightgbm")


# ── Comparison runner ─────────────────────────────────────────────────────────
def run_baseline_comparison(
    url: str,
    bilstm_result: dict,
    lgb_model=None,
    label_encoder=None,
) -> dict:
    """
    Chạy tất cả methods và tổng hợp kết quả so sánh.
    bilstm_result: kết quả từ predictor.predict_url()
    """
    bl = blacklist_check(url)
    rb = rule_based_check(url)
    lgb = lightgbm_check(url, lgb_model, label_encoder)

    # BiLSTM result shape
    bilstm = {
        "method":     "bilstm_attention",
        "label":      bilstm_result.get("label", "unknown"),
        "risk_score": bilstm_result.get("risk_score", 0),
        "confidence": bilstm_result.get("risk_score", 0),
        "reason":     f"BiLSTM+Attention: top attention chars = {bilstm_result.get('top_attention', [])[:3]}",
        "latency_ms": 0,
    }

    methods = [bl, rb, lgb, bilstm]

    # Agreement analysis
    labels    = [m["label"] for m in methods if m["label"] not in ("error", "unknown")]
    verdicts  = set(labels)
    agreement = len(verdicts) == 1

    return {
        "url":        url,
        "methods":    methods,
        "agreement":  agreement,
        "consensus_label": _majority_vote(labels),
        "summary": {
            "blacklist":       bl["label"],
            "rule_based":      rb["label"],
            "lightgbm":        lgb["label"],
            "bilstm_attention": bilstm["label"],
        }
    }


# ── Helpers ───────────────────────────────────────────────────────────────────
def _result(label, risk_score, confidence, reason, latency_s, method) -> dict:
    return {
        "method":     method,
        "label":      label,
        "risk_score": round(risk_score, 4),
        "confidence": round(confidence, 4),
        "reason":     reason,
        "latency_ms": round(latency_s * 1000, 2),
    }


def _majority_vote(labels: list[str]) -> str:
    if not labels:
        return "unknown"
    counts = {}
    for l in labels:
        counts[l] = counts.get(l, 0) + 1
    return max(counts, key=counts.get)


def _heuristic_from_features(features: list[float]) -> float:
    """
    Tính risk score từ 15 features mà không cần model.
    Chỉ dùng khi LightGBM chưa load.
    """
    if len(features) < 15:
        return 0.3
    url_len, dot_cnt, dash_cnt, slash_cnt, at_cnt, q_cnt, eq_cnt, \
    digit_ratio, has_ip, has_https, subdomain_len, path_cnt, \
    url_entropy, has_login, has_free = features

    score = 0.0
    if url_len > 75:      score += 0.15
    if dot_cnt > 4:       score += 0.10
    if dash_cnt > 2:      score += 0.10
    if at_cnt > 0:        score += 0.20
    if has_ip:            score += 0.25
    if not has_https:     score += 0.10
    if subdomain_len > 20: score += 0.10
    if has_login:         score += 0.15
    if has_free:          score += 0.10
    if url_entropy > 4.5: score += 0.10

    return min(1.0, score)
