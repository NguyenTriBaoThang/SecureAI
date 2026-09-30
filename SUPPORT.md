# Kênh Hỗ trợ & Trợ giúp (Support for SecureAI)

Cảm ơn bạn đã sử dụng **SecureAI**. Nếu bạn cần hỗ trợ kỹ thuật, giải đáp thắc mắc về kiến trúc hoặc gặp khó khăn khi cài đặt, dưới đây là các kênh hỗ trợ chính thức.

---

## 📚 1. Tài liệu Hướng dẫn

Trước khi mở yêu cầu hỗ trợ, bạn có thể tham khảo các tài liệu có sẵn trong kho mã nguồn:
- **Hướng dẫn cài đặt & Khởi chạy**: Xem tại [README.md](README.md).
- **Kiến trúc & Luồng dữ liệu**: Xem tại [ARCHITECTURE.md](ARCHITECTURE.md).
- **Kịch bản Demo**: Xem tại [DEMO_SCRIPT.md](DEMO_SCRIPT.md).
- **Tài liệu MLOps & Quản lý Mô hình**: Xem tại [MODEL_VERSIONING.md](MODEL_VERSIONING.md).
- **Hướng dẫn Docker**: Xem tại [docs/DOCKER.md](docs/DOCKER.md).

---

## 💬 2. Các Kênh Hỗ trợ Trực tuyến

| Kênh liên lạc | Mục đích sử dụng | Thời gian phản hồi |
| :--- | :--- | :---: |
| **GitHub Discussions** | Đặt câu hỏi chung, trao đổi ý tưởng kiến trúc, chia sẻ mẹo triển khai | Trong vòng 24 - 48h |
| **GitHub Issues** | Báo cáo lỗi phần mềm (Bug) hoặc yêu cầu tính năng mới (Feature Request) | Trong vòng 24h |
| **Email Trợ giúp** | Liên hệ trực tiếp: `support@secureai.local` | Trong vòng 1 - 2 ngày làm việc |

---

## ❓ 3. Các Câu hỏi Thường gặp (FAQ)

### Q: Làm sao để sửa lỗi không kết nối được dịch vụ AI từ Frontend?
**A:** Đảm bảo `secureai_ai` đang chạy tại cổng `http://localhost:8000`. Kiểm tra trạng thái bằng lệnh `curl http://localhost:8000/health`. Tệp `.env` của frontend phải có biến `VITE_ML_URL=http://localhost:8000`.

### Q: Tôi có thể chạy SecureAI mà không cần GPU không?
**A:** Hoàn toàn được. Mô hình `Attention_BiLSTM.pt` được tối ưu hóa siêu nhẹ, thời gian inference trên CPU chỉ mất trung bình **~4.2 ms / URL**.

### Q: Mật khẩu mặc định của tài khoản Admin là gì?
**A:** Tài khoản mặc định trong bản phát triển:
- Email: `admin@secureai.local`
- Mật khẩu: `Admin@123`
*(Vui lòng đổi mật khẩu ngay khi đưa hệ thống lên môi trường production).*
