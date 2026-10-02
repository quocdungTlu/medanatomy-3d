# MedAnatomy 3D

Web app học giải phẫu bằng mô hình 3D tương tác cho sinh viên Y: tiếng Việt + Latin, bám giáo trình, Quiz kiểu thi chạy trạm, chạy tốt trên điện thoại.

**Trạng thái:** MVP tuần 1 – khung dự án và tech spike. Hệ cơ quan đầu tiên: hệ tim mạch (có thể đổi sau cổng Go/No-go 19/10/2026).

## Chạy thử

```bash
npm install
npm run dev        # http://localhost:5173
```

Chưa có file `public/models/heart.glb` thì app dùng model sơ đồ hóa để phát triển tương tác. Xem `public/models/README.md` để đưa model thật vào.

## Lệnh

| Lệnh | Việc |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Validate nội dung → type check → build production |
| `npm test` | Unit test (Vitest) |
| `npm run lint` | ESLint |
| `npm run content:validate` | Kiểm tra `content/*.json` theo schema và tham chiếu chéo |
| `npm run model:optimize` | Nén `public/models/raw/heart.glb` → `public/models/heart.glb` (Draco + WebP) |
| `npm run model:check` | So khớp tên mesh trong .glb với `meshNames` trong nội dung |

## Cấu trúc

```
content/            JSON nội dung y khoa + câu hỏi (nguồn sự thật, review qua PR)
public/models/      Model .glb đã nén
scripts/            validate-content, check-meshes
src/
  content/          Schema Zod, nạp và index nội dung
  scene/            Canvas R3F, ModelRoot (chọn/highlight/ẩn/xuyên thấu), camera, model placeholder
  components/       Toolbar, StructureList, InfoPanel, QuizPanel
  quiz/             Quiz engine thuần (có test)
  store/            Zustand store
  lib/              analytics (PostHog), supabase
supabase/schema.sql Bảng + RLS
```

## Cấu hình

Sao chép `.env.example` → `.env`. Để trống Supabase/PostHog thì app vẫn chạy đầy đủ, chỉ không đăng nhập, lưu điểm hay gửi analytics.

## Nội dung y khoa

Mỗi cấu trúc trong `content/*.json` cần `reviewedBy` + `reviewedAt` trước khi ra bản beta. Cấu trúc chưa duyệt hiển thị nhãn "nháp" trong app và cảnh báo khi build. Đây là công cụ học tập, không thay thế tài liệu chính thức và không dùng để chẩn đoán.

## Stack

Vite · React 19 · TypeScript · React Three Fiber + drei · Zustand · Tailwind v4 · Zod · Vitest · Supabase · PostHog · vite-plugin-pwa · Vercel
