# Model 3D

- `heart.glb` — model đã nén (Draco), được app tải. **Không commit file lớn hơn 8 MB.**
- `raw/` — file gốc chưa nén, nằm ngoài Git (xem `.gitignore`); giữ trên Drive hoặc Git LFS.

`heart.glb` hiện tại được cắt từ dữ liệu Z-Anatomy (qua bản xuất .glb của [nqwrc/3d-anatomy](https://github.com/nqwrc/3d-anatomy)):
48 mesh, ~252k tam giác, 0,7 MB. Tên mesh là tên gốc tiếng Anh của Z-Anatomy (ví dụ `Left ventricle`,
`Posterior leaflet of left atrioventricular valve`) và phải khớp với `meshNames` trong `content/*.json`.

License model: BodyParts3D CC-BY-SA 2.1 JP + Z-Anatomy CC-BY-SA 4.0 (`License.txt` cạnh file này, giữ nguyên khi phân phối).
Cho phép dùng thương mại với điều kiện ghi công và chia sẻ lại model phái sinh cùng license.

Tạo lại file từ nguồn:

```bash
git clone --depth 1 https://github.com/nqwrc/3d-anatomy.git /tmp/3d-anatomy
npm run model:extract -- /tmp/3d-anatomy/public/models/cardiovascular.glb public/models/heart.glb 250000
npm run model:check
```

Thiếu trong bản xuất hiện tại: lá trước van hai lá, lá trước van ba lá, cơ nhú trước tâm thất trái.

Pipeline:

```bash
# 1. Xuất .glb từ Blender vào public/models/raw/heart.glb
# 2. Nén
npm run model:optimize
# 3. So khớp tên mesh với nội dung
npm run model:check
```

Khi chưa có `heart.glb`, app tự dùng model sơ đồ hóa (`src/scene/placeholderHeart.ts`).
