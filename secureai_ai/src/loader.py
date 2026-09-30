import json
import pickle
import re
from pathlib import Path
from typing import Any

import numpy as np
import torch
from sklearn.preprocessing import LabelEncoder

from src.config import (
    MODEL_FILE,
    TOKENIZER_FILE,
    TOKENIZER_JSON_FILE,
    LABEL_ENC_FILE,
    METADATA_FILE,
    MODEL_CONFIG_FILE,
    EMBED_DIM,
    HIDDEN_DIM,
    NUM_LAYERS,
    NUM_CLASSES,
    MAX_WORDS,
    DROPOUT,
)
from src.model import BiLSTMAttention


def _load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _load_tokenizer_safe(path: Path) -> dict:
    """Load tokenizer from char2idx/tokenizer pickle formats."""
    with open(path, "rb") as f:
        raw = pickle.load(f)

    if isinstance(raw, dict):
        return raw

    if hasattr(raw, "word_index"):
        return dict(raw.word_index)

    for attr in ("char_index", "token_index", "index"):
        if hasattr(raw, attr):
            return dict(getattr(raw, attr))

    raise ValueError(f"Unsupported tokenizer format: {type(raw)}")


def _build_char_tokenizer() -> dict:
    chars = (
        "abcdefghijklmnopqrstuvwxyz"
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        "0123456789"
        ".-_/\\:?=#@&%+~[]()!*,;$"
    )
    return {c: i + 1 for i, c in enumerate(chars)}


def _load_label_encoder_safe(
    pkl_path: Path,
    metadata: dict[str, Any],
    model_config: dict[str, Any],
) -> LabelEncoder:
    classes = metadata.get("label_classes") or model_config.get("classes")
    if classes:
        le = LabelEncoder()
        le.classes_ = np.array(list(classes))
        print(f"Label classes loaded from metadata/config: {list(le.classes_)}")
        return le

    if pkl_path.exists():
        try:
            with open(pkl_path, "rb") as f:
                le = pickle.load(f)
            print(f"Label encoder loaded from {pkl_path.name}: {list(le.classes_)}")
            return le
        except Exception as exc:
            print(f"Could not load label encoder {pkl_path}: {exc}")

    le = LabelEncoder()
    le.classes_ = np.array(["benign", "defacement", "malware", "phishing"])
    print(f"Using fallback label classes: {list(le.classes_)}")
    return le


def _extract_state_dict(checkpoint: Any) -> dict[str, torch.Tensor]:
    if isinstance(checkpoint, dict):
        for key in ("model_state_dict", "state_dict", "model"):
            value = checkpoint.get(key)
            if isinstance(value, dict):
                return value
        return checkpoint
    raise ValueError(f"Unsupported checkpoint type: {type(checkpoint)}")


def _normalize_state_dict(state: dict[str, torch.Tensor]) -> dict[str, torch.Tensor]:
    normalized: dict[str, torch.Tensor] = {}
    for key, value in state.items():
        clean_key = key
        if clean_key.startswith("module."):
            clean_key = clean_key[len("module."):]
        normalized[clean_key] = value

    # Benchmark notebook saved attention layer as attention.W.*, while the
    # serving model class names it attention.attn.*.
    if "attention.W.weight" in normalized and "attention.attn.weight" not in normalized:
        normalized["attention.attn.weight"] = normalized.pop("attention.W.weight")
    if "attention.W.bias" in normalized and "attention.attn.bias" not in normalized:
        normalized["attention.attn.bias"] = normalized.pop("attention.W.bias")

    return normalized


def _infer_num_layers(state: dict[str, torch.Tensor]) -> int:
    layers = []
    for key in state:
        match = re.search(r"bilstm\.weight_ih_l(\d+)", key)
        if match:
            layers.append(int(match.group(1)))
    return max(layers) + 1 if layers else NUM_LAYERS


def _model_params(
    state: dict[str, torch.Tensor],
    tokenizer: dict,
    label_encoder: LabelEncoder,
    model_config: dict[str, Any],
) -> dict[str, int | float]:
    embedding = state.get("embedding.weight")
    fc_weight = state.get("fc.weight")
    fc_bias = state.get("fc.bias")

    vocab_size = int(model_config.get("vocab_size", MAX_WORDS))
    embed_dim = int(model_config.get("embed_dim", EMBED_DIM))
    hidden_dim = int(model_config.get("hidden_dim", HIDDEN_DIM))
    num_layers = int(model_config.get("num_layers", _infer_num_layers(state)))
    num_classes = int(model_config.get("num_classes", len(label_encoder.classes_) or NUM_CLASSES))
    dropout = float(model_config.get("dropout", DROPOUT))

    if embedding is not None:
        vocab_size = int(embedding.shape[0])
        embed_dim = int(embedding.shape[1])

    if fc_weight is not None:
        num_classes = int(fc_weight.shape[0])
        if fc_weight.shape[1] % 2 == 0:
            hidden_dim = int(fc_weight.shape[1] // 2)

    if fc_bias is not None:
        num_classes = int(fc_bias.shape[0])

    if vocab_size <= 0:
        vocab_size = len(tokenizer) + 1

    return {
        "vocab_size": vocab_size,
        "embed_dim": embed_dim,
        "hidden_dim": hidden_dim,
        "num_layers": num_layers,
        "num_classes": num_classes,
        "dropout": dropout,
    }


class ModelStore:
    """Singleton: load artifacts once when the FastAPI service starts."""

    model: BiLSTMAttention | None = None
    tokenizer: dict | None = None
    label_encoder: LabelEncoder | None = None
    metadata: dict | None = None
    model_config: dict | None = None
    device: torch.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    @classmethod
    def load(cls) -> None:
        if not MODEL_FILE.exists():
            raise FileNotFoundError(
                f"Missing model file: {MODEL_FILE}. Copy Attention_BiLSTM.pt "
                "or secureai_bilstm_attention.pt into secureai_ai/models/."
            )

        cls.metadata = _load_json(METADATA_FILE)
        cls.model_config = _load_json(MODEL_CONFIG_FILE)

        if cls.model_config:
            print(f"Model config loaded from {MODEL_CONFIG_FILE.name}")
        if cls.metadata:
            print(f"Model metadata loaded from {METADATA_FILE.name}")

        if TOKENIZER_FILE.exists():
            cls.tokenizer = _load_tokenizer_safe(TOKENIZER_FILE)
            print(f"Tokenizer loaded from {TOKENIZER_FILE.name} - vocab size: {len(cls.tokenizer)}")
        elif TOKENIZER_JSON_FILE.exists():
            with open(TOKENIZER_JSON_FILE, "r", encoding="utf-8") as f:
                cls.tokenizer = json.load(f)
            print(f"Tokenizer loaded from {TOKENIZER_JSON_FILE.name} - vocab size: {len(cls.tokenizer)}")
        else:
            print("Tokenizer not found. Using built-in fallback tokenizer; predictions may be inaccurate.")
            cls.tokenizer = _build_char_tokenizer()

        cls.label_encoder = _load_label_encoder_safe(
            LABEL_ENC_FILE,
            cls.metadata or {},
            cls.model_config or {},
        )

        checkpoint = torch.load(MODEL_FILE, map_location=cls.device, weights_only=True)
        state = _normalize_state_dict(_extract_state_dict(checkpoint))
        params = _model_params(state, cls.tokenizer, cls.label_encoder, cls.model_config or {})

        cls.model = BiLSTMAttention(
            vocab_size=int(params["vocab_size"]),
            embed_dim=int(params["embed_dim"]),
            hidden_dim=int(params["hidden_dim"]),
            num_layers=int(params["num_layers"]),
            num_classes=int(params["num_classes"]),
            dropout=float(params["dropout"]),
        ).to(cls.device)

        cls.model.load_state_dict(state)
        cls.model.eval()

        print(
            "Model loaded: "
            f"{MODEL_FILE.name} - vocab={params['vocab_size']} - "
            f"max_len={cls.model_config.get('max_len') if cls.model_config else 'legacy'} - "
            f"layers={params['num_layers']} - device={cls.device}"
        )

    @classmethod
    def is_ready(cls) -> bool:
        return cls.model is not None and cls.tokenizer is not None