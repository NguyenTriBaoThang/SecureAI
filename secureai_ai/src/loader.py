import json
import pickle
import torch
from pathlib import Path
from sklearn.preprocessing import LabelEncoder
from src.config import (
    MODEL_FILE, TOKENIZER_FILE, LABEL_ENC_FILE, METADATA_FILE, MODELS_DIR,
    EMBED_DIM, HIDDEN_DIM, NUM_LAYERS, NUM_CLASSES, MAX_WORDS,
)
from src.model import BiLSTMAttention


def _load_tokenizer_safe(path: Path) -> dict:
    """Load tokenizer an toàn — handle Keras Tokenizer và plain dict."""
    with open(path, "rb") as f:
        raw = pickle.load(f)

    if isinstance(raw, dict):
        return raw

    if hasattr(raw, "word_index"):
        print("⚠️  Keras Tokenizer detected → converting to plain dict")
        return dict(raw.word_index)

    for attr in ("char_index", "token_index", "index"):
        if hasattr(raw, attr):
            return dict(getattr(raw, attr))

    raise ValueError(f"Không nhận dạng được tokenizer format: {type(raw)}")


def _build_char_tokenizer() -> dict:
    """Fallback: character tokenizer từ bảng ASCII URL."""
    chars = (
        "abcdefghijklmnopqrstuvwxyz"
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        "0123456789"
        ".-_/\\:?=#@&%+~[]()!*,;$"
    )
    return {c: i + 1 for i, c in enumerate(chars)}


def _load_label_encoder_safe(pkl_path: Path, metadata_path: Path) -> LabelEncoder:
    """
    Load label encoder an toàn.
    Ưu tiên rebuild từ metadata.json (không cần Keras/TF).
    Fallback về pkl nếu metadata không có.
    """
    # Ưu tiên 1: rebuild từ metadata.json (không phụ thuộc library nào)
    if metadata_path.exists():
        with open(metadata_path, "r") as f:
            meta = json.load(f)

        classes = meta.get("label_classes")
        if classes:
            le = LabelEncoder()
            le.classes_ = __import__("numpy").array(sorted(classes))
            print(f"✅ Label encoder rebuilt từ metadata — classes: {list(le.classes_)}")
            return le

    # Ưu tiên 2: load pkl bình thường
    if pkl_path.exists():
        try:
            with open(pkl_path, "rb") as f:
                le = pickle.load(f)
            print(f"✅ Label encoder loaded từ pkl — classes: {list(le.classes_)}")
            return le
        except Exception as e:
            print(f"⚠️  Không load được label_encoder.pkl: {e}")

    # Fallback: hardcode 4 classes của dataset malicious_phish
    print("⚠️  Dùng hardcoded label classes: benign/defacement/malware/phishing")
    le = LabelEncoder()
    le.classes_ = __import__("numpy").array(["benign", "defacement", "malware", "phishing"])
    return le


class ModelStore:
    """Singleton — load artifacts 1 lần duy nhất khi server khởi động."""

    model:         BiLSTMAttention | None = None
    tokenizer:     dict | None            = None
    label_encoder: LabelEncoder | None    = None
    metadata:      dict | None            = None
    device:        torch.device           = torch.device("cpu")

    @classmethod
    def load(cls) -> None:
        if not MODEL_FILE.exists():
            raise FileNotFoundError(
                f"Thiếu model file: {MODEL_FILE}\n"
                f"Copy secureai_bilstm_attention.pt vào thư mục models/"
            )

        # ── 1. Load metadata trước ────────────────────────────────────────────
        if METADATA_FILE.exists():
            with open(METADATA_FILE, "r") as f:
                cls.metadata = json.load(f)
            print(f"✅ Metadata loaded")

        # ── 2. Load tokenizer ─────────────────────────────────────────────────
        tokenizer_json = MODELS_DIR / "tokenizer.json"

        if tokenizer_json.exists():
            # Ưu tiên: load JSON thuần Python (export từ Colab)
            with open(tokenizer_json, "r", encoding="utf-8") as f:
                cls.tokenizer = json.load(f)
            print(f"✅ Tokenizer loaded từ JSON — vocab size: {len(cls.tokenizer)}")

        elif TOKENIZER_FILE.exists():
            # Fallback: thử load pkl
            try:
                cls.tokenizer = _load_tokenizer_safe(TOKENIZER_FILE)
                print(f"✅ Tokenizer loaded từ pkl — vocab size: {len(cls.tokenizer)}")
            except Exception as e:
                print(f"⚠️  tokenizer.pkl lỗi ({e})")
                print("   ❌ QUAN TRỌNG: Chạy export_tokenizer_colab.py trên Colab")
                print("      rồi copy tokenizer.json vào models/")
                print("   → Tạm dùng built-in tokenizer (kết quả predict không chính xác)")
                cls.tokenizer = _build_char_tokenizer()
        else:
            print("⚠️  Không tìm thấy tokenizer — dùng built-in (kết quả KHÔNG chính xác)")
            print("   ❌ Chạy export_tokenizer_colab.py trên Colab để fix!")
            cls.tokenizer = _build_char_tokenizer()

        # ── 3. Load label encoder ─────────────────────────────────────────────
        cls.label_encoder = _load_label_encoder_safe(LABEL_ENC_FILE, METADATA_FILE)

        # ── 4. Build model ────────────────────────────────────────────────────
        # Load checkpoint trước để lấy config nếu có
        checkpoint = torch.load(MODEL_FILE, map_location=cls.device, weights_only=True)

        # Lấy vocab_size từ checkpoint config nếu có
        if isinstance(checkpoint, dict) and "config" in checkpoint:
            cfg        = checkpoint["config"]
            vocab_size = cfg.get("vocab_size",  len(cls.tokenizer) + 1)
            embed_dim  = cfg.get("embed_dim",   EMBED_DIM)
            hidden_dim = cfg.get("hidden_dim",  HIDDEN_DIM)
            num_layers = cfg.get("num_layers",  NUM_LAYERS)
            num_classes= cfg.get("num_classes", NUM_CLASSES)
            print(f"✅ Config từ checkpoint — vocab: {vocab_size}, hidden: {hidden_dim}, layers: {num_layers}")
        else:
            vocab_size  = len(cls.tokenizer) + 1
            embed_dim   = EMBED_DIM
            hidden_dim  = HIDDEN_DIM
            num_layers  = NUM_LAYERS
            num_classes = NUM_CLASSES

        cls.model = BiLSTMAttention(
            vocab_size  = vocab_size,
            embed_dim   = embed_dim,
            hidden_dim  = hidden_dim,
            num_layers  = num_layers,
            num_classes = num_classes,
        )

        # ── 5. Load weights ───────────────────────────────────────────────────
        if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
            state = checkpoint["model_state_dict"]
            print(f"✅ Checkpoint format — loading model_state_dict")
        else:
            state = checkpoint

        cls.model.load_state_dict(state)
        cls.model.eval()

        print(f"✅ Model weights loaded — vocab: {vocab_size} — device: {cls.device}")
        print(f"🟢 SecureAI ML API ready!")

    @classmethod
    def is_ready(cls) -> bool:
        return cls.model is not None and cls.tokenizer is not None
