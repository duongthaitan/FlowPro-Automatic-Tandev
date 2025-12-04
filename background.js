// =========================================================
// BACKGROUND WORKER | Tandev.foto
// =========================================================

let downloadQueue = [];
let activeDownloads = 0;
let MAX_CONCURRENT = 3;
let isBatchRunning = false; // Biến cờ để biết đang trong đợt tải

// Cấu hình mặc định
let currentConfig = {
  folder: "Videos",
  pattern: "video_{index}",
  saveAs: false,
  mode: "safe",
};

// =========================================================
// 1. SOUND & NOTIFICATION UTILS (ĐÃ NÂNG CẤP)
// =========================================================

function showFinishedNotification(totalFiles) {
  // 1. Hiện thông báo Visual
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon128.png",
    title: "Flow Downloader",
    message: `✅ Đã tải xong toàn bộ ${totalFiles} video!`,
    priority: 2,
  });

  // 2. Phát âm thanh (Inject vào tab đang mở để phát)
  playLoudSuccessSound();
}

async function playLoudSuccessSound() {
  // Tìm tab đang active để mượn nó phát tiếng
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    if (tab) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // TẠO ÂM THANH LỚN VÀ LẶP LẠI
          try {
            const AudioContext =
              window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const now = ctx.currentTime;

            // Hàm tạo 1 tiếng bíp
            const playBeep = (startTime) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();

              osc.connect(gain);
              gain.connect(ctx.destination);

              // Cấu hình âm thanh: Sine wave (sóng hình sin) nghe giống tiếng chuông
              osc.type = "sine";
              osc.frequency.value = 1200; // Tần số cao (1200Hz) nghe cho rõ

              // VOLUME MAX (1.0)
              gain.gain.setValueAtTime(1.0, startTime);
              // Hiệu ứng fade out nhanh để tạo tiếng "Ting" gọn gàng
              gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

              osc.start(startTime);
              osc.stop(startTime + 0.25);
            };

            // LẶP LẠI 5 LẦN
            for (let i = 0; i < 5; i++) {
              // Mỗi tiếng cách nhau 0.3 giây
              playBeep(now + i * 0.3);
            }
          } catch (e) {
            console.error("Audio error:", e);
          }
        },
      });
    }
  } catch (e) {
    console.error("Không thể phát âm thanh:", e);
  }
}

// =========================================================
// 2. FILE NAMING LOGIC
// =========================================================

function generateFilename(pattern, index, extension, dateObj) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;

  const hh = String(dateObj.getHours()).padStart(2, "0");
  const min = String(dateObj.getMinutes()).padStart(2, "0");
  const timeStr = `${hh}h${min}`;

  let finalName = pattern || "video_{index}";
  finalName = finalName.replace(/{index}/g, index);
  finalName = finalName.replace(/{date}/g, dateStr);
  finalName = finalName.replace(/{time}/g, timeStr);

  finalName = finalName.replace(/[<>:"/\\|?*]+/g, "_");
  return `${finalName}.${extension}`;
}

// =========================================================
// 3. MAIN LOGIC
// =========================================================

let totalFilesInitial = 0;
let downloadedHistory = new Set(); // Bộ nhớ chống trùng lặp

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "save_config") {
    currentConfig = request.config;
  }

  if (request.action === "finished_scan_data") {
    const links = request.links;
    if (!links || links.length === 0) return;

    // Reset trạng thái
    isBatchRunning = true;
    totalFilesInitial = 0;

    if (currentConfig.mode === "fast") MAX_CONCURRENT = 5;
    else MAX_CONCURRENT = 3;

    const now = new Date();

    links.forEach((url, index) => {
      // -- CHỐNG TRÙNG LẶP --
      if (downloadedHistory.has(url)) return;
      downloadedHistory.add(url);
      // ---------------------

      const fileNumber = index + 1;
      let extension = "mp4";
      if (url.includes(".gif")) extension = "gif";
      else if (url.includes(".webp")) extension = "webp";

      const fileNameOnly = generateFilename(
        currentConfig.pattern,
        fileNumber,
        extension,
        now
      );
      const fullPath = `${currentConfig.folder}/${fileNameOnly}`;

      // Check trùng trong queue hiện tại (đề phòng)
      const exists = downloadQueue.some((item) => item.url === url);
      if (!exists) {
        downloadQueue.push({
          url: url,
          filename: fullPath,
          saveAs: currentConfig.saveAs,
        });
        totalFilesInitial++;
      }
    });

    updateBadge();
    processQueue();
  }
});

function updateBadge() {
  const count = downloadQueue.length + activeDownloads;
  if (count > 0) {
    chrome.action.setBadgeText({ text: String(count) });
    chrome.action.setBadgeBackgroundColor({ color: "#00b894" });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

function processQueue() {
  if (activeDownloads === 0 && downloadQueue.length === 0) {
    if (isBatchRunning) {
      isBatchRunning = false;
      updateBadge();
      // Chỉ thông báo nếu thực sự có tải file mới
      if (totalFilesInitial > 0) {
        showFinishedNotification(totalFilesInitial);
      }
    }
    return;
  }

  if (activeDownloads >= MAX_CONCURRENT || downloadQueue.length === 0) {
    return;
  }

  const item = downloadQueue.shift();
  activeDownloads++;
  updateBadge();

  chrome.downloads.download(
    {
      url: item.url,
      filename: item.filename,
      conflictAction: "uniquify",
      saveAs: item.saveAs,
    },
    (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error(`Lỗi tải: ${item.filename}`, chrome.runtime.lastError);
        activeDownloads--;
        processQueue();
      }
    }
  );

  processQueue();
}

chrome.downloads.onChanged.addListener((delta) => {
  if (delta.state) {
    if (
      delta.state.current === "complete" ||
      delta.state.current === "interrupted"
    ) {
      activeDownloads--;
      if (activeDownloads < 0) activeDownloads = 0;
      updateBadge();
      processQueue();
    }
  }
});
