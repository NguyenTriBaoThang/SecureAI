import torch
import torch.nn.functional as F
import numpy as np
from src.config import MAX_LEN, THRESHOLD_BLOCK, THRESHOLD_ALERT
from src.features import clean_url
from src.loader import ModelStore


def tokenize(url: str, tokenizer: dict, max_len: int) -> torch.Tensor:
    """ChuyÃ¡Â»Æ’n URL thÃƒÂ nh tensor token ids (character-level)."""
    clean  = clean_url(url)
    tokens = [tokenizer.get(c, 0) for c in clean[:max_len]]
    # Padding
    tokens += [0] * (max_len - len(tokens))
    return torch.tensor([tokens], dtype=torch.long)


def predict_url(url: str) -> dict:
    """
    ChÃ¡ÂºÂ¡y inference cho 1 URL.
    TrÃ¡ÂºÂ£ vÃ¡Â»Â dict tÃ†Â°Ã†Â¡ng thÃƒÂ­ch vÃ¡Â»â€ºi MlBridgeService cÃ¡Â»Â§a .NET backend.
    """
    store = ModelStore
    if not store.is_ready():
        raise RuntimeError("Model chÃ†Â°a Ã„â€˜Ã†Â°Ã¡Â»Â£c load")

    # Tokenize
    input_tensor = tokenize(url, store.tokenizer, MAX_LEN).to(store.device)

    # Inference
    with torch.no_grad():
        logits, attention_weights = store.model(input_tensor)

    # Probabilities
    probs      = F.softmax(logits, dim=-1).squeeze(0).detach().cpu().numpy()
    classes    = [str(c) for c in store.label_encoder.classes_]
    label_idx  = int(np.argmax(probs))
    label      = str(classes[label_idx])
    risk_score = float(1.0 - probs[list(classes).index("benign")])

    # Map label Ã¢â€ â€™ prob keys
    prob_map = {c: float(probs[i]) for i, c in enumerate(classes)}

    # Action mapping
    if risk_score >= THRESHOLD_BLOCK:
        action = "block"
    elif risk_score >= THRESHOLD_ALERT:
        action = "alert"
    else:
        action = "allow"

    # Top attention tokens
    attn_weights = attention_weights.squeeze(0).detach().cpu().numpy()
    clean        = clean_url(url)
    n_chars      = min(len(clean), MAX_LEN)
    top_n        = 10

    char_weights = [
        {"char": clean[i], "weight": float(attn_weights[i])}
        for i in range(n_chars)
    ]
    top_attention = sorted(char_weights, key=lambda x: x["weight"], reverse=True)[:top_n]

    return {
        "url":            url,
        "label":          label,
        "risk_score":     round(risk_score, 4),
        "probabilities": {
            "benign":      round(prob_map.get("benign",      0.0), 4),
            "phishing":    round(prob_map.get("phishing",    0.0), 4),
            "malware":     round(prob_map.get("malware",     0.0), 4),
            "defacement":  round(prob_map.get("defacement",  0.0), 4),
        },
        "top_attention":  top_attention,
        "action":         action,
    }


def predict_batch(urls: list[str]) -> list[dict]:
    """Predict nhiÃ¡Â»Âu URLs cÃƒÂ¹ng lÃƒÂºc (vectorized)."""
    return [predict_url(url) for url in urls]
