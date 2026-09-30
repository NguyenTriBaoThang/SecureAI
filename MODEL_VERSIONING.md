# SecureAI - Model Versioning & MLOps Lifecycle

Tài liệu này quy chuẩn hóa quy trình quản lý phiên bản mô hình (Model Versioning), lưu trữ tạo tác (Artifact Tracking), chu trình tái huấn luyện (Retraining Pipeline) và chính sách hoàn tác (Rollback Policy) cho hệ thống **SecureAI**.

---

## 1. Cấu trúc Quản lý Mô hình (`secureai_ai/models/`)

Mỗi phiên bản mô hình AI chính thức được đóng gói đồng bộ gồm 4 tệp cốt lõi:

| Tệp tạo tác (Artifact) | Vai trò kỹ thuật | Định dạng |
| :--- | :--- | :---: |
| `Attention_BiLSTM.pt` | Trọng số mô hình mạng nơ-ron PyTorch đã được huấn luyện | Binary (.pt) |
| `char2idx.pkl` | Bảng từ điển ánh xạ chuỗi ký tự sang số nguyên (Character Tokenizer) | Pickle (.pkl) |
| `config.json` | Siêu tham số kiến trúc: `max_len`, `vocab_size`, `embedding_dim`, `hidden_dim` | JSON |
| `label_encoder.pkl` | Bộ chuyển đổi nhãn ngược: `0 -> benign`, `1 -> phishing`, `2 -> malware`, `3 -> defacement` | Pickle (.pkl) |

Tệp phụ trợ đối chiếu:
- `model_comparison.csv`: Bảng số liệu benchmark định lượng giữa các kiến trúc RNN, LSTM, BiLSTM và Attention.

---

## 2. Quy ước Đặt tên Phiên bản (Semantic Versioning for ML)

Hệ thống SecureAI áp dụng quy ước đánh số phiên bản theo định dạng:

```text
v<Major>.<Minor>.<Patch>-<DataVersion>
Ví dụ: v2.4.0-d2026Q3
```

- **Major (`X.0.0`)**: Thay đổi cấu trúc kiến trúc cốt lõi (ví dụ: chuyển đổi từ RNN sang BiLSTM+Transformer/Attention). Yêu cầu cập nhật lại code inference trong `predictor.py`.
- **Minor (`0.X.0`)**: Tái huấn luyện mô hình trên tập dữ liệu mở rộng lớn hơn hoặc tinh chỉnh siêu tham số (Hyperparameter Tuning) giúp tăng F1-Score mà không làm thay đổi input/output shape.
- **Patch (`0.0.X`)**: Cập nhật danh sách từ điển token, khắc phục lỗi padding chuỗi hoặc tinh chỉnh ngưỡng kích hoạt softmax.
- **DataVersion (`dYYYYQx`)**: Định danh quý/năm thu thập tập dữ liệu dùng cho đợt huấn luyện đó.

---

## 3. Vòng đời Huấn luyện & Tái Huấn luyện (Retraining Lifecycle)

```mermaid
graph TD
    A[Quét URL / Phân tích Email] --> B[Gắn nhãn kết quả AI]
    B --> C[SOC Analyst kiểm tra & Gửi Feedback]
    C --> D{Xác nhận nhãn?}
    D -- Đúng nhãn --> E[Lưu trữ URL Dataset Đạt chuẩn]
    D -- Báo động giả --> F[Đánh dấu False Positive & Gắn nhãn sửa đổi]
    F --> E
    E --> G[Kiểm toán dữ liệu & Khử trùng lặp]
    G --> H[Kích hoạt Pipeline Tái huấn luyện (Train Job)]
    H --> I{Kiểm tra Benchmark vs Active Model}
    I -- Accuracy/F1 cao hơn --> J[Triển khai Model Mới (Canary Deployment)]
    I -- Kém hơn --> K[Hủy bỏ đợt huấn luyện & Báo cáo Alert]
```

### Tiêu chí Đánh giá Mô hình Mới Được phép Triển khai (Promote Criteria):
1. **Weighted F1-Score**: Phải $\ge 94.0\%$ trên tập kiểm thử độc lập.
2. **False Positive Rate trên nhãn Benign**: Phải $\le 1.8\%$ (tránh gây gián đoạn truy cập của người dùng đối với các trang web hợp lệ).
3. **Độ trễ trung bình (Inference Latency)**: Không được vượt quá `10 ms / URL` trên phần cứng chuẩn CPU.

---

## 4. Chính sách Hoàn tác An toàn (Rollback Policy)

Trong trường hợp mô hình mới sau khi đưa lên production phát sinh hành vi bất thường hoặc tỷ lệ báo động giả tăng đột biến:
1. Thư mục `secureai_ai/models/` luôn duy trì bản sao lưu ổn định liền trước: `Attention_BiLSTM.pt.stable`.
2. Lệnh chuyển đổi rollback nhanh:
   ```powershell
   Copy-Item secureai_ai\models\Attention_BiLSTM.pt.stable secureai_ai\models\Attention_BiLSTM.pt -Force
   ```
3. Khởi động lại dịch vụ `secureai_ai` mà không làm gián đoạn Backend Gateway (hệ thống sẽ tự động dùng fallback heuristics trong vài giây khởi động lại).
