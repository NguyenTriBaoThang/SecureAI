import json
import os
from pathlib import Path
from typing import Any

# Directory containing model artifacts (.pt, .pkl, .json).
MODELS_DIR = Path(__file__).parent.parent / "models"


def _artifact_path(env_name: str, default_name: str) -> Path:
    value = os.getenv(env_name, default_name).strip()
    path = Path(value)
    return path if path.is_absolute() else MODELS_DIR / value


def _first_existing(env_name: str, candidates: list[str]) -> Path:
    override = os.getenv(env_name)
    if override:
        return _artifact_path(env_name, override)

    for candidate in candidates:
        path = MODELS_DIR / candidate
        if path.exists():
            return path

    return MODELS_DIR / candidates[-1]


MODEL_FILE = _first_existing(
    "MODEL_FILE",
    ["Attention_BiLSTM.pt", "secureai_bilstm_attention.pt"],
)
TOKENIZER_FILE = _first_existing(
    "TOKENIZER_FILE",
    ["char2idx.pkl", "tokenizer.pkl"],
)
TOKENIZER_JSON_FILE = _artifact_path("TOKENIZER_JSON_FILE", "tokenizer.json")
LABEL_ENC_FILE = _artifact_path("LABEL_ENCODER_FILE", "label_encoder.pkl")
METADATA_FILE = _artifact_path("MODEL_METADATA_FILE", "model_metadata.json")
MODEL_CONFIG_FILE = _artifact_path("MODEL_CONFIG_FILE", "config.json")
MODEL_COMPARISON_FILE = _artifact_path("MODEL_COMPARISON_FILE", "model_comparison.csv")


def _load_model_config() -> dict[str, Any]:
    if not MODEL_CONFIG_FILE.exists():
        return {}
    try:
        with open(MODEL_CONFIG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


_MODEL_CONFIG = _load_model_config()


def _int_config(key: str, default: int, env_name: str | None = None) -> int:
    env_value = os.getenv(env_name or key.upper())
    if env_value:
        return int(env_value)
    return int(_MODEL_CONFIG.get(key, default))


def _float_config(key: str, default: float, env_name: str | None = None) -> float:
    env_value = os.getenv(env_name or key.upper())
    if env_value:
        return float(env_value)
    return float(_MODEL_CONFIG.get(key, default))


# Server.
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

# Model hyperparameters. Defaults are legacy values, but config.json from the
# benchmark export overrides them automatically.
MAX_LEN = _int_config("max_len", 50, "MAX_LEN")
MAX_WORDS = _int_config("vocab_size", 200, "MAX_WORDS")
EMBED_DIM = _int_config("embed_dim", 128, "EMBED_DIM")
HIDDEN_DIM = _int_config("hidden_dim", 128, "HIDDEN_DIM")
NUM_LAYERS = _int_config("num_layers", 2, "NUM_LAYERS")
NUM_CLASSES = _int_config(
    "num_classes",
    len(_MODEL_CONFIG.get("classes", [])) or 4,
    "NUM_CLASSES",
)
DROPOUT = _float_config("dropout", 0.3, "DROPOUT")

# Risk score threshold -> action.
THRESHOLD_BLOCK = _float_config("threshold_block", 0.85, "THRESHOLD_BLOCK")
THRESHOLD_ALERT = _float_config("threshold_alert", 0.60, "THRESHOLD_ALERT")