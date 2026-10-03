
## Bảng nội dung (content_schema.sql + seed_content.sql)
Git (`content/*.json`) là nguồn sự thật; Supabase giữ bản đồng bộ để truy vấn/AI/cố vấn.
Đồng bộ: `npm run content:sql` → dán `supabase/seed_content.sql` vào SQL editor → Run (idempotent, không cần service key).
Đọc công khai qua REST với khóa publishable; ghi chỉ qua SQL editor. Lần đồng bộ đầu: 12 nguồn, 35 cấu trúc, 70 câu hỏi, 155 liên kết.
