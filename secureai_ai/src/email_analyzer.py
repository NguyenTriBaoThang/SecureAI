"""
Email Phishing Analyzer
Phân tích email dựa trên:
  1. Header features (SPF/DKIM/DMARC, Reply-To mismatch, ...)
  2. Body/content features (NLP keywords, urgency, brand mismatch)
  3. URL extraction → gọi BiLSTM predict mỗi URL trong email
  4. Kết hợp scores → risk score tổng hợp
"""

import re
import math
import email
from email import policy
from email.parser import BytesParser, Parser
from urllib.parse import urlparse
from typing import Optional


# ── Keyword banks ─────────────────────────────────────────────────────────────
URGENCY_KEYWORDS = [
    "urgent", "immediately", "action required", "verify now", "confirm your",
    "suspended", "locked", "limited time", "expires", "click here",
    "update your", "unusual activity", "unauthorized", "security alert",
    "khẩn cấp", "xác minh ngay", "tài khoản bị khóa", "cập nhật ngay",
]

PHISHING_KEYWORDS = [
    "password", "credit card", "bank account", "social security", "ssn",
    "login", "signin", "verify identity", "confirm identity", "billing",
    "paypal", "apple id", "microsoft account", "amazon", "netflix",
    "mật khẩu", "tài khoản ngân hàng", "thẻ tín dụng", "đăng nhập",
]

TRUSTED_BRANDS = [
    "paypal", "apple", "microsoft", "amazon", "google", "facebook",
    "netflix", "dropbox", "linkedin", "twitter", "instagram", "bank",
    "vietcombank", "techcombank", "bidv", "agribank", "mbbank",
]


# ── Feature extractors ────────────────────────────────────────────────────────
def _parse_email(raw: str) -> email.message.Message:
    """Parse raw email string thành Message object."""
    try:
        return Parser(policy=policy.default).parsestr(raw)
    except Exception:
        # Fallback: tạo message giả với body = raw
        msg = email.message.EmailMessage()
        msg.set_payload(raw)
        return msg


def extract_header_features(msg: email.message.Message) -> dict:
    """
    Trích xuất email header features:
    - SPF / DKIM / DMARC alignment
    - Reply-To mismatch với From
    - Suspicious X-Mailer
    - Received chain length
    """
    features = {
        "has_spf_pass":    False,
        "has_dkim_pass":   False,
        "has_dmarc_pass":  False,
        "reply_to_mismatch": False,
        "suspicious_xmailer": False,
        "received_chain_length": 0,
        "from_domain": "",
        "reply_to_domain": "",
        "subject": "",
    }

    # Authentication-Results header
    auth_results = str(msg.get("Authentication-Results", "")).lower()
    features["has_spf_pass"]   = "spf=pass"   in auth_results
    features["has_dkim_pass"]  = "dkim=pass"  in auth_results
    features["has_dmarc_pass"] = "dmarc=pass" in auth_results

    # From vs Reply-To domain
    from_addr     = str(msg.get("From", ""))
    reply_to_addr = str(msg.get("Reply-To", ""))

    from_domain    = _extract_domain(from_addr)
    replyto_domain = _extract_domain(reply_to_addr)

    features["from_domain"]    = from_domain
    features["reply_to_domain"] = replyto_domain

    if reply_to_addr and from_domain and replyto_domain:
        features["reply_to_mismatch"] = (from_domain != replyto_domain)

    # X-Mailer suspicious
    xmailer = str(msg.get("X-Mailer", "")).lower()
    suspicious_mailers = ["phpmailer", "sendblaster", "mass mailer", "bulk"]
    features["suspicious_xmailer"] = any(s in xmailer for s in suspicious_mailers)

    # Received chain
    received = msg.get_all("Received", [])
    features["received_chain_length"] = len(received)

    # Subject
    features["subject"] = str(msg.get("Subject", ""))

    return features


def extract_body_features(msg: email.message.Message) -> dict:
    """
    Trích xuất body/content features:
    - Urgency keyword count
    - Phishing keyword count
    - Brand mismatch (mention brand != from domain)
    - HTML form present (credential harvesting)
    - Link count
    - Text entropy
    """
    body = _get_body(msg)
    body_lower = body.lower()

    features = {
        "urgency_keyword_count":  0,
        "phishing_keyword_count": 0,
        "brand_mismatch":         False,
        "has_html_form":          False,
        "has_hidden_iframe":      False,
        "link_count":             0,
        "text_length":            len(body),
        "text_entropy":           0.0,
        "mentioned_brands":       [],
    }

    # Keyword counts
    features["urgency_keyword_count"]  = sum(1 for kw in URGENCY_KEYWORDS  if kw in body_lower)
    features["phishing_keyword_count"] = sum(1 for kw in PHISHING_KEYWORDS if kw in body_lower)

    # HTML indicators
    features["has_html_form"]    = bool(re.search(r"<form[\s>]", body, re.I))
    features["has_hidden_iframe"] = bool(re.search(r"<iframe[^>]+display\s*:\s*none", body, re.I))

    # URLs / links
    urls = extract_urls(body)
    features["link_count"] = len(urls)

    # Mentioned brands vs from domain
    from_domain = str(msg.get("From", "")).lower()
    mentioned   = [b for b in TRUSTED_BRANDS if b in body_lower]
    features["mentioned_brands"] = mentioned

    if mentioned:
        # Brand mismatch: mentions a trusted brand but from domain doesn't match
        features["brand_mismatch"] = not any(b in from_domain for b in mentioned)

    # Text entropy
    if body:
        freq = {}
        for c in body:
            freq[c] = freq.get(c, 0) + 1
        n = len(body)
        features["text_entropy"] = -sum((v/n) * math.log2(v/n) for v in freq.values())

    return features


def extract_urls(text: str) -> list[str]:
    """Tìm tất cả URLs trong text/HTML."""
    patterns = [
        r'https?://[^\s<>"\']+',
        r'href=["\']([^"\']+)["\']',
        r'src=["\']([^"\']+)["\']',
    ]
    urls = []
    for p in patterns:
        matches = re.findall(p, text, re.I)
        urls.extend(matches)
    # Deduplicate, filter valid
    seen = set()
    result = []
    for u in urls:
        u = u.strip().rstrip(".,;)")
        if u not in seen and u.startswith("http"):
            seen.add(u)
            result.append(u)
    return result


def _get_body(msg: email.message.Message) -> str:
    """Extract text body từ email (plain text + HTML)."""
    body_parts = []
    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            if ctype in ("text/plain", "text/html"):
                try:
                    body_parts.append(part.get_content())
                except Exception:
                    payload = part.get_payload(decode=True)
                    if payload:
                        body_parts.append(payload.decode("utf-8", errors="replace"))
    else:
        try:
            body_parts.append(msg.get_content())
        except Exception:
            payload = msg.get_payload(decode=True)
            if payload:
                body_parts.append(payload.decode("utf-8", errors="replace"))
    return "\n".join(body_parts)


def _extract_domain(addr: str) -> str:
    """Lấy domain từ email address."""
    match = re.search(r"@([\w.-]+)", addr)
    return match.group(1).lower() if match else ""


# ── Risk scoring ──────────────────────────────────────────────────────────────
def compute_email_risk_score(
    header_features: dict,
    body_features:   dict,
    url_results:     list[dict],
) -> tuple[float, str, list[str]]:
    """
    Tính risk score tổng hợp cho email (0.0 → 1.0).
    Trả về: (risk_score, verdict, reasons)
    """
    score   = 0.0
    reasons = []

    # ── Header signals (40% weight) ───────────────────────────────────────────
    if not header_features.get("has_spf_pass"):
        score += 0.10
        reasons.append("SPF không pass")
    if not header_features.get("has_dkim_pass"):
        score += 0.08
        reasons.append("DKIM không pass")
    if not header_features.get("has_dmarc_pass"):
        score += 0.07
        reasons.append("DMARC không pass")
    if header_features.get("reply_to_mismatch"):
        score += 0.12
        reasons.append(f"Reply-To domain khác From domain")
    if header_features.get("suspicious_xmailer"):
        score += 0.05
        reasons.append("X-Mailer đáng ngờ (mass mailer)")

    # ── Body signals (30% weight) ─────────────────────────────────────────────
    urgency = body_features.get("urgency_keyword_count", 0)
    if urgency >= 3:
        score += 0.12
        reasons.append(f"{urgency} từ khẩn cấp trong nội dung")
    elif urgency >= 1:
        score += 0.05

    phishing_kw = body_features.get("phishing_keyword_count", 0)
    if phishing_kw >= 2:
        score += 0.10
        reasons.append(f"{phishing_kw} từ khóa phishing trong nội dung")

    if body_features.get("brand_mismatch"):
        score += 0.15
        brands = body_features.get("mentioned_brands", [])
        reasons.append(f"Brand mismatch: đề cập {brands} nhưng domain không khớp")

    if body_features.get("has_html_form"):
        score += 0.10
        reasons.append("Có form HTML thu thập thông tin")

    if body_features.get("has_hidden_iframe"):
        score += 0.08
        reasons.append("Có hidden iframe")

    # ── URL signals (30% weight) ──────────────────────────────────────────────
    if url_results:
        max_url_risk = max(u.get("risk_score", 0) for u in url_results)
        malicious_urls = [u for u in url_results if u.get("label") != "benign"]

        score += max_url_risk * 0.30
        if malicious_urls:
            reasons.append(f"{len(malicious_urls)}/{len(url_results)} URL bị phát hiện độc hại")

    # Clamp to [0, 1]
    score = min(1.0, score)

    # Verdict
    if score >= 0.75:
        verdict = "phishing"
    elif score >= 0.45:
        verdict = "suspicious"
    else:
        verdict = "benign"

    return round(score, 4), verdict, reasons
