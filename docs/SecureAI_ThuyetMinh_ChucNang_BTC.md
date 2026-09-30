# THUYẾT MINH CHI TIẾT CÁC TÍNH NĂNG VÀ CHỨC NĂNG DỰ ÁN SECUREAI

**Tài liệu kỹ thuật chức năng gửi Ban Tổ Chức (BTC)**  
**Nền tảng:** SecureAI — AI-Powered Cybersecurity SOC Platform  
**Phiên bản:** v1.0.0 (Release Candidate)  

---

## MỤC LỤC CHỨC NĂNG

1. [Phân hệ 1: Tổng quan Điều hành SOC (SOC Overview Dashboard)](#1-phân-hệ-1-tổng-quan-điều-hành-soc-soc-overview-dashboard)
2. [Phân hệ 2: Quét & Phân tích URL Thông minh (URL Threat Scanner & XAI)](#2-phân-hệ-2-quét--phân-tích-url-thông-minh-url-threat-scanner--xai)
3. [Phân hệ 3: Phân tích Đa phương thức Email & Tệp đính kèm (Email & Quishing)](#3-phân-hệ-3-phân-tích-đa-phương-thức-email--tệp-đính-kèm-email--quishing)
4. [Phân hệ 4: Quản lý Mối đe dọa (Threat Intelligence Repository)](#4-phân-hệ-4-quản-lý-mối-đe-dọa-threat-intelligence-repository)
5. [Phân hệ 5: Hệ thống Cảnh báo An ninh Thời gian thực (Real-time Alerts)](#5-phân-hệ-5-hệ-thống-cảnh-báo-an-ninh-thời-gian-thực-real-time-alerts)
6. [Phân hệ 6: Quản lý Vòng đời Sự cố SOC (Incident Response Life Cycle)](#6-phân-hệ-6-quản-lý-vòng-đời-sự-cố-soc-incident-response-life-cycle)
7. [Phân hệ 7: Động cơ Quy tắc Tùy biến (Custom Security Rule Engine)](#7-phân-hệ-7-động-cơ-quy-tắc-tùy-biến-custom-security-rule-engine)
8. [Phân hệ 8: So sánh Đối chuẩn Baseline (Model vs Heuristic Baseline)](#8-phân-hệ-8-so-sánh-đối-chuẩn-baseline-model-vs-heuristic-baseline)
9. [Phân hệ 9: Xác thực Người dùng & Phân quyền Truy cập (Auth & RBAC)](#9-phân-hệ-9-xác-thực-người-dùng--phân-quyền-truy-cập-auth--rbac)
10. [Bảng Tổng hợp API Endpoints của Hệ thống](#10-bảng-tổng-hợp-api-endpoints-của-hệ-thống)

---

## 1. Phân hệ 1: Tổng quan Điều hành SOC (SOC Overview Dashboard)

### 1.1 Mục đích & Giá trị
Cung cấp cái nhìn toàn cảnh 360 độ về tình trạng an ninh thông tin trong toàn bộ hệ thống theo thời gian thực dành cho Trưởng trung tâm SOC và Chuyên viên trực ca.

### 1.2 Các thành phần chức năng chi tiết:
- **Thẻ Thống kê Chỉ số Trọng yếu (KPI Stat Cards):**
  - *Tổng số lượt quét (Total Scans):* Tổng số URL, email và tệp tin đã phân tích.
  - *Mối đe dọa phát hiện (Detected Threats):* Số lượng URL mã độc, lừa đảo bị ngăn chặn.
  - *Cảnh báo nguy kịch (Critical Alerts):* Các cảnh báo cần can thiệp khẩn cấp trong ca trực.
  - *Sự cố đang xử lý (Active Incidents):* Số lượng vé sự cố đang ở trạng thái `Investigating`.
- **Biểu đồ Phân bổ Mức độ Nghiêm trọng (Severity Distribution Chart):**
  - Hiển thị tỷ lệ các sự kiện theo 4 thang: `Critical`, `High`, `Medium`, `Low`.
- **Biểu đồ Xu hướng Tấn công (Threat Trend Timeline):**
  - Giám sát lượng tấn công biến thiên theo từng mốc giờ/ngày giúp dự báo các đợt phát động chiến dịch APT.
- **Bảng Hoạt động Gần đây (Recent Activity Feed):**
  - Danh sách cập nhật tự động các sự kiện quét và quyết định tự động của hệ thống.

---

## 2. Phân hệ 2: Quét & Phân tích URL Thông minh (URL Threat Scanner & XAI)

### 2.1 Mục đích & Quy trình
Cho phép người dùng hoặc chuyên viên SOC dán một URL bất kỳ để phân tích tức thì qua mạng học sâu BiLSTM + Self-Attention kết hợp bộ lọc quy tắc.

### 2.2 Các tính năng độc quyền:
- **Trích xuất Đặc trưng Tự động:** Phân tách Scheme, FQDN Domain, TLD, Subdomains, Path, Query Parameters.
- **XAI Attention Heatmap:**
  - Trực quan hóa từng ký tự của URL với màu sắc tương ứng với trọng số chú ý của mô hình AI.
  - Ký tự bình thường hiển thị màu xanh/trung tính; ký tự đáng ngờ (chuỗi ngẫu nhiên, ký tự lừa đảo như `paypa1`, `secure-login-bank`) phát sáng màu đỏ nổi bật.
- **Bảng Thống kê Ký tự Trọng yếu (Top Attended Tokens):**
  - Liệt kê top 5 phân đoạn ký tự đóng góp nhiều nhất vào phán đoán độc hại của mô hình.
- **Cơ chế Fallback & Dự phòng:**
  - Nếu mô hình AI cần nạp lại, hệ thống tự động kích hoạt bộ Heuristic Rule Engine đảm bảo thời gian sẵn sàng 99.99%.

---

## 3. Phân hệ 3: Phân tích Đa phương thức Email & Tệp đính kèm (Email & Quishing)

### 3.1 Mục đích & Thách thức
Giải quyết các vector tấn công qua email lừa đảo (Phishing Email) và tấn công mã QR độc hại (Quishing) ẩn trong tài liệu hoặc ảnh chụp màn hình.

### 3.2 Luồng xử lý chi tiết:
1. **Phân tích Header & Thân thư:** Kiểm tra tính bất thường của `Reply-To`, tên hiển thị giả mạo (Display Name Spoofing).
2. **Trích xuất Văn bản PDF (PyMuPDF):** Bóc tách toàn bộ đường dẫn ẩn (hyperlinks) bên trong file PDF đính kèm.
3. **Nhận dạng Ký tự Quang học (Tesseract OCR):** Chuyển đổi hình ảnh chứng từ thanh toán, thông báo khóa tài khoản giả mạo thành văn bản để phân tích ngữ nghĩa.
4. **Bộ Giải mã QR Code Tự động:** Quét phát hiện mã QR trong ảnh/tài liệu, tự động bóc tách URL ẩn và đưa vào pipeline kiểm tra an ninh.

---

## 4. Phân hệ 4: Quản lý Mối đe dọa (Threat Intelligence Repository)

### 4.1 Quản lý Dữ liệu Mối đe dọa:
- Bảng cơ sở dữ liệu lưu trữ toàn bộ các URL, domain, địa chỉ IP đã từng bị phát hiện là độc hại.
- Lọc theo phân loại tấn công: `Phishing`, `Malware Distribution`, `C2 Server`, `Credential Harvesting`.
- Tìm kiếm tức thời theo từ khóa, tên miền, IP, thời gian phát hiện.
- Xuất báo cáo dữ liệu dạng JSON/CSV phục vụ việc tích hợp vào tường lửa Firewall hoặc SIEM bên ngoài.

---

## 5. Phân hệ 5: Hệ thống Cảnh báo An ninh Thời gian thực (Real-time Alerts)

### 5.1 Cơ chế Đẩy Thông báo Tức thì:
- Sử dụng công nghệ **SignalR WebSocket**, mọi cảnh báo mới sinh ra trên máy chủ backend sẽ lập tức xuất hiện trên giao diện của các chuyên viên SOC trực ban mà không cần bấm F5.
- Cảnh báo phân cấp rõ rệt với mã màu chuẩn SOC:
  - 🔴 **CRITICAL:** Đe dọa nghiệm trọng, cần cô lập ngay lập tức.
  - 🟠 **HIGH:** URL độc hại có xác suất cao.
  - 🟡 **MEDIUM:** URL chứa dấu hiệu bất thường, cần xem xét thêm.
  - 🟢 **LOW / INFO:** Các thông báo thông tin hoạt động thường nhật.
- Hành động nhanh: Chuyển cảnh báo thành Vé sự cố (Promote to Incident) chỉ với một cú click chuột.

---

## 6. Phân hệ 6: Quản lý Vòng đời Sự cố SOC (Incident Response Life Cycle)

### 6.1 Mô hình Trạng thái Chuẩn (State Machine):
Hệ thống tuân thủ nghiêm ngặt quy trình ứng cứu sự cố NIST SP 800-61:
- `New`: Sự cố mới được hệ thống tự động tạo ra từ cảnh báo nguy hiểm.
- `Investigating`: Chuyên viên SOC đã nhận xử lý và đang tiến hành điều tra dấu vết số.
- `Mitigated`: Đã áp dụng các biện pháp giảm thiểu (chặn domain trên tường lửa, thu hồi email).
- `Resolved`: Sự cố đã xử lý triệt để, có kết luận điều tra và đóng vé.

### 6.2 Tính năng Tương tác Nhóm:
- Phân công người phụ trách (Assignee).
- Ghi chú điều tra (Investigation Notes & Timeline).
- Ghi vết kiểm toán (Audit Trail) không thể chỉnh sửa.

---

## 7. Phân hệ 7: Động cơ Quy tắc Tùy biến (Custom Security Rule Engine)

### 7.1 Tính Năng Quản trị Quy tắc:
- Cho phép quản trị viên thêm mới, chỉnh sửa, bật/tắt các quy tắc bảo mật tùy biến theo nhu cầu doanh nghiệp.
- **Các loại quy tắc hỗ trợ:**
  - *Regex Pattern:* Nhận dạng biểu thức chính quy (ví dụ nhận dạng chuỗi IP, cổng lạ, từ khóa nhạy cảm).
  - *Domain Blacklist:* Chặn tuyệt đối danh sách tên miền lừa đảo đã biết.
  - *Domain Whitelist:* Cho phép các tên miền nội bộ tin cậy luôn đi qua, loại trừ báo động giả.
- **Trọng số & Độ ưu tiên (Priority & Weight):** Quy tắc có priority cao hơn sẽ được áp dụng trước và ghi đè kết quả của tầng AI nếu cần thiết.

---

## 8. Phân hệ 8: So sánh Đối chuẩn Baseline (Model vs Heuristic Baseline)

### 8.1 Mục đích Khoa học & Thực nghiệm:
Cho phép ban giám khảo, nhà nghiên cứu và kỹ sư so sánh trực quan hiệu năng và kết quả phân loại giữa:
- **Baseline Cổ điển (Heuristic Rule-based):** Sử dụng đếm số ký tự đặc biệt, độ dài URL, số dấu chấm.
- **Mô hình Học sâu SecureAI (BiLSTM + Attention):** Ánh xạ ký tự chuỗi kết hợp cơ chế chú ý ngữ cảnh.
- Cung cấp đồ thị so sánh độ chính xác (Accuracy), F1-Score, thời gian phản hồi (Latency) để chứng minh tính vượt trội khoa học của giải pháp.

---

## 9. Phân hệ 9: Xác thực Người dùng & Phân quyền Truy cập (Auth & RBAC)

### 9.1 Cơ chế Bảo mật:
- Xác thực chuẩn công nghiệp **JSON Web Token (JWT)** với Access Token và Refresh Token.
- Mã hóa mật khẩu bằng thuật toán băm an toàn **BCrypt / PBKDF2**.
- Phân quyền theo vai trò (Role-Based Access Control):
  - `Admin`: Toàn quyền cấu hình quy tắc, quản trị tài khoản, xem audit log.
  - `Analyst`: Vận hành SOC, xử lý cảnh báo, mở và đóng vé sự cố, quét URL/Email.
  - `User`: Quét URL kiểm tra an toàn cá nhân.

---

## 10. Bảng Tổng hợp API Endpoints của Hệ thống

### 10.1 Backend API (ASP.NET Core 10 - Port 7124)
| Method | Endpoint | Quyền hạn | Chức năng |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Đăng nhập nhận JWT Access & Refresh Token |
| `POST` | `/api/auth/register` | Public | Đăng ký tài khoản người dùng mới |
| `GET` | `/api/dashboard/stats` | Analyst, Admin | Lấy số liệu thống kê tổng hợp toàn hệ thống |
| `GET` | `/api/threats` | Analyst, Admin | Lấy danh sách mối đe dọa với phân trang & bộ lọc |
| `GET` | `/api/alerts` | Analyst, Admin | Lấy danh sách cảnh báo an ninh thời gian thực |
| `POST` | `/api/alerts/{id}/promote` | Analyst, Admin | Chuyển đổi cảnh báo thành vé sự cố |
| `GET` | `/api/incidents` | Analyst, Admin | Quản lý danh sách sự cố SOC |
| `PUT` | `/api/incidents/{id}/status`| Analyst, Admin | Cập nhật tiến độ xử lý sự cố |
| `GET` | `/api/rules` | Analyst, Admin | Quản lý danh sách các quy tắc của Rule Engine |
| `POST` | `/api/rules` | Admin | Thêm mới một quy tắc bảo mật tùy chỉnh |

### 10.2 AI Inference Service (FastAPI - Port 8000)
| Method | Endpoint | Chức năng |
| :--- | :--- | :--- |
| `GET` | `/health` | Kiểm tra trạng thái máy chủ AI, RAM, GPU/CPU |
| `POST` | `/predict` | Dự đoán URL với BiLSTM-Attention, trả về điểm số và Attention Heatmap |
| `POST` | `/email/analyze` | Phân tích toàn diện email, trích xuất OCR và quét mã QR độc hại |
| `GET` | `/baseline/compare` | So sánh hiệu năng đối chuẩn giữa BiLSTM và Heuristics |
