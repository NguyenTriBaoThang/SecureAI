<div align="center">

# 🛡️ SecureAI Command Center
### Nền tảng Giám sát An ninh mạng & Hỗ trợ Ra quyết định bằng Trí tuệ nhân tạo (AI-Driven SOC Platform)

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![.NET](https://img.shields.io/badge/.NET-10.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<p align="center">
  <b>Hệ thống phòng thủ chuyên sâu kết hợp Deep Learning (BiLSTM + Self-Attention) và XAI (Explainable AI Heatmap) nhằm tự động hóa phát hiện URL độc hại, bóc tách email phishing, điều tra mối đe dọa và hỗ trợ SOC Analyst ra quyết định theo thời gian thực.</b>
</p>

[Xem Tính năng](#-tính-năng-nổi-bật) •
[Kiến trúc](#-kiến-trúc-hệ-thống) •
[Cài đặt nhanh](#-hướng-dẫn-cài-đặt--khởi-chạy) •
[Benchmark Mô hình](#-kết-quả-thử-nghiệm--benchmark-mô-hình) •
[Tài liệu API](#-danh-mục-api-chính)

</div>

---

## 📑 Mục lục
- [Giới thiệu](#-giới-thiệu)
- [Tính năng nổi bật](#-tính-năng-nổi-bật)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Kết quả thử nghiệm & Benchmark Mô hình](#-kết-quả-thử-nghiệm--benchmark-mô-hình)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Hướng dẫn cài đặt & Khởi chạy](#-hướng-dẫn-cài-đặt--khởi-chạy)
  - [Yêu cầu tiên quyết](#yêu-cầu-tiên-quyết)
  - [Cấu hình biến môi trường](#cấu-hình-biến-môi-trường)
  - [Khởi chạy nhanh 1 chạm](#cách-1-khởi-chạy-toàn-bộ-hệ-thống-bằng-script)
  - [Khởi chạy thủ công từng dịch vụ](#cách-2-khởi-chạy-thủ-công-từng-thành-phần)
- [Tài khoản thử nghiệm (Demo Credentials)](#-tài-khoản-thử-nghiệm-demo-credentials)
- [Danh mục API chính](#-danh-mục-api-chính)
- [Đóng góp & Giấy phép](#-đóng-góp--giấy-phép)

---

## 📌 Giới thiệu

Trong môi trường an ninh thông tin hiện đại, số lượng cuộc tấn công phi kỹ thuật (Social Engineering), tin nhắn lừa đảo và liên kết mã độc gia tăng theo cấp số nhân. Các trung tâm vận hành an ninh (SOC) thường xuyên rơi vào tình trạng **Alert Fatigue** (quá tải cảnh báo) do các bộ lọc tĩnh hoặc danh sách đen (Blacklist) truyền thống phản ứng chậm trước các biến thể tấn công mới dạng Zero-Day.

**SecureAI** được phát triển nhằm giải quyết bài toán này:
1. **Ứng dụng Trí tuệ Nhân tạo Tiên tiến**: Sử dụng mô hình mạng nơ-ron hồi quy hai chiều kết hợp cơ chế tự chú ý (**BiLSTM + Self-Attention**) để phân tích chuỗi ký tự thô của URL mà không phụ thuộc hoàn toàn vào dịch vụ DNS bên ngoài.
2. **Khả năng giải thích quyết định (Explainable AI - XAI)**: Tái hiện trực quan mức độ đóng góp (Attention Weights) của từng ký tự trên URL thông qua bảng màu nhiệt (Heatmap), giúp chuyên gia an ninh hiểu rõ *vì sao* mô hình đưa ra kết luận.
3. **Động cơ Chính sách (Rule Engine) & Hỗ trợ Ra Quyết định**: Tự động đưa ra khuyến nghị chuẩn hóa: **Chặn (Block)**, **Xem xét (Review)**, hoặc **Cho phép (Allow)** kết hợp quy trình quản lý sự cố (Incident Case Management) chuẩn mực.
4. **Giao diện 3D Cyber / Glassmorphic SOC**: Trải nghiệm thị giác đậm chất trung tâm tác chiến không gian mạng, tối ưu hóa hiển thị dữ liệu nhiều chiều và trực quan hóa thời gian thực qua SignalR.

---

## ✨ Tính năng nổi bật

### 1. 🛡️ SOC Command Center & Dashboard Thời Gian Thực
- Giám sát toàn diện số lượng mối đe dọa (Total Threats), tỷ lệ rủi ro hôm nay, cảnh báo nguy cấp (Critical Alerts) và hàng đợi sự cố đang mở.
- Biểu đồ xu hướng tấn công 7 ngày (Recharts Line Chart) và cơ cấu loại mối đe dọa (Pie Chart) theo tông màu Cyber Neon.
- Hệ thống thông báo đẩy trực tiếp (**SignalR Toast Notification**) ngay khi có đe dọa nguy cấp được phát hiện.

### 2. 🔍 Quét & Đánh giá URL Trực tiếp (AI URL Scanner)
- Phân tích cú pháp chuyên sâu: Domain, TLD, SSL/HTTPS, cấu trúc subdomain, ký tự Punycode và từ khóa đáng ngờ.
- Phân loại 4 nhóm nhãn: **Benign (An toàn)**, **Phishing (Lừa đảo)**, **Malware (Mã độc)**, **Defacement (Bị sửa giao diện)**.
- Vòng lặp phản hồi chủ động (Active Feedback Loop): Cho phép Analyst xác nhận độ chính xác hoặc gắn nhãn báo động giả (False Positive) để đưa vào tập dữ liệu tái huấn luyện (Retraining).

### 3. 🧠 Giải thích Mô hình AI (XAI Attention Heatmap)
- Trực quan hóa độ chú ý của mô hình trên từng token/ký tự của URL theo dải nhiệt độ: Vàng nhạt &rarr; Cam &rarr; Đỏ rực.
- Tương tác di chuột (Hover Tooltip) hiển thị chính xác chỉ số đóng góp (Attention Weight) và vị trí của từng ký tự.

### 4. ✉️ Cổng phân tích Email Phishing Đa phương thức
- Kiểm tra toàn diện chữ ký bảo mật tiêu đề: **SPF**, **DKIM**, **DMARC**, kiểm tra sự sai lệch giữa `From` và `Reply-To`.
- Bóc tách nội dung: Phát hiện từ khóa khẩn cấp, từ khóa lừa đảo tài chính, form nhập liệu HTML ẩn và nhận diện thương hiệu bị mạo danh.
- Tích hợp công nghệ trích xuất nội dung từ tệp ảnh chụp màn hình (OCR) hoặc tài liệu PDF đính kèm.

### 5. ⚖️ Động cơ Quy tắc & Chính sách (Rule Engine)
- Tùy biến ngưỡng Block Threshold và Review Threshold theo chính sách bảo mật riêng của từng tổ chức.
- Tự động hóa quy trình: Tự động gắn lệnh Block, tự động leo thang tạo cảnh báo SOC cho các mối đe dọa mức High/Critical.
- Ưu tiên nhóm nhãn độc hại đặc thù khi điểm rủi ro tiệm cận ngưỡng.

### 6. 📋 Quản lý Sự cố & Vụ việc (Incident Case Management)
- Tự động nâng cấp các đe dọa nghiêm trọng thành Incident để phân bổ chuyên viên phụ trách (`AssignedTo`).
- Theo dõi trạng thái vụ việc theo vòng đời chuẩn: `Open` &rarr; `Investigating` &rarr; `Resolved` &rarr; `FalsePositive`.
- Lưu trữ nhật ký điều tra (Analyst Notes) và kết luận xử lý vụ việc.

### 7. 🧪 Thử nghiệm So sánh Mô hình (Baseline Benchmark)
- So sánh hiệu năng đối đầu trực tiếp trên cùng một URL giữa 4 phương pháp: **Blacklist**, **Rule-based**, **LightGBM**, và **BiLSTM + Attention**.
- Đo lường và hiển thị trực quan cả điểm số rủi ro (Risk Score %) và độ trễ phản hồi (Latency ms).

---

## 🏛️ Kiến trúc hệ thống

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT / BROWSER                                  │
│                 React 18 + Vite + TypeScript (3D Cyber Theme)                    │
│      [Command Center]   [Manual Scan]   [Email Analyzer]   [Incident Cases]      │
└───────────────────────┬──────────────────────────────────┬───────────────────────┘
                        │ HTTP / REST                      │ WebSocket (SignalR)
                        ▼                                  ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             BACKEND GATEWAY (ASP.NET Core)                       │
│  - JWT Authentication & RBAC (Admin, Analyst, Viewer)                            │
│  - Threat Intelligence Enrichment Engine & Rule Engine                           │
│  - Audit Logs, Alert Workflow & Incident Management                              │
│  - Real-time AlertHub (SignalR WebSockets)                                       │
└───────────────────────┬──────────────────────────────────┬───────────────────────┘
                        │ Entity Framework Core            │ Internal REST / JSON
                        ▼                                  ▼
┌───────────────────────────────┐          ┌───────────────────────────────────────┐
│          DATABASE             │          │          AI INFERENCE SERVICE         │
│         SQL Server            │          │           FastAPI + PyTorch           │
│  - Users, Roles & Tokens      │          │  - BiLSTM + Self-Attention Model      │
│  - Threats, Alerts, Incidents │          │  - Email Feature Extractor (OCR/PDF)  │
│  - RuleConfigs & AuditLogs    │          │  - Baseline Benchmark Algorithms      │
└───────────────────────────────┘          └───────────────────────────────────────┘
```

---

## 💻 Công nghệ sử dụng

| Tầng hệ thống | Công nghệ / Thư viện | Vai trò |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite 5, TypeScript | Giao diện người dùng tốc độ cao, SPA hiện đại |
| **Styling** | Vanilla CSS Tokens, Glassmorphism, 3D Layers | Bộ thiết kế 3D Cyber Theme tối ưu hiệu năng |
| **Biểu tượng** | Lucide React | Hệ thống biểu tượng vector SVG nhất quán, sắc nét |
| **Đồ họa Dữ liệu** | Recharts | Trực quan hóa dữ liệu biểu đồ đường, cột, tròn |
| **Thời gian thực** | `@microsoft/signalr` | Client nhận cảnh báo đẩy thời gian thực từ Backend |
| **Backend API** | ASP.NET Core (.NET 10), C# | Web API Gateway, xác thực bảo mật, xử lý nghiệp vụ |
| **ORM & Database**| Entity Framework Core, Microsoft SQL Server | Quản lý schema, migrations và truy vấn dữ liệu |
| **Bảo mật** | JWT (JSON Web Token), SHA-256 Hash | Mã hóa mật khẩu, bảo vệ access/refresh token |
| **AI Engine** | Python 3.11+, FastAPI, PyTorch | Dịch vụ inference mô hình Deep Learning |
| **Mô hình AI** | BiLSTM, Self-Attention, LightGBM, Scikit-learn | Trích xuất đặc trưng chuỗi ký tự và phân loại rủi ro |

---

## 📊 Kết quả thử nghiệm & Benchmark Mô hình

Mô hình cốt lõi `Attention_BiLSTM.pt` được huấn luyện và đối chiếu trực tiếp trên bộ dữ liệu kiểm thử chuẩn gồm hàng trăm ngàn URL mẫu:

| Thuật toán / Kiến trúc | Accuracy | F1-Score (Weighted) | Macro F1 | Thời gian phản hồi (ms) |
| :--- | :---: | :---: | :---: | :---: |
| **BiLSTM + Self-Attention (Active)** | **94.54%** | **94.56%** | **95.46%** | **~4.2 ms** |
| BiLSTM truyền thống | 93.12% | 93.08% | 93.85% | ~3.8 ms |
| LSTM tiêu chuẩn | 91.80% | 91.75% | 92.10% | ~3.1 ms |
| RNN cổ điển | 86.40% | 86.20% | 87.05% | ~2.4 ms |
| LightGBM Heuristics | 90.25% | 90.10% | 90.80% | ~1.5 ms |

> [!NOTE]
> Mô hình **BiLSTM + Attention** đạt hiệu năng vượt trội nhờ khả năng ghi nhận ngữ cảnh hai chiều của chuỗi URL và tập trung trọng số vào các đoạn ký tự giả mạo tinh vi (ví dụ: homograph, subdomain lồng ghép, thương hiệu nổi tiếng bị chèn ký tự lạ).

---

## 📂 Cấu trúc dự án

```text
SecureAI/
├── .github/                     # Cấu hình GitHub Actions CI/CD
├── scripts/
│   └── run-dev.ps1              # Script PowerShell khởi chạy tự động 3 dịch vụ
├── secureai_frontend/           # Ứng dụng Giao diện Web (React + Vite)
│   ├── src/
│   │   ├── api/                 # Axios client đóng gói các endpoint REST
│   │   ├── components/
│   │   │   ├── layout/          # Layout chính, Sidebar phân nhóm, Toast notification
│   │   │   └── ui/              # StatCard 3D, AttentionHeatmap, Badge, Pill, Button
│   │   ├── hooks/               # Custom hooks: useAuth, useAlertHub (SignalR)
│   │   ├── pages/
│   │   │   ├── Auth/            # Màn hình Đăng nhập 3D Cyber Security Portal
│   │   │   ├── Home/            # Trung tâm chỉ huy (Command Center)
│   │   │   ├── Dashboard/       # SOC Dashboard (Biểu đồ, Timeline, Quick Scan)
│   │   │   ├── Scan/            # Quét & Đánh giá URL trực tiếp kèm Feedback
│   │   │   ├── Email/           # Phân tích Email Phishing, kiểm tra SPF/DKIM/DMARC
│   │   │   ├── Threats/         # Kho dữ liệu mối đe dọa & Chi tiết phân tích
│   │   │   ├── Alerts/          # Luồng xử lý Cảnh báo thời gian thực
│   │   │   ├── Incidents/       # Case management quản lý sự cố an ninh
│   │   │   ├── Baseline/        # Thử nghiệm so sánh hiệu năng 4 mô hình
│   │   │   ├── Rules/           # Cấu hình động cơ quy tắc (Rule Engine)
│   │   │   ├── Statistics/      # Báo cáo thống kê & Xuất dữ liệu CSV/PDF
│   │   │   └── Users/           # Quản trị người dùng & Phân quyền hệ thống
│   │   ├── styles/
│   │   │   └── secureai.css     # Hệ thống thiết kế 3D Cyber Theme & Tokens
│   │   ├── types/               # TypeScript interfaces & types định nghĩa dữ liệu
│   │   ├── App.tsx              # Cấu hình định tuyến (Routing & PrivateRoute)
│   │   └── main.tsx             # Điểm khởi chạy ứng dụng React
│   ├── package.json             # Danh mục thư viện phụ thuộc frontend
│   └── vite.config.ts           # Cấu hình Vite bundler & dev server
├── secureai_backend/            # Dịch vụ Backend Web API (ASP.NET Core)
│   └── secureai_backend/
│       ├── Controllers/         # API Controllers (Auth, Threats, Alerts, Email, Incidents...)
│       ├── Data/                # EF Core ApplicationDbContext & Database Seeds
│       ├── Hubs/                # SignalR AlertHub cho thông báo đẩy
│       ├── Models/              # Các Entity cơ sở dữ liệu
│       ├── Services/            # Business logic, Rule Engine & ML Bridge Service
│       └── Program.cs           # Cấu hình Dependency Injection, JWT & Middleware
├── secureai_ai/                 # Dịch vụ Trí tuệ Nhân tạo (Python FastAPI)
│   ├── models/                  # Lưu trữ trọng số mô hình PyTorch & Tokenizer
│   │   ├── Attention_BiLSTM.pt  # Trọng số mô hình chính
│   │   ├── char2idx.pkl         # Bộ mã hóa ký tự URL
│   │   └── config.json          # Siêu tham số mô hình (Vocab size, Embedding dim...)
│   └── src/
│       ├── main.py              # Điểm khởi chạy FastAPI server
│       ├── predictor.py         # Module tiền xử lý và inference PyTorch
│       └── routes.py            # API routes: /predict, /analyze/email, /baseline...
└── README.md                    # Tài liệu hướng dẫn dự án
```

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy

### Yêu cầu tiên quyết
1. **Hệ điều hành**: Windows 10/11 (khuyến nghị cho PowerShell scripts) hoặc Linux/macOS.
2. **Node.js**: Phiên bản `v20.0` hoặc `v22.0+` kèm theo `npm`.
3. **.NET SDK**: Phiên bản `.NET 10.0` (hoặc phiên bản tương thích cấu hình project).
4. **Python**: Phiên bản `3.10`, `3.11` hoặc `3.13`.
5. **Database**: Microsoft SQL Server (LocalDB, SQL Express hoặc SQL Server Standard).

---

### Cấu hình biến môi trường

Trước khi chạy, hãy khởi tạo các tệp cấu hình môi trường từ mẫu có sẵn:

```powershell
# 1. Cấu hình Frontend
Copy-Item secureai_frontend\.env.example secureai_frontend\.env

# 2. Cấu hình Backend
Copy-Item secureai_backend\.env.example secureai_backend\.env

# 3. Cấu hình AI Service
Copy-Item secureai_ai\.env.example secureai_ai\.env
```

*Nội dung mẫu `secureai_backend/.env`:*
```ini
ConnectionStrings__DefaultConnection=Server=localhost;Database=SecureAI_DB;Trusted_Connection=True;TrustServerCertificate=True;
Jwt__Secret=SECUREAI_SUPER_SECRET_KEY_FOR_LOCAL_DEVELOPMENT_ONLY_AT_LEAST_64_CHARS
Jwt__Issuer=SecureAI
Jwt__Audience=SecureAI-Client
Jwt__AccessTokenMinutes=480
Jwt__RefreshTokenDays=7
MlApi__BaseUrl=http://localhost:8000
AllowedOrigins=http://localhost:5173
```

---

### Cách 1: Khởi chạy toàn bộ hệ thống bằng Script (Khuyến nghị)

Dự án đã tích hợp sẵn script tự động kiểm tra và mở 3 tiến trình dev server trong các cửa sổ riêng:

```powershell
.\scripts\run-dev.ps1
```

Sau khi chạy, 3 dịch vụ sẽ hoạt động tại:
* 🌐 **Frontend App**: `http://localhost:5173`
* 🔌 **Backend API / Swagger UI**: `https://localhost:7124/swagger`
* 🧠 **AI Service Docs**: `http://localhost:8000/docs`

---

### Cách 2: Khởi chạy thủ công từng thành phần

#### Bước 1: Khởi động Dịch vụ AI (FastAPI)
```powershell
cd secureai_ai
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m src.main
# Server hoạt động tại: http://localhost:8000
```

#### Bước 2: Khởi động Backend (.NET Core Web API)
```powershell
cd secureai_backend\secureai_backend
dotnet restore
dotnet run
# API hoạt động tại: https://localhost:7124
```

#### Bước 3: Khởi động Frontend (React + Vite)
```powershell
cd secureai_frontend
npm install
npm run dev
# Giao diện hoạt động tại: http://localhost:5173
```

---

## 🔑 Tài khoản thử nghiệm (Demo Credentials)

Khi truy cập vào trang Đăng nhập (`http://localhost:5173/login`), hệ thống hỗ trợ nút điền nhanh tài khoản mẫu:

| Vai trò (Role) | Email | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@secureai.local` | `Admin@123` | Toàn quyền: Cấu hình Rule Engine, Quản lý Users, Quản lý Sự cố, Báo cáo |
| **Chuyên viên (Analyst)** | `analyst@secureai.local` | `Analyst@123` | Quét URL, Phân tích Email, Xử lý Alerts, Điều tra Incidents, Ghi chú Threat |

---

## 📡 Danh mục API chính

### Backend Gateway (`https://localhost:7124`)
- `POST /api/auth/login`: Xác thực tài khoản, trả về JWT Access Token và Refresh Token.
- `POST /api/auth/refresh`: Cấp mới token truy cập bằng cơ chế xoay vòng (Token Rotation).
- `POST /api/scan`: Tiếp nhận URL, tính toán rủi ro và trả về quyết định `ALLOW/WARN/BLOCK`.
- `POST /api/threats/analyze`: Phân tích chuyên sâu URL và trích xuất đặc trưng Threat Intel.
- `GET /api/threats`: Truy vấn danh sách mối đe dọa có phân trang và bộ lọc.
- `GET /api/alerts`: Danh sách cảnh báo thời gian thực; `PUT /api/alerts/{id}/status`: Cập nhật trạng thái.
- `GET /api/incidents`: Quản lý các vụ việc an ninh (Incidents Case Management).
- `POST /api/email/analyze`: Phân tích nội dung email và các liên kết đính kèm.
- `GET/PUT /api/rule-engine/config`: Truy vấn và cập nhật ngưỡng ra quyết định tự động.
- `GET /api/export/threats/csv`: Xuất báo cáo danh sách mối đe dọa dạng CSV/PDF.

### AI Inference Service (`http://localhost:8000`)
- `GET /health`: Kiểm tra trạng thái hoạt động của mô hình PyTorch.
- `GET /model/info`: Thông số kỹ thuật của mô hình active (`Attention_BiLSTM.pt`).
- `POST /predict`: Dự đoán nhãn (`benign`, `phishing`, `malware`, `defacement`) và trả về `attention_weights`.
- `POST /extract/email`: Trích xuất thông tin người gửi, tiêu đề, nội dung từ tệp ảnh OCR hoặc tài liệu PDF.
- `POST /baseline/compare`: Chạy benchmark đối chiếu 4 thuật toán trên URL mục tiêu.

---

## 🛡️ Hướng dẫn Kiểm tra Chất lượng Mã nguồn (Testing)

```powershell
# 1. Kiểm tra build Frontend (TypeScript + Vite)
cd secureai_frontend
npm run build

# 2. Kiểm tra build Backend (.NET Core)
cd ..\secureai_backend
dotnet build secureai_backend.slnx --no-restore

# 3. Kiểm tra cú pháp mã nguồn AI (Python)
cd ..\secureai_ai
python -m py_compile src\main.py src\routes.py src\predictor.py
```

---

## 🗺️ Kế hoạch phát triển (Roadmap)
- [x] Tích hợp mô hình Deep Learning BiLSTM + Self-Attention phân loại 4 nhóm nhãn nguy cơ.
- [x] Triển khai tính năng giải thích quyết định XAI Attention Heatmap.
- [x] Tái cấu trúc giao diện 3D Cyber / Glassmorphic SOC Command Center.
- [x] Tích hợp thông báo cảnh báo thời gian thực qua WebSockets (SignalR).
- [ ] Mở rộng tiện ích mở rộng trình duyệt (Chrome Extension) tự động chặn URL độc hại tại endpoint.
- [ ] Bổ sung cơ chế Sandbox tự động mở và phân tích hành vi động của URL nghi vấn trong môi trường cô lập.
- [ ] Tích hợp sâu với các nguồn cấp dữ liệu đe dọa toàn cầu (VirusTotal, AlienVault OTX, PhishTank).

---

## 📄 Đóng góp & Giấy phép

Mọi đóng góp nhằm hoàn thiện và phát triển hệ thống đều được hoan nghênh:
1. Fork dự án về kho lưu trữ cá nhân.
2. Tạo nhánh tính năng mới (`git checkout -b feature/AmazingFeature`).
3. Commit các thay đổi (`git commit -m 'feat: Add some AmazingFeature'`).
4. Đẩy lên nhánh remote (`git push origin feature/AmazingFeature`).
5. Tạo một **Pull Request** giải thích chi tiết các cải tiến.

Dự án được phân phối dưới giấy phép **MIT License**. Chi tiết xem tại tệp [LICENSE](LICENSE).

---

<div align="center">
  <sub>Được phát triển và duy trì bởi Đội ngũ Nghiên cứu <b>SecureAI Team</b>. Bảo vệ không gian mạng thông minh hơn mỗi ngày.</sub>
</div>
