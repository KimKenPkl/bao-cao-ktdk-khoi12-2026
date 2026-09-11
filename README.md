# Báo cáo KTĐK L1–L2 | Khối 12 – THPT Chi Lăng (2026–2027)

Web tổng hợp chi tiết tình hình học tập từng lớp và toàn khối từ bảng điểm KTĐK Lần 1 (23/8/2026) & Lần 2 (đã rà soát).

**Tính năng:**
- Tổng quan toàn khối: TB L1→L2, tỉ lệ <5, thanh tỉ lệ CSS (không thư viện nặng)
- Ma trận lớp × môn (TB L2 + Δ + số em <5)
- Chi tiết từng lớp: danh sách **phụ đạo (<5)**, **quan tâm (5–6.5)**, **bồi dưỡng (≥8)**, tiến bộ/thụt lùi + xuất CSV
- Toàn khối theo môn: phụ đạo/bồi dưỡng + top 10 tăng/giảm + xuất CSV
- Tra cứu từng học sinh (gõ không dấu được)
- In báo cáo (nút In)

**Kiến trúc tải nhanh (single-file):**
- `index.html` là 1 file duy nhất: CSS + dữ liệu + JS đều nhúng sẵn — mở là hiện ngay, không chờ fetch, không treo "Đang tải".
- Không Tailwind/Chart.js CDN nặng. Chỉ 1 request Google Font (có `display=swap`, mất mạng vẫn đọc tốt).
- Nguồn maintain: `src/template.html` + `src/style.css` + `src/app.js` + `data.json`.
- Build: `python build.py` (tự chạy `node --check` 2 vòng, abort nếu lỗi JS) → ra `index.html`.
- Kiểm thử: `node smoke_test.js` (chạy app với DOM giả, bắt lỗi runtime).

**Nguồn số liệu:** file tổng hợp "Đã rà soát" L1/L2 + file điểm từng lớp mới nhất trong Downloads (xem `data.json → meta.nguon`, script gộp: `merge_update.py`, `merge_batch2.py`).

**Quy trình cập nhật số liệu mới:** thả file điểm lớp vào Downloads → chạy script gộp → `python build.py` → `node smoke_test.js` → commit + push.
