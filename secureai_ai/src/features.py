import re
import math
from urllib.parse import urlparse


def clean_url(url: str) -> str:
    """Xoá scheme và www., giữ lại phần còn lại."""
    url = url.strip().lower()
    url = re.sub(r"^https?://", "", url)
    url = re.sub(r"^www\.", "", url)
    return url


def extract_features(url: str) -> list[float]:
    """
    Trích xuất 15 handcrafted features từ URL.
    Phải khớp chính xác với hàm extract_features() trong notebook.
    """
    clean  = clean_url(url)
    parsed = urlparse(url if url.startswith("http") else f"http://{url}")
    netloc = parsed.netloc or clean.split("/")[0]
    path   = parsed.path or ""

    def entropy(s: str) -> float:
        if not s:
            return 0.0
        freq = {c: s.count(c) / len(s) for c in set(s)}
        return -sum(p * math.log2(p) for p in freq.values())

    url_len       = len(clean)
    dot_cnt       = clean.count(".")
    dash_cnt      = clean.count("-")
    slash_cnt     = clean.count("/")
    at_cnt        = clean.count("@")
    q_cnt         = clean.count("?")
    eq_cnt        = clean.count("=")
    digit_ratio   = sum(c.isdigit() for c in clean) / max(len(clean), 1)
    has_ip        = int(bool(re.match(r"\d+\.\d+\.\d+\.\d+", netloc)))
    has_https     = int(url.startswith("https"))
    subdomain_len = len(netloc.split(".")[0]) if "." in netloc else len(netloc)
    path_cnt      = path.count("/")
    url_entropy   = entropy(clean)
    has_login     = int(any(kw in clean for kw in ["login", "signin", "verify", "account", "secure", "update"]))
    has_free      = int(any(kw in clean for kw in ["free", "win", "prize", "click", "download", "lucky"]))

    return [
        url_len, dot_cnt, dash_cnt, slash_cnt, at_cnt, q_cnt, eq_cnt,
        digit_ratio, has_ip, has_https, subdomain_len, path_cnt,
        url_entropy, has_login, has_free,
    ]
