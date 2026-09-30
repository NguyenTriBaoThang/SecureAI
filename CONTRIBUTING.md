# Hướng dẫn Đóng góp Mã nguồn (Contributing to SecureAI)

Cảm ơn bạn đã quan tâm đến việc đóng góp cho dự án **SecureAI**! Sự tham gia của cộng đồng là nhân tố then chốt giúp hệ thống ngày một hoàn thiện, an toàn và thông minh hơn.

---

## 📋 Bộ quy tắc ứng xử (Code of Conduct)
Dự án áp dụng tiêu chuẩn ứng xử Contributor Covenant. Khi tham gia vào bất kỳ hoạt động thảo luận, đóng góp mã nguồn hoặc báo cáo lỗi nào, vui lòng đọc và tuân thủ [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

## 🛠️ Quy trình Bắt đầu Đóng góp

### 1. Báo cáo Lỗi (Bug Reports)
Nếu bạn phát hiện lỗi logic, lỗi giao diện hoặc sự cố mô hình:
- Kiểm tra danh sách **Issues** trên GitHub để đảm bảo lỗi chưa từng được báo cáo trước đó.
- Tạo một Issue mới bằng mẫu **Bug Report** có sẵn.
- Cung cấp các thông tin cụ thể:
  - Hệ điều hành và môi trường chạy (`Node.js`, `.NET`, `Python`).
  - Các bước tái hiện lỗi (Step-to-reproduce).
  - Ảnh chụp màn hình hoặc log lỗi chi tiết.

### 2. Đề xuất Tính năng mới (Feature Requests)
Chúng tôi luôn chào đón các ý tưởng sáng tạo:
- Mở một Issue mới sử dụng mẫu **Feature Request**.
- Giải thích rõ: Tính năng này giải quyết vấn đề gì cho SOC Analyst hoặc người dùng?
- Đề xuất giải pháp kiến trúc hoặc tài liệu tham khảo (nếu có).

### 3. Đóng góp Mã nguồn (Pull Requests)
1. **Fork** repository về tài khoản cá nhân.
2. Clone về máy cục bộ và tạo nhánh mới tuân theo [BRANCHING.md](BRANCHING.md).
3. Đảm bảo mã nguồn tuân thủ các quy tắc định dạng:
   - **Frontend**: Chạy kiểm tra TypeScript `npm run build` không có lỗi.
   - **Backend**: Chạy `dotnet build` đạt kết quả 0 warning/error.
   - **AI Service**: Đảm bảo tệp mã nguồn Python tuân thủ chuẩn PEP 8.
4. Viết commit message theo chuẩn **Conventional Commits**:
   - `feat(...)`: Thêm tính năng mới
   - `fix(...)`: Sửa lỗi
   - `docs(...)`: Cập nhật tài liệu
   - `refactor(...)`: Tái cấu trúc mã nguồn không thay đổi logic
   - `perf(...)`: Tối ưu hiệu năng xử lý
5. Tạo **Pull Request** về nhánh `develop` của SecureAI.

---

## 🧪 Kiểm tra Tiêu chuẩn Trước khi Mở PR

Chạy lệnh kiểm thử tổng hợp để đảm bảo tất cả các thành phần đều sẵn sàng:

```powershell
# Kiểm tra Frontend
cd secureai_frontend
npm run build

# Kiểm tra Backend
cd ..\secureai_backend
dotnet build secureai_backend.slnx --no-restore

# Kiểm tra cú pháp Python
cd ..\secureai_ai
python -m py_compile src\main.py src\routes.py src\predictor.py
```
