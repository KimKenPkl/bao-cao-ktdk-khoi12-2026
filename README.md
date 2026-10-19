# Báo cáo KTĐK L1–L7 | Khối 12 – THPT Chi Lăng (2026–2027)

🌐 Web public: **https://kimkenpkl.github.io/bao-cao-ktdk-khoi12-2026/**

Web tổng hợp chi tiết tình hình học tập từng lớp và toàn khối từ bảng điểm KTĐK **Lần 1 → Lần 7** (L1–L6 đủ 11 lớp; L7 đã có 12A10 đủ 33 HS và tiếp tục cập nhật cuốn chiếu các lớp còn lại).

**Tính năng:**
- Tổng quan toàn khối: diễn biến TB L1 → L7, tỉ lệ <5, thanh tỉ lệ CSS (không thư viện nặng)
- Ma trận lớp × môn (tự động hiển thị đợt mới nhất của từng lớp: 12A10 hiện L7, các lớp khác hiện L6 + Δ + số em <5)
- Chi tiết từng lớp: chọn đợt xét (`Mới nhất (L7/L6)`, `TB tất cả các lần`, hoặc `L1..L7`) để lọc **phụ đạo (<5)**, **quan tâm (5–6.5)**, **bồi dưỡng (≥8)**, tiến bộ/thụt lùi + xuất CSV
- Toàn khối theo môn: phụ đạo/bồi dưỡng + top 10 tăng/giảm + xuất CSV
- Tra cứu từng học sinh: xem trọn 7 đợt L1 → L7 + biểu đồ cột tiến triển 7 đợt
- Bảng điểm L1 → L7 kiểu Sheets + Xét tổ hợp môn (A00, A01, B00, C03, D01, D07) + So sánh giữa các lớp

**Quy trình cập nhật số liệu mới:**
`python merge_to_l7.py` → `python build.py` → `node smoke_test.js` → commit + push.
