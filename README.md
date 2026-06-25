# SecureAI

SecureAI la he thong giam sat va ho tro ra quyet dinh an toan an ninh mang, tap trung vao phat hien URL/email doc hai bang mo hinh ML va quy trinh analyst review.

## Thanh phan chinh

| Thanh phan | Cong nghe | Vai tro |
| --- | --- | --- |
| `secureai_frontend` | React, Vite, TypeScript, SignalR client | Giao dien dashboard, threats, alerts, email analysis, baseline compare |
| `secureai_backend` | ASP.NET Core, EF Core, SQL Server, SignalR | API, JWT auth, role, audit log, alert workflow, bridge sang ML API |
| `secureai_ai` | FastAPI, PyTorch | Inference URL phishing, email feature analysis, baseline comparison, export |

Kien truc tong quat:

```text
React/Vite -> ASP.NET Core API -> SQL Server
     |              |
     |              +-> SignalR alerts
     |
     +-> FastAPI ML service thong qua backend/proxy
```

## Yeu cau moi truong

- Windows PowerShell
- .NET SDK phu hop voi `secureai_backend/secureai_backend.csproj` (`net10.0` trong project hien tai)
- SQL Server hoac SQL Server Express/LocalDB
- Node.js 20+ va npm
- Python 3.10+ hoac 3.11+

## Cau hinh bao mat

Khong commit secret that vao repo. Backend can cac bien sau qua user-secrets, environment variables, hoac file `secureai_backend/.env` khi dung script `scripts/run-dev.ps1`.

### Cach 1: dung user-secrets cho backend

```powershell
cd secureai_backend\secureai_backend

dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost;Database=SecureAI_DB;Trusted_Connection=True;TrustServerCertificate=True;"
dotnet user-secrets set "Jwt:Secret" "CHANGE_ME_TO_A_RANDOM_64_CHAR_SECRET_FOR_LOCAL_DEV_ONLY"
dotnet user-secrets set "Jwt:Issuer" "SecureAI"
dotnet user-secrets set "Jwt:Audience" "SecureAI-Client"
dotnet user-secrets set "Jwt:AccessTokenMinutes" "480"
dotnet user-secrets set "Jwt:RefreshTokenDays" "7"
dotnet user-secrets set "MlApi:BaseUrl" "http://localhost:8000"
dotnet user-secrets set "AllowedOrigins:0" "http://localhost:5173"
```

### Cach 2: dung `.env` voi script chay nhanh

```powershell
Copy-Item secureai_backend\.env.example secureai_backend\.env
Copy-Item secureai_ai\.env.example secureai_ai\.env
Copy-Item secureai_frontend\.env.example secureai_frontend\.env
```

Sau do sua gia tri trong cac file `.env`. Cac file `.env` da duoc ignore boi git.

## Cai dat phu thuoc

### Backend

```powershell
cd secureai_backend\secureai_backend
dotnet restore
```

### AI service

```powershell
cd secureai_ai
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Thu muc `secureai_ai/models` can co cac artifact:

- `secureai_bilstm_attention.pt`
- `tokenizer.pkl`
- `label_encoder.pkl`
- `model_metadata.json`

### Frontend

```powershell
cd secureai_frontend
npm install
```

## Chay du an

### Chay nhanh 3 service

```powershell
.\scripts\run-dev.ps1
```

Script se mo 3 cua so PowerShell:

- AI API: `http://localhost:8000`
- Backend API/Swagger: `https://localhost:7124/swagger`
- Frontend: `http://localhost:5173`

### Chay thu cong

Terminal 1 - AI service:

```powershell
cd secureai_ai
python -m src.main
```

Terminal 2 - backend:

```powershell
cd secureai_backend\secureai_backend
dotnet run
```

Terminal 3 - frontend:

```powershell
cd secureai_frontend
npm run dev
```

## Tai khoan demo

Tai khoan admin duoc seed trong database:

```text
Email: admin@secureai.local
Password: Admin@123
```

Neu dua len moi truong that, hay doi seed credential va khong hien thi mat khau goi y tren UI.

## Kiem tra build

```powershell
# Backend
cd secureai_backend
dotnet build secureai_backend.slnx --no-restore

# Frontend
cd ..\secureai_frontend
npm run build

# AI syntax check
cd ..\secureai_ai
python -m py_compile src\routes.py src\main.py src\predictor.py
```

## API chinh

Backend:

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/threats/analyze`
- `GET /api/threats`
- `GET /api/alerts`
- `POST /api/email/analyze`

AI service:

- `GET /health`
- `GET /model/info`
- `POST /predict`
- `POST /predict/batch`
- `POST /analyze/email`
- `POST /baseline/compare`
- `POST /extract/email`

## Checklist demo bao cao

1. Mo `http://localhost:5173` va dang nhap bang tai khoan demo.
2. Vao Dashboard de xem tong quan threats/alerts.
3. Vao Threats, phan tich mot URL mau:

```text
http://free-apple-login-verify.net/id
```

4. Kiem tra threat detail: label, risk score, probability, attention heatmap.
5. Kiem tra alert moi neu risk cao.
6. Vao Email Analyze, dan raw email co link dang nghi.
7. Vao Baseline Compare de so sanh BiLSTM voi blacklist/rule-based/LightGBM heuristic.
8. Mo Swagger backend va FastAPI docs de trinh bay API.
9. Trinh bay chi so model trong `secureai_ai/models/model_metadata.json`:
   - Accuracy: `0.9379`
   - F1 weighted: `0.9366`
   - ROC-AUC: `0.9854`

## Ghi chu phat trien

- Backend da luu refresh token dang hash SHA-256 trong database va rotate token khi refresh.
- `appsettings.json` khong con chua JWT secret hoac connection string that.
- AI `routes.py` chi con mot bo endpoint duy nhat, tranh trung route.
- Frontend lay API/hub URL tu bien Vite de de cau hinh dev/prod.

## Monitoring workflow moi

SecureAI hien co them cac chuc nang giam sat va ho tro ra quyet dinh:

- Incident / Case Management: threat High/Critical se tu tao incident tai `GET /api/incidents` va trang `/incidents`.
- Decision Support Panel: moi threat co `decisionSupport` voi khuyen nghi `Block`, `Review`, hoac `Allow`, ly do va next steps.
- Risk Explanation: moi threat co `riskExplanation` gom model signals, URL indicators va attention highlights.
- Alert Workflow: alert co status `New`, `Investigating`, `Resolved`, `FalsePositive` va co the cap nhat tai trang `/alerts`.
- Threat Timeline: dashboard hien timeline threat 7 ngay va workload incident/alert dang xu ly.
- Analyst Notes: analyst gan label va ghi note tren threat detail, note duoc luu vao feedback loop.
## Chuc nang do an bo sung

- Rule Engine: admin cau hinh nguong review/block tai `/rules`, backend API `/api/rule-engine/config`.
- Threat Intelligence Enrichment: moi threat tra ve domain, TLD, HTTPS, IP, do dai URL, subdomain, query va indicator heuristic.
- Report Export: trang `/statistics` tai CSV/PDF cho threats va alerts.
- Model Comparison: trang `/baseline` so sanh BiLSTM+Attention voi blacklist, rule-based va LightGBM.
- Security Dashboard: trang `/` hien tong threat, critical alert, top label, xu huong 7 ngay va top URL rui ro.
- User Management: trang `/users` cho admin tao user, doi role, khoa/mo tai khoan.

