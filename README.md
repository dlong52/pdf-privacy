# Trang chính sách quyền riêng tư — PDF All-in-One: Ký & Chỉnh Sửa

Trang tĩnh **một file duy nhất** — `index.html` tự chứa toàn bộ CSS, không JavaScript, không font/CDN
bên ngoài, không analytics.

```
site/
├── index.html          # nội dung chính sách + CSS (self-contained, mobile + dark mode + print)
├── scripts/check.mjs   # kiểm tra cấu trúc + nội dung trước khi deploy
└── README.md           # file này
```

## Kiểm tra trước khi deploy

```bash
node site/scripts/check.mjs
```

Script kiểm tra: thẻ cân bằng, id duy nhất, mọi anchor có đích, không có `<script>`, không tải tài nguyên
bên ngoài, các nội dung bắt buộc (tên app, email, ngày cập nhật, luật viện dẫn) và **danh sách câu tuyệt đối
bị cấm** (`không rời khỏi thiết bị`, `chỉ nằm trên thiết bị`, `vĩnh viễn`, `không bao giờ ghi`) để lỗi
claim không quay lại.

## Đăng lên GitHub Pages (URL dùng cho Google Play Console)

URL: `https://dlong52.github.io/pdf-privacy/`

```bash
# 1. Đăng nhập (một lần)
gh auth login

# 2. Tạo repo công khai và đẩy nội dung thư mục site/ lên nhánh main của repo đó
gh repo create pdf-privacy --public --description "Privacy policy - PDF All-in-One"
cd site
git init -b main
git add .
git commit -m "docs: publish privacy policy"
git remote add origin https://github.com/dlong52/pdf-privacy.git
git push -u origin main
cd ..

# 3. Bật GitHub Pages (nhánh main, thư mục gốc)
gh api -X POST repos/dlong52/pdf-privacy/pages -f source[branch]=main -f source[path]=/
```

Kiểm tra `https://dlong52.github.io/pdf-privacy/` trả về trang chính sách qua HTTPS, sau đó dán URL này vào
Google Play Console → *App content → Privacy policy*.

> Dùng hosting khác (Netlify Drop, Cloudflare Pages…): chỉ cần upload nội dung thư mục `site/`,
> không có bước build.

## Cập nhật nội dung

1. Sửa `site/index.html` (mục cần đổi + `Ngày cập nhật` ở đầu trang và ở footer).
2. Chạy `node site/scripts/check.mjs`.
3. Commit + push lại nhánh `main` của repo `pdf-privacy` — GitHub Pages tự deploy trong ~1 phút.
4. Nếu URL hoặc nội dung quan trọng thay đổi: cập nhật lại `rel="canonical"` trong `index.html`
   và URL trong Google Play Console.

## Nguyên tắc nội dung (bắt buộc)

- Không thêm tuyên bố chưa kiểm chứng: không "dữ liệu không bao giờ rời thiết bị", không "xoá vĩnh viễn",
  không "mã hoá khi lưu trữ", không "không bao giờ ghi log".
- Nêu rõ các trường hợp dữ liệu rời thiết bị: người dùng chủ động chia sẻ/lưu Drive/OneDrive, và **Auto Backup**
  của hệ điều hành.
- Mọi thay đổi hành vi dữ liệu của app (thêm SDK, analytics, crash reporting, thanh toán, backend) phải cập nhật
  trang này **trước** khi phát hành bản tương ứng.
- Trang không được nhúng script, pixel, font ngoài hoặc form gửi dữ liệu.

## Việc cần làm trước khi nộp Google Play (quan trọng)

- [ ] Kiểm lại manifest/quyền của **bản release thật**: `SYSTEM_ALERT_WINDOW` hiện được khai báo trong
      **main manifest** (`android/app/src/main/AndroidManifest.xml`), nguồn gốc từ thư viện `expo-dev-client`
      (dependency runtime) — cần **loại bỏ khỏi bản release**; nếu vẫn còn trong bản phát hành thì giữ dòng
      disclosure tương ứng ở mục 4.
- [ ] Kiểm lại `allowBackup` và mô tả Auto Backup khớp hành vi bản release.
- [ ] Kiểm lại camera/photo/OAuth/SecureStore đã thực sự có trong build release trước khi giữ các câu mô tả.
- [ ] Đối chiếu nội dung với bảng *Data safety* trong Play Console (không mâu thuẫn).
