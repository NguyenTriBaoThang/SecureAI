import os
from pathlib import Path

# Thư mục chứa model files (.pt, .pkl, .json)
MODELS_DIR = Path(__file__).parent.parent / "models"

# Tên file model
MODEL_FILE      = MODELS_DIR / "secureai_bilstm_attention.pt"
TOKENIZER_FILE  = MODELS_DIR / "tokenizer.pkl"
LABEL_ENC_FILE  = MODELS_DIR / "label_encoder.pkl"
METADATA_FILE   = MODELS_DIR / "model_metadata.json"

# Server
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

# Model hyperparams (phải khớp với lúc train)
MAX_LEN   = 50
MAX_WORDS = 200
EMBED_DIM = 128
HIDDEN_DIM = 128
NUM_LAYERS  = 2
NUM_CLASSES = 4

# Risk score threshold → action
THRESHOLD_BLOCK = 0.85
THRESHOLD_ALERT = 0.60
