# SecureAI - Kịch bản Trình bày Demo (Demo Script)

Tài liệu này được biên soạn nhằm hướng dẫn người thuyết trình hoặc ban giám khảo thực hiện buổi trình diễn (Live Demo) hệ thống **SecureAI Command Center** trong khoảng thời gian từ **5 đến 7 phút**.

---

## ⏱️ Tổng quan thời lượng Demo

| Thời lượng | Phân đoạn | Mục tiêu chính |
| :---: | :--- | :--- |
| **0:00 - 0:45** | Mở đầu & Đăng nhập 3D Cyber Portal | Giới thiệu bài toán, hiển thị cổng đăng nhập bảo mật |
| **0:45 - 2:00** | Trung tâm chỉ huy (Command Center) & Dashboard | Tổng quan giám sát SOC, biểu đồ xu hướng, SignalR alert |
| **2:00 - 3:30** | Quét URL trực tiếp & Giải thích AI (XAI Heatmap) | Phân tích URL độc hại, chứng minh tính năng Heatmap |
| **3:30 - 4:45** | Phân tích Email Phishing đa phương thức | Kiểm tra SPF/DKIM/DMARC và trích xuất OCR/PDF |
| **4:45 - 5:45** | Động cơ Quy tắc (Rule Engine) & Quản lý Sự cố | Điều chỉnh ngưỡng Block/Review và đóng case Incident |
| **5:45 - 6:30** | So sánh Mô hình Baseline & Kết luận | Benchmark đối chiếu 4 thuật toán và tổng kết giá trị |

---

## 🚀 Kịch bản chi tiết từng bước

### Bước 1: Khởi động hệ thống & Đăng nhập (0:00 - 0:45)
1. Mở trình duyệt tại đường dẫn: `http://localhost:5173/login`.
2. **Lời dẫn thuyết trình:**
   > *"Kính thưa Ban Giám khảo, đây là cổng đăng nhập SecureAI Portal được thiết kế theo phong cách 3D Cyber Security hiện đại. Hệ thống tích hợp xác thực JWT bảo vệ đa lớp và hỗ trợ phân quyền người dùng (Role-Based Access Control) nghiêm ngặt."*
3. Nhấp vào nút tài khoản mẫu: **Admin (Admin@123)**.
4. Nhấn **"Đăng nhập vào SOC"** để truy cập vào hệ thống.

---

### Bước 2: Khám phá Trung tâm Chỉ huy & SOC Dashboard (0:45 - 2:00)
1. **Trang chủ (`/`):**
   * Giới thiệu thẻ Hero 3D Metallic, khối Holographic Live SOC bên phải hiển thị trạng thái hoạt động thực tế.
   * Thử nghiệm thu gọn và mở rộng menu Sidebar bằng nút `<` / `>` để thể hiện tính linh hoạt cho không gian làm việc của chuyên gia SOC.
2. **Chuyển sang SOC Dashboard (`/dashboard`):**
   * Trình bày các thẻ `StatCard` 3D có thanh dạ quang: Tổng số mối đe dọa, số lượng phát hiện hôm nay, cảnh báo nguy cấp và sự cố đang mở.
   * Quan sát biểu đồ đường xu hướng 7 ngày (Recharts) phân tách 4 loại nhãn: Phishing, Malware, Defacement, Benign.

---

### Bước 3: Thử nghiệm Quét URL & Trực quan hóa XAI Heatmap (2:00 - 3:30)
1. Truy cập vào mục **"Quét URL nhanh" (`/scan`)** hoặc ô Quick Scan trên Dashboard.
2. Nhập một URL lừa đảo giả mạo tài khoản:
   ```text
   http://free-apple-login-verify.net/id/account
   ```
3. Nhấn **"Bắt đầu quét"**:
   * Hệ thống hiển thị kết luận tức thì: **CHẶN (BLOCK)**, Mức độ rủi ro **HIGH (96.4%)**, Phân loại **Phishing**.
   * Chỉ rõ các thuộc tính Threat Intelligence: Domain, SSL, Subdomain, từ khóa đáng ngờ.
4. Di chuột vào bảng **XAI Attention Heatmap**:
   > *"Điểm cốt lõi làm nên sự khác biệt của SecureAI là tính minh bạch Explainable AI. Ban Giám khảo có thể thấy mô hình BiLSTM + Attention tự động làm nổi bật các ký tự mang tính lừa đảo như 'apple', 'login', 'verify' với gam màu đỏ rực rỡ, kèm theo trọng số đóng góp chính xác khi di chuột."*
5. Nhấp nút **"Kết quả đúng"** để thể hiện vòng lặp phản hồi dữ liệu chủ động (Active Feedback Loop).

---

### Bước 4: Phân tích Email Phishing Đa phương thức (3:30 - 4:45)
1. Truy cập vào trang **"Phân tích Email" (`/email`)**.
2. **Kịch bản nhập nội dung:**
   * Tab Nhập thông tin: Nhập From `security-alert@verify-service.com`, Subject `Tài khoản ngân hàng của bạn bị khóa tạm thời`.
   * Body: Dán nội dung yêu cầu nhấn vào liên kết xác minh gấp trong 24 giờ.
3. Nhấn **"Phân tích Email ngay"**:
   * Hệ thống chỉ ra ngay các dấu hiệu cảnh báo tiêu đề: **SPF FAIL**, **DKIM FAIL**, `Reply-To` không khớp.
   * Đếm từ khóa khẩn cấp, từ khóa lừa đảo và trích xuất URL nhúng trong email.
4. Chuyển sang tab **"Tải tệp Ảnh / PDF"**: Giới thiệu khả năng bóc tách email từ ảnh chụp màn hình bằng công nghệ OCR.

---

### Bước 5: Cấu hình Rule Engine & Xử lý Sự cố (4:45 - 5:45)
1. Mở trang **"Luật cảnh báo (Rules)" (`/rules`)**:
   * Thể hiện giao diện điều chỉnh ngưỡng Block Threshold và Review Threshold dạng 3D phát sáng.
   * Thử kéo thanh trượt Block Threshold và bật tắt chính sách tự động hóa (Auto-Block, Auto-Alert).
2. Mở trang **"Quản lý sự cố" (`/incidents`)**:
   * Chứng minh các mối đe dọa High/Critical tự động được nâng cấp thành Incident Case.
   * Nhấp chuyển trạng thái sự cố sang **"Đang điều tra" (Investigating)** hoặc **"Đã giải quyết" (Resolved)** kèm theo ghi chú kết luận.

---

### Bước 6: Thử nghiệm So sánh Baseline & Tổng kết (5:45 - 6:30)
1. Mở trang **"So sánh mô hình" (`/baseline`)**:
   * Nhấp vào một URL mẫu thử nghiệm.
   * Quan sát biểu đồ đối đầu trực tiếp: Mô hình **BiLSTM + Attention** phát hiện chính xác với độ trễ tối ưu chỉ **~4.2ms**, vượt trội so với danh sách đen (Blacklist) bị bỏ lọt.
2. **Lời kết thuyết trình:**
   > *"SecureAI không chỉ dừng lại ở một mô hình AI nghiên cứu trong phòng thí nghiệm, mà là một giải pháp hoàn chỉnh từ kiến trúc phân tán microservices, giao diện SOC 3D trực quan, đến quy trình hỗ trợ ra quyết định tự động cho doanh nghiệp. Xin chân thành cảm ơn Ban Giám khảo!"*
