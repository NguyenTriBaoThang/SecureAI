# 🛡️ SecureAI ML API

FastAPI microservice — BiLSTM + Self-Attention phishing URL detection.

## Cấu trúc

```
secureai_ai/
├── src/
│   ├── main.py        ← FastAPI app, startup/shutdown
│   ├── routes.py      ← Endpoints: /, /health, /model/info, /predict, /predict/batch
│   ├── predictor.py   ← Inference logic
│   ├── model.py       ← BiLSTM+Attention architecture
│   ├── loader.py      ← Load artifacts khi startup
│   ├── features.py    ← 15 handcrafted URL features + clean_url
│   ├── schemas.py     ← Pydantic request/response
│   └── config.py      ← Paths, hyperparams, thresholds
├── models/            ← Đặt .pt và .pkl vào đây
├── requirements.txt
└── .env.example
```

## Setup

```bash
# 1. Tạo virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# 2. Cài packages
pip install -r requirements.txt

# 3. Copy model files vào models/
#    - secureai_bilstm_attention.pt
#    - tokenizer.pkl
#    - label_encoder.pkl
#    - model_metadata.json

# 4. Chạy server
python -m src.main
```

## Chạy xong → kiểm tra

```
GET  http://localhost:8000/health
GET  http://localhost:8000/docs        ← Swagger UI
GET  http://localhost:8000/model/info
```

## Test predict

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"url": "http://free-apple-login-verify.net/id"}'
```

## Response mẫu

```json
{
  "url": "http://free-apple-login-verify.net/id",
  "label": "phishing",
  "risk_score": 0.9821,
  "probabilities": {
    "benign": 0.0179,
    "phishing": 0.9612,
    "malware": 0.0134,
    "defacement": 0.0075
  },
  "top_attention": [
    {"char": "/", "weight": 0.0842},
    {"char": "i", "weight": 0.0721}
  ],
  "action": "block"
}
```

## Risk Score → Action

| Risk Score | Action   | Ý nghĩa                  |
|-----------|----------|--------------------------|
| ≥ 0.85    | `block`  | Chặn ngay, tạo CRITICAL alert |
| ≥ 0.60    | `alert`  | Gửi HIGH alert, chờ analyst |
| < 0.60    | `allow`  | Cho phép, log bình thường |
