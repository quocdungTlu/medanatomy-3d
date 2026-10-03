# Quy trình duyệt nội dung

1. `npm run content:export` → tạo `cardiovascular.structures.csv` và `cardiovascular.questions.csv` trong thư mục này.
2. Import CSV vào Google Sheets (File → Import → Upload, chọn "Thay thế trang tính hiện tại"). Chia sẻ cho cố vấn quyền chỉnh sửa.
3. Cố vấn sửa trực tiếp các cột văn bản, điền cột `status` (Đã duyệt / Cần sửa), `reviewer` (tên), `note` (lý do sửa). Cột `reviewedAt` để trống sẽ lấy ngày import.
4. Tải về CSV (File → Download → CSV), chạy `npm run content:import -- content/review/<file>.csv`.
5. Kiểm tra `git diff content/cardiovascular.json`, chạy `npm run content:validate`, commit.

Chỉ dòng có `status = Đã duyệt` **và** `reviewer` không rỗng mới được đánh dấu đã duyệt trong app. Câu hỏi hiện duyệt bằng tay (sửa trực tiếp JSON), vì số lượng nhỏ.
