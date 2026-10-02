# Kiểm thử trình duyệt

Script Playwright chạy trên bản build production để chụp ảnh và bắt lỗi console trên desktop (1280×800) và mobile (390×844).

```bash
npm run build && npx vite preview --port 4173 &
node e2e/smoke.mjs      # ảnh lưu vào thư mục OUT trong file
node e2e/debug.mjs      # chỉ in console/pageerror
```

Cần Chromium của Playwright (`npx playwright install chromium`) hoặc sửa `executablePath`.
