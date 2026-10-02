# Model 3D

- `heart.glb` — model đã nén (Draco), được app tải. **Không commit file lớn hơn 8 MB.**
- `raw/` — file gốc chưa nén, nằm ngoài Git (xem `.gitignore`); giữ trên Drive hoặc Git LFS.

Quy ước tên mesh: `Group_Structure_Part`, ví dụ `Heart_LeftVentricle`, `Vessel_Aorta`.
Tên này phải khớp với `meshNames` trong `content/*.json`.

Pipeline:

```bash
# 1. Xuất .glb từ Blender vào public/models/raw/heart.glb
# 2. Nén
npm run model:optimize
# 3. So khớp tên mesh với nội dung
npm run model:check
```

Khi chưa có `heart.glb`, app tự dùng model sơ đồ hóa (`src/scene/placeholderHeart.ts`).
