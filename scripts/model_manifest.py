"""
SecureAI Model Manifest Generator
Trích xuất SHA256, dung lượng và siêu dữ liệu cho các mô hình PyTorch trong SecureAI.

Sử dụng:
    python scripts/model_manifest.py

Đầu ra:
    secureai_ai/models/manifest.json
"""

import json
import os
import hashlib
from datetime import datetime, timezone
from pathlib import Path

MODEL_DIR = Path("secureai_ai/models")
OUTPUT = MODEL_DIR / "manifest.json"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    if not MODEL_DIR.exists():
        print(f"⚠️ Thư mục models không tồn tại: {MODEL_DIR}")
        return

    primary_model = MODEL_DIR / "Attention_BiLSTM.pt"
    if not primary_model.exists():
        primary_model = MODEL_DIR / "secureai_bilstm_attention.pt"

    artifacts = {}
    for p in sorted(MODEL_DIR.iterdir()):
        if p.is_file() and p.suffix in [".pt", ".pkl", ".json", ".csv"]:
            artifacts[p.name] = {
                "sha256": sha256(p),
                "size_bytes": p.stat().st_size,
                "size_kb": round(p.stat().st_size / 1024, 2),
            }

    manifest = {
        "project": "SecureAI",
        "primary_model": primary_model.name if primary_model.exists() else "unknown",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "python_version": f"{os.sys.version_info.major}.{os.sys.version_info.minor}",
        "artifacts_count": len(artifacts),
        "artifacts": artifacts,
    }

    meta_path = MODEL_DIR / "model_metadata.json"
    if meta_path.exists():
        try:
            with open(meta_path, "r", encoding="utf-8") as f:
                manifest["training_metadata"] = json.load(f)
        except Exception as e:
            print(f"Không thể đọc metadata.json: {e}")

    OUTPUT.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[OK] SecureAI Model Manifest written to {OUTPUT}")
    if primary_model.exists():
        print(f"   Primary Model: {primary_model.name}")
        print(f"   SHA256:        {artifacts[primary_model.name]['sha256'][:16]}...")
        print(f"   Size:          {artifacts[primary_model.name]['size_kb']} KB")


if __name__ == "__main__":
    main()
