# Chính sách Bảo mật (Security Policy)

Là một nền tảng an ninh mạng, **SecureAI** coi trọng tính an toàn, bảo mật dữ liệu và quyền riêng tư của người dùng lên hàng đầu.

---

## 1. Các Phiên bản Được Hỗ trợ Cập nhật Bảo mật

| Phiên bản | Trạng thái hỗ trợ bảo mật |
| :--- | :---: |
| `v2.4.x` (Hiện tại) | :white_check_mark: Được hỗ trợ đầy đủ |
| `v2.0.x` | :white_check_mark: Bản vá lỗi nghiêm trọng (Critical only) |
| `< v2.0.0` | :x: Không còn hỗ trợ |

---

## 2. Quy trình Báo cáo Lỗ hổng Bảo mật (Reporting a Vulnerability)

> [!CAUTION]
> **Vui lòng KHÔNG công khai lỗ hổng bảo mật lên GitHub Issues công cộng.**

Nếu bạn phát hiện bất kỳ lỗ hổng bảo mật tiềm ẩn nào liên quan đến:
- Rò rỉ thông tin xác thực, token JWT hoặc bypass phân quyền RBAC.
- Tấn công tiêm mã (SQL Injection, XSS, Command Injection).
- Lỗ hổng đầu độc dữ liệu (Data Poisoning) hoặc tấn công mô hình AI (Adversarial Attacks).

### Các bước báo cáo an toàn:
1. Gửi email trực tiếp đến địa chỉ: **`security@secureai.local`** (hoặc mở một [GitHub Security Advisory](https://github.com/NguyenTriBaoThang/SecureAI/security/advisories)).
2. Cung cấp thông tin chi tiết:
   - Mô tả lỗ hổng và phạm vi tác động.
   - Các bước cụ thể để tái hiện (Proof-of-Concept).
   - Đề xuất phương án khắc phục (nếu có).

### Cam kết của Đội ngũ SecureAI:
- **Xác nhận tiếp nhận:** Trong vòng **24 - 48 giờ** làm việc.
- **Đánh giá & Khắc phục:** Cung cấp bản vá thử nghiệm trong vòng **7 ngày** đối với lỗi nghiêm trọng.
- **Công bố có trách nhiệm (Responsible Disclosure):** Sau khi bản vá chính thức được phát hành, chúng tôi sẽ vinh danh người đóng góp trong phần Release Notes (trừ khi bạn yêu cầu ẩn danh).
