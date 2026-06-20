"""
Extract Service — đọc nội dung email từ ảnh/PDF
Dùng PyMuPDF (PDF) + Pillow/pytesseract (ảnh) — hoàn toàn offline, không cần API
"""
import io
import re


def _extract_from_pdf(file_bytes: bytes) -> str:
    """Extract text từ PDF dùng PyMuPDF (fitz)."""
    try:
        import fitz  # PyMuPDF
        doc  = fitz.open(stream=file_bytes, filetype="pdf")
        text = "\n".join(page.get_text() for page in doc)
        doc.close()
        return text.strip()
    except ImportError:
        raise RuntimeError(
            "Thiếu PyMuPDF: pip install pymupdf"
        )


def _extract_from_image(file_bytes: bytes) -> str:
    """Extract text từ ảnh dùng pytesseract OCR."""
    try:
        from PIL import Image
        import pytesseract
        img  = Image.open(io.BytesIO(file_bytes))
        text = pytesseract.image_to_string(img, lang="eng+vie")
        return text.strip()
    except ImportError:
        raise RuntimeError(
            "Thiếu pytesseract hoặc Pillow: pip install pytesseract pillow\n"
            "Cần cài Tesseract OCR: https://github.com/UB-Mannheim/tesseract/wiki"
        )


def _parse_email_fields(text: str) -> dict:
    """
    Parse email fields từ raw text.
    Hỗ trợ cả Gmail screenshot và raw email format.
    """
    lines  = [l.strip() for l in text.splitlines() if l.strip()]
    result = {"from": "", "to": "", "subject": "", "body": ""}

    # Tìm From / To / Subject theo pattern
    from_patterns    = [r"^From[:\s]+(.+)", r"^Từ[:\s]+(.+)", r"^Người gửi[:\s]+(.+)"]
    to_patterns      = [r"^To[:\s]+(.+)",   r"^Đến[:\s]+(.+)", r"^Người nhận[:\s]+(.+)"]
    subject_patterns = [r"^Subject[:\s]+(.+)", r"^Tiêu đề[:\s]+(.+)", r"Re:\s*(.+)", r"Fw:\s*(.+)"]

    body_start = 0
    for i, line in enumerate(lines):
        for p in from_patterns:
            m = re.match(p, line, re.IGNORECASE)
            if m and not result["from"]:
                result["from"] = m.group(1).strip(); body_start = i + 1

        for p in to_patterns:
            m = re.match(p, line, re.IGNORECASE)
            if m and not result["to"]:
                result["to"] = m.group(1).strip(); body_start = i + 1

        for p in subject_patterns:
            m = re.match(p, line, re.IGNORECASE)
            if m and not result["subject"]:
                result["subject"] = m.group(1).strip(); body_start = i + 1

    # Nếu không tìm thấy From/Subject, thử lấy từ tiêu đề PDF
    if not result["subject"] and lines:
        # Dòng đầu tiên dài thường là subject trong Gmail export
        for line in lines[:5]:
            if len(line) > 10 and "@" not in line:
                result["subject"] = line; break

    # Body = phần còn lại sau header
    if body_start < len(lines):
        result["body"] = "\n".join(lines[body_start:])
    else:
        result["body"] = "\n".join(lines)

    return result


async def extract_email_from_file(file_bytes: bytes, media_type: str, api_key: str = "") -> dict:
    """
    Extract email fields từ file.
    - PDF → PyMuPDF (offline)
    - Ảnh → pytesseract OCR (offline)
    Không cần API key, hoàn toàn offline.
    """
    print(f"  → Extract offline — mediaType={media_type} size={len(file_bytes)//1024}KB")

    if media_type == "application/pdf":
        text = _extract_from_pdf(file_bytes)
    elif media_type.startswith("image/"):
        text = _extract_from_image(file_bytes)
    else:
        raise ValueError(f"Unsupported media type: {media_type}")

    print(f"  → Extracted text ({len(text)} chars): {text[:200]}")

    result = _parse_email_fields(text)
    print(f"  → Parsed — from={result['from'][:50]} subject={result['subject'][:50]}")
    return result