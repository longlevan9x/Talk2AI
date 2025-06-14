

#### [👉 Hướng dẫn cài đặt và Sử dụng Extension](#-talk2ai--hướng-dẫn-cài-đặt-và-sử-dụng-extension)

# 🚀 Hướng Dẫn Cài Đặt và Chạy Source Code Extension

## 1. Cài Node.js và npm

Để bắt đầu, bạn cần cài đặt:

- **Node.js** (đề xuất phiên bản >= 18.x)
- **npm** (được cài kèm với Node.js)

👉 Tải về tại: https://nodejs.org/

Sau khi cài xong, kiểm tra bằng cách chạy:

```bash
node -v
npm -v
````

---

## 2. Cài Dependencies

Sau khi clone hoặc tải source code về, chạy lệnh sau để cài đặt các dependencies:

```bash
npm install
```

---

## 3. Chạy Ứng Dụng Ở Chế Độ Phát Triển (Dev)

Sử dụng lệnh sau để chạy ở chế độ phát triển:

```bash
npm run dev
```

* Lệnh này sẽ build mã nguồn và theo dõi thay đổi tự động.
* File kết quả sẽ được xuất ra thư mục `dist/`.

---

## 4. Build Ứng Dụng Cho Production

Khi bạn muốn build phiên bản production:

```bash
npm run build
```

* Lệnh này tạo bản build tối ưu và cũng xuất vào thư mục `dist/`.

---

## 5. Load Extension Từ Thư Mục `dist/` Để Test

Sau khi đã build (dev hoặc prod), bạn có thể test extension như sau:

1. Mở Chrome.
2. Truy cập `chrome://extensions/`
3. Bật **Developer mode** (góc trên bên phải).
4. Nhấn **"Load unpacked"**.
5. Chọn thư mục `dist/`.

> ⚠️ Sau mỗi lần build lại, hãy **Reload** extension để thấy thay đổi mới nhất.

---

## ✅ Ghi chú

* Mọi thay đổi code đều cần `npm run dev` (dev) hoặc `npm run build` (prod) để cập nhật thư mục `dist/`.
* Nếu extension không hiển thị thay đổi, hãy chắc chắn bạn đã reload trong `chrome://extensions/`.

#

# 🧠 Talk2AI – Hướng dẫn cài đặt và Sử dụng Extension

**Talk2AI** là một tiện ích Chrome giúp bạn gửi nội dung từ bất kỳ trang web nào đến các nền tảng AI như ChatGPT, Claude, Gemini... chỉ với một cú nhấp chuột.

---

## 🚀 Cài đặt thủ công (Developer Mode)

Làm theo các bước sau để cài đặt tiện ích ở chế độ dành cho nhà phát triển:
### 1. Tải file cài đặt tại link: https://github.com/longlevan9x/Talk2AI/tags

### 2. Mở chế độ Developer trong Chrome
- Mở trình duyệt và truy cập: `chrome://extensions/`
- Bật công tắc **"Chế độ dành cho nhà phát triển"** (Developer Mode) ở góc phải trên.

### 3. Tải tiện ích đã giải nén
- Nhấn nút **"Tải tiện ích đã giải nén"** (*Load unpacked*).
- Chọn thư mục chứa mã nguồn Talk2AI (thư mục bạn vừa giải nén từ file ZIP).

### 4. Bắt đầu sử dụng
- Extension sẽ xuất hiện trên thanh tiện ích của Chrome.
- Bạn có thể nhấn vào icon Talk2AI và bắt đầu sử dụng với bất kỳ trang web nào.

---

## ⚠️ Xử lý lỗi tạm thời

Trong quá trình sử dụng, nếu gặp lỗi:

1. Mở lại trang `chrome://extensions/`
2. Tìm đến Talk2AI → nhấn **"Clear errors"** (Xóa lỗi)
3. Tải lại trang web và thử sử dụng lại extension

---

## 🛠 Báo cáo lỗi

Nếu lỗi vẫn tiếp tục xảy ra:

- Gửi báo cáo về cho nhà phát triển.
- Kèm theo mô tả lỗi, ảnh chụp màn hình hoặc các bước để tái hiện lỗi.

---

📫 **Liên hệ phát triển**: [email@example.com]
🌐 **Phiên bản**: 1.0.1  

---
