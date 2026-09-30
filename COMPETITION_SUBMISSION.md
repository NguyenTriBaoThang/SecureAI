# SecureAI - Competition Submission Guide

## 1. Project Identity

- **Project Name:** SecureAI Command Center
- **Full Title:** SecureAI — Nền tảng Giám sát An ninh mạng & Hỗ trợ Ra quyết định Tự động ứng dụng Trí tuệ nhân tạo (AI-Driven SOC Platform)
- **Category:** An toàn thông tin, Ứng dụng Trí tuệ nhân tạo (AI & Cybersecurity), Giải pháp Chuyển đổi số.
- **Target Audience:** Trung tâm vận hành an ninh (SOC), Doanh nghiệp vừa và nhỏ, Cơ quan tổ chức cần giám sát luồng URL/Email, và các Chuyên viên Phân tích An ninh mạng (Security Analysts).

---

## 2. Problem Statement (Tính cấp thiết của đề tài)

1. **Sự bùng nổ của tấn công phi kỹ thuật (Social Engineering & Phishing):** Hơn 85% các vụ xâm nhập hệ thống bắt nguồn từ các liên kết độc hại qua email hoặc tin nhắn giả mạo. Các cuộc tấn công ngày càng tinh vi với kỹ thuật mạo danh ký tự (Homograph Attack), che giấu liên kết đa tầng và thay đổi domain liên tục.
2. **Hạn chế của giải pháp truyền thống:**
   - Các danh sách đen (Blacklists) tĩnh như DNSBL hoặc IP Blocklists có độ trễ lớn (thường từ 24 - 48 giờ để phát hiện và cập nhật), hoàn toàn bất lực trước các domain Zero-day được sinh tự động bằng DGA.
   - Các hệ thống SIEM/SOC truyền thống sinh ra hàng nghìn cảnh báo mỗi ngày dẫn đến tình trạng **Alert Fatigue** (quá tải cảnh báo), khiến chuyên gia bỏ sót các nguy cơ thực sự nghiêm trọng.
3. **Thiếu tính minh bạch của AI (Black-box problem):** Nhiều mô hình học máy đưa ra điểm số rủi ro nhưng không thể giải thích *tại sao* URL đó nguy hiểm, khiến chuyên gia thiếu cơ sở để thực thi lệnh Chặn (Block) trên diện rộng.

---

## 3. Proposed Solution (Giải pháp đề xuất)

**SecureAI** là một hệ sinh thái an ninh mạng hoàn chỉnh, kết hợp mô hình AI phân tích chuỗi ký tự mức sâu với quy trình vận hành SOC tự động:

- **Phát hiện URL độc hại đa nhãn:** Phân loại chính xác 4 trạng thái: *Benign (An toàn)*, *Phishing (Lừa đảo)*, *Malware (Mã độc)*, và *Defacement (Bị sửa giao diện)*.
- **Giải thích quyết định XAI (Explainable AI):** Trực quan hóa bản đồ nhiệt chú ý (Attention Heatmap) lên từng ký tự của URL, chỉ rõ các thành phần mang tính chất lừa đảo.
- **Động cơ Chính sách (Rule Engine):** Cho phép tùy biến ngưỡng rủi ro linh hoạt và tự động hóa chu trình ra quyết định: `BLOCK`, `REVIEW`, hoặc `ALLOW`.
- **Quản lý sự cố thời gian thực (Incident Response):** Tự động chuyển đổi các nguy cơ mức High/Critical thành vụ việc (Incident Case) cần điều tra, phát cảnh báo đẩy thời gian thực qua WebSockets (SignalR).
- **Phân tích Email Phishing chuyên sâu:** Kiểm tra SPF, DKIM, DMARC và trích xuất nội dung từ tệp ảnh (OCR) hoặc tài liệu PDF.

---

## 4. Core Innovation (Tính đổi mới & Sáng tạo)

### 4.1 Mô hình BiLSTM + Self-Attention phân tích chuỗi thô
Khác với các phương pháp trích xuất đặc trưng thủ công (Feature Engineering), SecureAI xử lý trực tiếp chuỗi ký tự URL (Character-level Tokenization). Mạng nơ-ron hồi quy hai chiều (BiLSTM) ghi nhận ngữ cảnh trước và sau, trong khi cơ chế Self-Attention tự động học các mẫu ký tự bất thường mà không cần truy vấn DNS ra Internet.

### 4.2 Minh bạch hóa AI (Explainable AI Heatmap)
SecureAI là một trong số ít nền tảng thương mại hóa tính năng XAI cho an ninh mạng: Chuyên viên SOC có thể nhìn thấy trực tiếp ký tự nào kích hoạt rủi ro (ví dụ: `pаypal.com` với chữ `а` Cyrillic).

### 4.3 Động cơ quy tắc thích ứng (Adaptive Rule Engine)
Hệ thống không phó mặc hoàn toàn cho mô hình AI mà cung cấp lớp chính sách bảo vệ (Policy Layer), cho phép kết hợp trí tuệ nhân tạo với quy chuẩn an toàn nội bộ của doanh nghiệp.

### 4.4 Trải nghiệm giao diện 3D Cyber / Glassmorphic SOC
Giao diện đạt tiêu chuẩn thiết kế cao cấp, tối ưu hóa hiển thị dữ liệu lớn, chuyển đổi trạng thái mượt mà, hỗ trợ chế độ thu gọn cho màn hình đa nhiệm của SOC Analyst.

---

## 5. Technical Validation & Metrics (Kết quả kiểm chứng)

Mô hình active `Attention_BiLSTM.pt` đạt các chỉ số thực nghiệm xuất sắc trên tập dữ liệu benchmark kiểm thử:
- **Độ chính xác tổng thể (Accuracy):** `94.54%`
- **F1-Score có trọng số (Weighted F1):** `94.56%`
- **Macro F1:** `95.46%`
- **Thời gian xử lý trung bình (Latency):** `~4.2 ms / URL`

So với các mô hình baseline trên cùng tập dữ liệu:
- Vượt trội hơn RNN cổ điển (+8.14% Accuracy).
- Vượt trội hơn LSTM tiêu chuẩn (+2.74% Accuracy).
- Vượt trội hơn LightGBM Heuristic (+4.29% Accuracy).

---

## 6. Social & Economic Impact (Khả năng ứng dụng & Tác động xã hội)

1. **Đối với Doanh nghiệp:** Giảm thiểu tới 70% thời gian phản hồi sự cố (MTTR), ngăn chặn rủi ro thất thoát dữ liệu do lừa đảo chiếm quyền điều khiển tài khoản doanh nghiệp (BEC - Business Email Compromise).
2. **Đối với Cộng đồng:** Có thể tích hợp thành tiện ích mở rộng trình duyệt (Browser Extension) hoặc cổng kiểm duyệt tập trung (DNS/Gateway) để bảo vệ người dân và học sinh trước các trang web giả mạo ngân hàng, độc hại hoặc cờ bạc trực tuyến.
3. **Khả năng mở rộng (Scalability):** Kiến trúc phân tán microservices (Docker containerized) cho phép triển khai linh hoạt từ máy chủ nội bộ (On-premises) đến môi trường Cloud (AWS, Azure, GCP, Kubernetes).

---

## 7. Compliance Checklist for Competition

- [x] Đầy đủ mã nguồn Frontend, Backend API và AI Inference Service.
- [x] Đã cấu hình và kiểm chứng build thành công 100% không phát sinh lỗi.
- [x] Kèm theo script khởi chạy nhanh tự động (`scripts/run-dev.ps1`).
- [x] Đã cấu hình tệp triển khai vùng chứa Docker (`docker-compose.yml`).
- [x] Tài liệu kiến trúc chuyên sâu (`ARCHITECTURE.md`) và hướng dẫn demo chi tiết (`DEMO_SCRIPT.md`).
- [x] Tài khoản mẫu demo được thiết lập sẵn trong cơ sở dữ liệu.
