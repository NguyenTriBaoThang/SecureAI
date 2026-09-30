# Setting Up Commit Lint — SecureAI

SecureAI áp dụng chuẩn [commitlint](https://commitlint.js.org/) kết hợp [Husky](https://typicode.github.io/husky/) để duy trì lịch sử Git commit sạch sẽ, rõ ràng và phục vụ tự động hóa Changelog cho các phiên bản phát hành.

---

## 1. Thiết lập Cục bộ (Local Setup)

```bash
# Cài đặt tại thư mục gốc repository
npm install

# Các git hooks của Husky sẽ tự động được kích hoạt
```

---

## 2. Quy chuẩn Định dạng Commit (Commit Format)

Mỗi commit message phải tuân thủ nghiêm ngặt định dạng:

```
<type>(scope): short description
```

### Bảng các loại commit (`type`):

| Type | Ý nghĩa & Mục đích |
| :--- | :--- |
| `feat` | Thêm tính năng mới (vd: giao diện mới, endpoint API mới) |
| `fix` | Sửa lỗi phần mềm hoặc xử lý ngoại lệ |
| `sec` | Vá lỗ hổng an toàn thông tin hoặc cập nhật cơ chế bảo mật |
| `ai` | Thay đổi mô hình AI, cập nhật trọng số BiLSTM-Attention hoặc dataset |
| `docs` | Thêm hoặc cập nhật tài liệu (`README`, `ARCHITECTURE`, etc.) |
| `style` | Căn chỉnh định dạng CSS, giao diện 3D Cyber hoặc linting |
| `refactor` | Tái cấu trúc mã nguồn mà không làm thay đổi tính năng |
| `perf` | Cải thiện hiệu năng xử lý (tốc độ inference, query database) |
| `test` | Bổ sung hoặc sửa đổi các bài kiểm thử tự động |
| `ci` | Thay đổi cấu hình GitHub Actions hoặc Docker compose |
| `chore` | Cập nhật dependencies, build script phụ trợ |

---

## 3. Ví dụ Chuẩn (Examples)

```bash
# Thêm tính năng giao diện mới
git commit -m "feat(ui): implement 3d cyber glassmorphic sidebar and lucide icons"

# Nâng cấp mô hình AI
git commit -m "ai(model): optimize self-attention extraction latency to 11ms"

# Sửa lỗi backend API
git commit -m "fix(backend): correct jwt expiration timestamp and cors header"

# Cập nhật tài liệu
git commit -m "docs(competition): add complete technical dossier for contest committee"

# Docker & CI/CD
git commit -m "ci(docker): add multi-stage builds and github actions publish workflow"
```

---

## 4. Trường hợp Khẩn cấp (Bypass Validation)

Chỉ sử dụng khi xử lý hotfix khẩn cấp trong điều kiện đặc biệt:

```bash
git commit -m "fix: emergency hotfix" --no-verify
```
