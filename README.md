<div align="center">

  <img src="icon128.png" alt="logo" width="100" height="100" />

# Flow Downloader Auto
**Phiên bản đặc biệt dành cho Tandev.foto Studio**

  <p>
    <img src="https://img.shields.io/badge/VERSION-4.5-16C3DE?style=for-the-badge&logo=rocket&color=16C3DE" alt="Version">
    <img src="https://img.shields.io/badge/PLATFORM-CHROME-4285F4?style=for-the-badge&logo=google-chrome" alt="Platform">
    <img src="https://img.shields.io/badge/UI-GLASSMORPHISM-FF69B4?style=for-the-badge" alt="UI">
  </p>
  
  <p>
    <b>Tool tải video tự động hàng loạt - Giao diện thông minh - Hàng đợi an toàn.</b>
  </p>
</div>

---

## 📖 Giới thiệu

**Flow Downloader** giải quyết nỗi đau đầu của việc tải hàng trăm video từ các trang web dạng cuộn vô tận (như Veo, Facebook Reels, TikTok...). Thay vì phải bấm tải từng cái, công cụ này sẽ tự động làm tất cả: Cuộn trang, quét link, đổi tên file và tải xuống theo hàng đợi thông minh.

## ✨ Tính năng nổi bật (Version 4.5)

* **🚀 1-Click Smart Action:** Cơ chế "Bấm là chạy". Nút bấm tự động chuyển trạng thái (Bắt đầu / Dừng) giúp thao tác cực nhanh.
* **🛡️ Smart Queue (Hàng đợi thông minh):**
    * **Chế độ Nhanh (Fast):** Tải song song 10 video (Dành cho số lượng ít).
    * **Chế độ An toàn (Safe):** Tải lần lượt 3 video (Dành cho >50 video) để tránh treo trình duyệt.
* **📝 Dynamic Renaming (Đặt tên file linh hoạt):**
    * Hỗ trợ các thẻ tự động: `{index}` (số thứ tự), `{date}` (ngày), `{time}` (giờ).
    * Có chế độ **Live Preview** (Xem trước tên file ngay khi gõ).
* **📂 Smart Organization:** Tự động tạo thư mục riêng trong Downloads để gom nhóm video.
* **🎨 Ultimate UI:** Giao diện **Glassmorphism** màu xanh Cyan (`#16C3DE`) hiện đại, có hiệu ứng chuyển động mượt mà.
* **🤖 Auto-Pilot Scroll:** Tự động tìm thanh cuộn và lướt xuống cuối trang để quét sạch video.

---

## 🛠 Cài đặt

1.  **Tải Code:** Tải trọn bộ mã nguồn về máy và giải nén.
2.  **Mở Chrome:** Truy cập đường dẫn `chrome://extensions/`.
3.  **Bật Developer Mode:** Gạt nút ở góc trên bên phải sang màu xanh.
4.  **Load Tool:** Bấm nút **"Load unpacked"** -> Chọn thư mục vừa giải nén.

---

## 🎮 Hướng dẫn sử dụng

### Bước 1: Mở Tool
Truy cập trang web chứa video, bấm vào biểu tượng **Flow Downloader**.

### Bước 2: Cấu hình (Rất đơn giản)

1.  **TÊN DỰ ÁN (FOLDER):** Nhập tên thư mục muốn lưu.
    * *Ví dụ:* `Du_Lich_Da_Lat` (Nếu để trống, tool tự đặt mặc định là `Veo_Videos`).
2.  **CẤU TRÚC TÊN FILE:** Nhập mẫu tên bạn muốn.
    * *Ví dụ:* `Video_Cua_Tan_{index}` -> `Video_Cua_Tan_1.mp4`
    * *Hỗ trợ:* `{index}`, `{date}`, `{time}`.
3.  **CHẾ ĐỘ TẢI:**
    * Chọn **⚡ Nhanh** nếu tải ít video.
    * Chọn **🛡️ Ổn định** nếu tải kho video lớn (trên 50 cái).

### Bước 3: Bấm nút "🚀 BẮT ĐẦU"
* Giữ nguyên cửa sổ Popup mở.
* Tool sẽ tự động cuộn xuống cuối trang và bắt đầu tải.
* Theo dõi tiến độ qua dòng trạng thái: *"Đang tải 5/30 file..."*.

---

## ⚙️ Cấu trúc dự án

```text
Flow-Downloader/
├── manifest.json   # Cấu hình lõi (v4.5)
├── popup.html      # Giao diện người dùng (Clean UI)
├── style.css       # Thiết kế Glassmorphism & Cyan Theme
├── popup.js        # Logic xử lý chính (UI, Preview, Events)
├── background.js   # Xử lý Hàng đợi & Đổi tên file
└── icons/          # Bộ icon thương hiệu
⚠️ Khắc phục lỗi thường gặp
🔴 Lỗi: Chrome cứ hỏi "Lưu vào đâu?" liên tục?
Đây là do cài đặt bảo mật của Chrome chặn quyền tự động lưu của Extension.

Cách sửa:

Mở tab mới, nhập: chrome://settings/downloads

Tìm dòng: "Ask where to save each file before downloading" (Hỏi vị trí lưu từng tệp...).

Gạt TẮT nó đi (Màu xám).

Quay lại Tool, tắt nút gạt "Hỏi vị trí lưu" và thử lại.

🔴 Lỗi: Không tìm thấy video nào?
Hãy F5 (Tải lại) trang web.

Đợi trang web load xong danh sách video đầu tiên rồi hãy bật Tool.

<div align="center"> <i>Developed by <b>Tandev.foto Studio</b></i>


<i>© 2025 All Rights Reserved.</i> </div>