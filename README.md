<div align="center">

  <img src="icon128.png" alt="logo" width="100" height="100" />

# Flow Downloader Auto

**Tandev.foto**

  <p>
    <a href="#">
      <img src="https://img.shields.io/badge/Version-3.5-blue?style=for-the-badge&color=16C3DE" alt="Version">
    </a>
    <a href="#">
      <img src="https://img.shields.io/badge/Platform-Chrome_Extension-orange?style=for-the-badge&logo=google-chrome" alt="Platform">
    </a>
    <a href="#">
      <img src="https://img.shields.io/badge/License-Private-red?style=for-the-badge" alt="License">
    </a>
  </p>
  
  <p>
    <b>Tool tải video tự động hàng loạt - Nhanh chóng, Thông minh và Ổn định.</b>
  </p>
</div>

---

## 📖 Giới thiệu

**Flow Downloader** là một tiện ích mở rộng (Extension) dành cho trình duyệt Chrome, được phát triển bởi **Tandev.foto Studio**. Công cụ này giải quyết vấn đề tải hàng loạt video từ các nền tảng dạng cuộn vô tận (Infinite Scroll) như Veo, Facebook Reels, TikTok,...

Thay vì phải tải thủ công từng video, Flow Downloader sẽ tự động cuộn, thu thập link và tải xuống toàn bộ danh sách chỉ với **1 cú click chuột**.

## ✨ Tính năng nổi bật

- **🚀 Auto-Pilot Scroll:** Tự động tìm thanh cuộn (kể cả thanh cuộn ẩn) và lướt đến cuối trang.
- **📦 Bulk Download:** Tải xuống hàng trăm video cùng lúc mà không bị sót.
- **📂 Smart Organization:** Tự động tạo thư mục con trong Downloads để gom nhóm video (Ví dụ: `Downloads/Project_Veo/video1.mp4`).
- **🔢 Correct Ordering:** Thuật toán thông minh tự động đảo ngược danh sách, đảm bảo video cũ nhất (ở đáy trang) sẽ được đặt tên là `video1`, video mới nhất là `videoN`.
- **🎨 Clean UI/UX:** Giao diện **Glassmorphism** hiện đại, màu sắc trẻ trung (`#16C3DE`), tối ưu trải nghiệm người dùng.
- **⚡ Lightweight:** Code thuần Javascript, không sử dụng thư viện nặng, đảm bảo tốc độ xử lý cực nhanh.

## 🛠 Cài đặt

Vì đây là Extension dạng **Unpacked** (Chưa đóng gói lên Store), bạn hãy làm theo các bước sau:

1.  Tải hoặc Clone thư mục dự án này về máy.
2.  Mở trình duyệt **Google Chrome**.
3.  Truy cập địa chỉ: `chrome://extensions/`
4.  Bật chế độ **Developer mode** (Chế độ dành cho nhà phát triển) ở góc trên bên phải.
5.  Bấm nút **Load unpacked** (Tải tiện ích đã giải nén).
6.  Chọn thư mục chứa code của **Flow Downloader**.

## 🎮 Hướng dẫn sử dụng

1.  Truy cập trang web chứa video cần tải (Ví dụ: Trang quản lý video của Veo).
2.  Bấm vào biểu tượng **Flow Downloader** trên thanh công cụ.
3.  **Cấu hình:**
    - Nhập **Tên Dự Án** (Đây sẽ là tên thư mục chứa video).
    - _(Tùy chọn)_ Bật "Hỏi vị trí lưu" nếu muốn chọn nơi lưu thủ công cho từng file (Không khuyến khích nếu tải nhiều).
4.  Bấm nút **`🚀 START AUTO DOWNLOAD`**.
5.  **QUAN TRỌNG:** Giữ nguyên cửa sổ Popup hoặc Tab hiện tại. Tool sẽ tự động cuộn trang.
6.  Khi cuộn đến đáy, Tool sẽ tự động dừng và bắt đầu tải xuống.

## ⚙️ Cấu trúc dự án

```text
Flow-Downloader/
├── manifest.json   # Cấu hình lõi của Extension
├── popup.html      # Giao diện người dùng (HTML5)
├── style.css       # Thiết kế giao diện (CSS3 Modern)
├── popup.js        # Logic xử lý chính (Auto scroll & Download)
├── background.js   # Service Worker chạy nền
└── icons/          # Bộ icon thương hiệu
    ├── icon16.png
    ├── icon32.png
    └── icon128.png
```
