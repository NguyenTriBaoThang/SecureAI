from pydantic import BaseModel, field_validator


class PredictRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def url_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("URL không được để trống")
        return v


class BatchPredictRequest(BaseModel):
    urls: list[str]

    @field_validator("urls")
    @classmethod
    def urls_not_empty(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("Danh sách URLs không được rỗng")
        if len(v) > 100:
            raise ValueError("Tối đa 100 URLs mỗi batch")
        return v


class AttentionToken(BaseModel):
    char:   str
    weight: float


class Probabilities(BaseModel):
    benign:     float
    phishing:   float
    malware:    float
    defacement: float


class PredictResponse(BaseModel):
    url:            str
    label:          str
    risk_score:     float
    probabilities:  Probabilities
    top_attention:  list[AttentionToken]
    action:         str   # allow / alert / block


# ── Email schemas ─────────────────────────────────────────────────────────────
class EmailAnalyzeRequest(BaseModel):
    raw_email: str           # raw email string (headers + body)
    analyze_urls: bool = True  # apakah ikut predict URL dalam email

    @field_validator("raw_email")
    @classmethod
    def not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("raw_email không được để trống")
        return v


class UrlResult(BaseModel):
    url:        str
    label:      str
    risk_score: float
    action:     str


class EmailAnalyzeResponse(BaseModel):
    verdict:      str          # benign / suspicious / phishing
    risk_score:   float
    reasons:      list[str]
    header_flags: dict
    body_flags:   dict
    urls_found:   list[UrlResult]
    action:       str          # allow / review / block


# ── Baseline schemas ──────────────────────────────────────────────────────────
class BaselineRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def url_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("URL không được để trống")
        return v


class MethodResult(BaseModel):
    method:     str
    label:      str
    risk_score: float
    confidence: float
    reason:     str
    latency_ms: float


class BaselineResponse(BaseModel):
    url:             str
    methods:         list[MethodResult]
    agreement:       bool
    consensus_label: str
    summary:         dict

