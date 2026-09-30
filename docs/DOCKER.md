# Docker Setup Guide — SecureAI

Hệ thống kiến trúc container hóa toàn diện cho **SecureAI** (AI-Powered SOC & Threat Intelligence Platform).

---

## 1. Prerequisites (Yêu cầu môi trường)

- **Docker Desktop** $\ge$ 24.0 (Windows / Linux / macOS)
- **Docker Compose** $\ge$ 2.20
- Tối thiểu 4 GB RAM khả dụng (khuyến nghị 8 GB nếu chạy PyTorch inference cục bộ)
- Cổng khả dụng trên máy host: `5173` (Frontend), `7124` (Backend Web API), `8000` (FastAPI AI Engine), `1433` (SQL Server).

---

## 2. Quick Start (Khởi động nhanh)

```bash
# 1. Sao chép biến môi trường mẫu
cp .env.example .env

# 2. Khởi chạy toàn bộ hệ sinh thái SecureAI
docker compose up -d --build
```

### Bảng tra cứu dịch vụ đang chạy:

| Service | Endpoint | Mục đích |
| :--- | :--- | :--- |
| **Frontend UI** | [http://localhost:5173](http://localhost:5173) | 3D Cyber SOC Dashboard, URL Scanner, Rule Engine |
| **Backend API** | [http://localhost:7124](http://localhost:7124) | ASP.NET Core 10 Web API, SignalR Hub, Threat Analytics |
| **Backend Swagger** | [http://localhost:7124/swagger](http://localhost:7124/swagger) | OpenAPI Documentation & Interactive Testing |
| **AI Server Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | FastAPI Interactive Docs (BiLSTM + Attention Model) |
| **AI Health Check** | [http://localhost:8000/health](http://localhost:8000/health) | Trạng thái model loaded, device (CPU/CUDA), memory |
| **Database** | `localhost:1433` | Microsoft SQL Server 2022 (SA User) |

---

## 3. Container Services Overview

| Tên Container | Base Image / Công nghệ | Vai trò & Trọng trách |
| :--- | :--- | :--- |
| `secureai_db` | `mcr.microsoft.com/mssql/server:2022-latest` | Lưu trữ relational data: Threats, Alerts, Incidents, Detection Rules, Audit Logs. |
| `secureai_ai` | `python:3.11-slim` + PyTorch + Tesseract OCR | Inference engine BiLSTM + Self-Attention phân loại URL độc hại, trích xuất Attention Weights. |
| `secureai_backend` | .NET 10.0 Web API Multi-stage Build | Xử lý logic nghiệp vụ, quản lý Rule Engine, JWT Auth, kết nối Entity Framework Core. |
| `secureai_frontend` | Node.js 20 $\rightarrow$ Nginx Alpine Multi-stage | Giao diện điều khiển SOC Glassmorphism 3D, biểu đồ phân tích thời gian thực. |

---

## 4. Development vs Production Modes

### 4.1 Chế độ Development (Mặc định)
Tập tin `docker-compose.override.yml` được tự động nạp khi chạy lệnh `docker compose up`:
- **Frontend**: Mount thư mục `./secureai_frontend` trực tiếp, hỗ trợ Hot Module Replacement (HMR).
- **Backend**: Mount mã nguồn C# và kích hoạt `dotnet watch` tự động biên dịch lại khi sửa code.
- **AI Server**: Kích hoạt `uvicorn --reload` và mount folder `model/` để cập nhật trọng số PyTorch tức thì.
- **Database**: Expose port `1433` để dev kết nối trực tiếp qua SQL Server Management Studio (SSMS) hoặc Azure Data Studio.

```bash
docker compose up
```

### 4.2 Chế độ Production Deployment
Production sử dụng cấu hình tối ưu hiệu năng, giới hạn RAM/CPU và nạp image chính thức từ GitHub Container Registry (`ghcr.io`):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

- Không mount source code vào container.
- Không expose port `1433` của SQL Server ra bên ngoài internet.
- Giới hạn tài nguyên bộ nhớ cho PyTorch inference nhằm chống tràn RAM hệ thống.
- Cấu hình rotation log driver `json-file` (10MB/file, max 3 files) tránh làm đầy ổ đĩa.

---

## 5. Lệnh quản trị hữu ích (Useful CLI Commands)

### Xem Log trực tiếp
```bash
# Log của AI Engine
docker compose logs -f ai_server

# Log của Backend ASP.NET Core
docker compose logs -f backend

# Log của toàn bộ stack
docker compose logs -f
```

### Khởi động lại một dịch vụ
```bash
docker compose restart ai_server
docker compose restart backend
```

### Rebuild một dịch vụ cụ thể sau khi cập nhật thư viện
```bash
docker compose up -d --build ai_server
docker compose up -d --build frontend
```

### Thực thi lệnh bên trong container
```bash
# Vào shell của AI server
docker compose exec ai_server bash

# Kiểm tra GPU / PyTorch trong container
docker compose exec ai_server python -c "import torch; print('CUDA Available:', torch.cuda.is_available())"

# Kiểm tra kết nối SQL Server bên trong backend
docker compose exec backend curl http://ai_server:8000/health
```

### Dọn dẹp & Tắt hệ thống
```bash
# Tắt nhưng giữ nguyên dữ liệu cơ sở dữ liệu
docker compose down

# Tắt và xóa sạch volumes (Dữ liệu database sẽ được reset)
docker compose down -v
```

---

## 6. Troubleshooting (Xử lý sự cố thường gặp)

1. **SQL Server container thoát liên tục:**
   - Microsoft SQL Server yêu cầu mật khẩu SA mạnh: ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (ví dụ: `SecureAI@2026StrongPass!`).
2. **AI Container tải model thất bại:**
   - Kiểm tra xem file `Attention_BiLSTM.pt` đã nằm đúng tại `secureai_ai/model/Attention_BiLSTM.pt` hay chưa.
3. **CORS Error khi gọi API từ Frontend:**
   - Kiểm tra biến môi trường `AllowedOrigins` trong cấu hình backend, mặc định cho phép `http://localhost:5173`.
