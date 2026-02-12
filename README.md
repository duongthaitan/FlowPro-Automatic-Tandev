Dưới đây là file `README.md` được viết chuẩn theo phong cách template bạn yêu cầu, cập nhật thông tin chính xác cho phiên bản **Tandev Ultimate Suite V5** (gộp 2 tính năng Flow Auto & Downloader).

Bạn hãy tạo file tên là `README.md` và dán nội dung này vào nhé:

```markdown
<div align="center">

  <img src="icon128.png" alt="logo" width="100" height="100" />

# Tandev Ultimate Suite
**Giải pháp All-in-One: Tự động hóa & Tải xuống Video**

  <p>
    <img src="https://img.shields.io/badge/VERSION-5.0.0-87DF2C?style=for-the-badge&logo=rocket&color=87DF2C&labelColor=black" alt="Version">
    <img src="https://img.shields.io/badge/PLATFORM-CHROME-4285F4?style=for-the-badge&logo=google-chrome" alt="Platform">
    <img src="https://img.shields.io/badge/UI-DARK%20MODE-060D10?style=for-the-badge" alt="UI">
  </p>
  
  <p>
    <b>Bộ công cụ quyền năng tích hợp 2-trong-1: Flow Automation & Smart Downloader.</b>
  </p>
</div>

---

## 📖 Giới thiệu

**Tandev Ultimate Suite** là bản nâng cấp toàn diện, gộp hai công cụ mạnh mẽ nhất của Tandev.foto vào một giao diện duy nhất. Giờ đây bạn không cần cài nhiều tiện ích lẻ tẻ.
1.  **Flow Auto:** Tự động upload ảnh, nhập prompt và tạo video hàng loạt.
2.  **Downloader:** Tự động quét, cuộn trang và tải xuống video thông minh.

## ✨ Tính năng nổi bật (Version 5.0)

### 🎨 Giao diện & Trải nghiệm
* **Tabbed Interface:** Chuyển đổi mượt mà giữa 2 chế độ làm việc.
* **Sound Alert (🎵 Mới):** Phát âm thanh "Ting Ting" vui tai khi hoàn thành công việc, giúp bạn rảnh tay làm việc khác.
* **Ultimate UI:** Giao diện Dark Mode (`#060D10`) kết hợp màu xanh Neon (`#87DF2C`) hiện đại, dịu mắt.

### 🪄 Tab 1: Flow Auto (Tự động hóa)
* **Stability Mode V21:** Cơ chế "Kiên nhẫn" - Tự động thử lại 3 lần nếu mạng lag hoặc nút bấm chưa hiện (Chống trượt job).
* **Smart Wait:** Chỉ nhập Prompt khi ô nhập liệu thực sự sẵn sàng.
* **Batch Processing:** Xử lý hàng trăm video liên tục không nghỉ.

### 📥 Tab 2: Downloader (Tải xuống)
* **Deep Scan:** Quét sâu vào hệ thống (Shadow DOM, Blob) để bắt các video bị ẩn mà tool thường không thấy.
* **Smart Scroll & Auto-Stop:** Tự động tìm khung cuộn chính xác, cuộn xuống cuối và **tự dừng** khi không còn nội dung mới (sau 5s).
* **Dynamic Renaming:** Đặt tên file linh hoạt với `{index}`.
* **Folder Management:** Nút cài đặt nhanh (⚙️) giúp quản lý thư mục lưu trữ dễ dàng.

---

## 🛠 Cài đặt

1.  **Tải Code:** Tải trọn bộ mã nguồn `Tandev_Ultimate_Suite` về máy và giải nén.
2.  **Mở Chrome:** Truy cập đường dẫn `chrome://extensions/`.
3.  **Bật Developer Mode:** Gạt nút ở góc trên bên phải sang màu xanh.
4.  **Load Tool:** Bấm nút **"Load unpacked"** -> Chọn thư mục vừa giải nén.

---

## 🎮 Hướng dẫn sử dụng

### 📍 Tab 1: Flow Auto
Dùng để tạo video hàng loạt từ ảnh và prompt.
1.  **Chọn Ảnh:** Bấm chọn folder chứa ảnh (1.png, 2.png...).
2.  **Nhập Prompt:** Dán danh sách prompt (mỗi dòng 1 prompt).
3.  **Bắt đầu:** Bấm **"CHẠY FLOW"**.
    * *Lưu ý:* Nút **Dừng (Stop)** chỉ hiện ra khi tool đang chạy.

### 📍 Tab 2: Downloader
Dùng để tải video từ các trang (Veo, TikTok, Reels...).
1.  **Lưu vào thư mục:** Nhập tên folder (VD: `Kho_Video_Moi`).
2.  **Tên file mẫu:** Nhập cấu trúc tên (VD: `video_{index}`).
3.  **Bắt đầu:** Bấm **"QUÉT & TẢI NGAY"**.
    * Tool sẽ tự cuộn. Khi xong sẽ phát tiếng "Pop" và tự tải về.

---

## ⚙️ Cấu trúc dự án

```text
Tandev_Ultimate_Suite/
├── manifest.json       # Cấu hình lõi (Quyền hạn, Background)
├── popup.html          # Giao diện 2 Tab (Flow & Down)
├── style.css           # Giao diện Dark Mode #060D10
├── tabs.js             # Script chuyển đổi Tab
├── flow_logic.js       # Logic xử lý Flow Auto
├── flow_content.js     # Script chạy ngầm (Inject) cho Flow
├── down_logic.js       # Logic xử lý Downloader & Deep Scan
├── background.js       # Service Worker quản lý tải xuống
└── icons/              # Bộ icon nhận diện

```

## ⚠️ Khắc phục lỗi thường gặp

### 🔴 Lỗi: Tool Flow Auto bỏ qua một số ảnh?

Do mạng quá lag khiến web không hiện kịp nút bấm.

* **Giải pháp:** Phiên bản V5 đã có cơ chế thử lại 3 lần. Nếu vẫn bị, hãy F5 lại trang web trước khi chạy.

### 🔴 Lỗi: Downloader báo "Detected: 0"?

Trang web sử dụng công nghệ giấu video (Shadow DOM).

* **Giải pháp:** Hãy cuộn nhẹ trang web bằng tay 1 chút để video load ra, sau đó bấm nút Quét lại. Tool V5 đã tích hợp Deep Scan để xử lý việc này tốt hơn.

### 🔴 Lỗi: Chrome hỏi nơi lưu liên tục?

* Vào `chrome://settings/downloads`.
* Tắt dòng **"Ask where to save each file..."** (Hỏi vị trí lưu từng tệp).

---

<div align="center">
<i>Developed by <b>Tandev.foto Studio</b></i>




<i>© 2026 All Rights Reserved.</i>
</div>

```

```