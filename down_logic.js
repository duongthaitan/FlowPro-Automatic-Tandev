// =========================================================
// DOWNLOADER LOGIC | Tandev Ultimate V6 (Fix Scan)
// =========================================================

// --- Elements ---
const down_filePatternInput = document.getElementById('down_filePattern');
const down_filenamePreview = document.getElementById('down_filenamePreview');
const down_folderInput = document.getElementById('down_folderName');
const down_btnStart = document.getElementById('down_btnStart');
const down_btnStop = document.getElementById('down_btnStop');
const down_btnKill = document.getElementById('down_btnKill');
const down_statusText = document.getElementById('down_statusText');
const down_statusBox = document.getElementById('down_statusBox');
const down_runGroup = document.getElementById('down_runningGroup');

// --- Cài đặt (Bánh răng) ---
const btnSettings = document.getElementById('down_openSettings');
if (btnSettings) {
    btnSettings.addEventListener('click', () => {
        chrome.tabs.create({ url: 'chrome://settings/downloads' });
    });
}

// --- Preview Tên file ---
function down_updatePreview() {
    let pattern = down_filePatternInput.value.trim() || "video_{index}";
    down_filenamePreview.innerText = pattern.replace(/{index}/g, "1") + ".mp4";
}
if (down_filePatternInput) {
    down_filePatternInput.addEventListener('input', down_updatePreview);
    down_updatePreview();
}

function down_toggleRunning(isRunning) {
    if (isRunning) {
        down_btnStart.style.display = 'none';
        down_runGroup.style.display = 'flex';
        down_statusText.innerText = "Đang quét & cuộn...";
        down_statusText.style.color = "#87DF2C"; 
        down_folderInput.disabled = true; 
        down_filePatternInput.disabled = true;
    } else {
        down_btnStart.style.display = 'flex';
        down_runGroup.style.display = 'none';
        down_folderInput.disabled = false; 
        down_filePatternInput.disabled = false;
    }
}

// --- NÚT START ---
down_btnStart.addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check URL
    if (!tab.url.startsWith('http')) {
        down_statusText.innerText = "⚠️ Trang không hợp lệ!";
        down_statusText.style.color = "#ef4444";
        return;
    }

    const folderRaw = down_folderInput.value.trim() || "Tandev_Videos";
    const patternRaw = down_filePatternInput.value.trim() || "video_{index}";

    down_toggleRunning(true);

    // 1. Gửi cấu hình xuống Background
    chrome.runtime.sendMessage({
        action: "save_config",
        config: { folder: folderRaw.replace(/[<>:"/\\|?*]+/g, '_'), pattern: patternRaw }
    });

    // 2. Lắng nghe tin nhắn cập nhật số lượng
    chrome.runtime.onMessage.addListener(down_handleMessage);

    // 3. Inject Script Quét (Smart Scroll + Deep Scan)
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: down_startSmartScan
        });
        console.log("✅ Đã inject script quét.");
    } catch (e) {
        console.error("❌ Lỗi inject:", e);
        down_statusText.innerText = "Lỗi khởi động (F12)";
        down_toggleRunning(false);
    }
});

// --- NÚT STOP ---
down_btnStop.addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if(tab) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => { window.isScanning = false; }
        });
    }
    down_statusText.innerText = "Đang dừng...";
});

// --- NÚT KILL ---
down_btnKill.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "kill_process" });
    down_toggleRunning(false);
    down_statusText.innerText = "Đã hủy.";
    down_statusText.style.color = "#ef4444";
});

// --- XỬ LÝ TIN NHẮN TỪ CONTENT SCRIPT ---
function down_handleMessage(request) {
    if (request.action === "update_count") {
        const countEl = document.getElementById('down_countDisplay');
        if (countEl) countEl.innerText = request.count;
    }
    if (request.action === "scan_complete_notification") {
        down_statusText.innerText = "Đã quét xong! Bắt đầu tải...";
        down_statusText.style.color = "#FFFFFF";
        down_toggleRunning(false);
        chrome.runtime.onMessage.removeListener(down_handleMessage);

        // Phát âm thanh
        const audio = new Audio('https://actions.google.com/sounds/v1/cartoon/pop.ogg');
        audio.volume = 0.5;
        audio.play().catch(() => {}); 
    }
}

// =========================================================
// [INJECTED FUNCTION] SMART SCANNER & DEEP FINDER
// =========================================================
async function down_startSmartScan() {
    console.log("🚀 Tandev Smart Scanner Started!");
    
    window.capturedVideos = new Set();
    window.isScanning = true;
    
    // 1. Hàm tìm khung cuộn (Smart Scroll)
    const findScrollableElement = () => {
        if (document.scrollingElement && document.scrollingElement.scrollHeight > window.innerHeight) {
            return document.scrollingElement;
        }
        const elements = document.querySelectorAll('div, main, section, ul');
        let maxScrollHeight = 0;
        let bestElement = null;
        elements.forEach(el => {
            const style = window.getComputedStyle(el);
            if ((style.overflowY === 'scroll' || style.overflowY === 'auto') && el.scrollHeight > el.clientHeight) {
                if (el.scrollHeight > maxScrollHeight) {
                    maxScrollHeight = el.scrollHeight;
                    bestElement = el;
                }
            }
        });
        return bestElement || document.body;
    };

    // 2. [FIX] Hàm thu thập Link - Deep Scan
    const collectLinks = () => {
        const videos = document.querySelectorAll('video');
        let foundNew = false;

        videos.forEach(video => {
            // Ưu tiên lấy currentSrc (chuẩn nhất cho TikTok/Veo)
            let src = video.currentSrc || video.src;
            
            // Nếu không có, tìm trong thẻ source con
            if (!src && video.querySelector('source')) {
                src = video.querySelector('source').src;
            }

            // Kiểm tra link hợp lệ (http hoặc blob)
            if (src && (src.startsWith('http') || src.startsWith('blob:'))) {
                 // Lọc bỏ link rác ngắn quá hoặc undefined
                 if (src !== window.location.href && src.length > 10) {
                     if (!window.capturedVideos.has(src)) {
                         window.capturedVideos.add(src);
                         foundNew = true;
                         // Hiệu ứng viền xanh để biết video nào đã bắt được (Optional)
                         video.style.border = "2px solid #87DF2C"; 
                     }
                 }
            }
        });

        if (foundNew) {
            try { 
                chrome.runtime.sendMessage({ action: "update_count", count: window.capturedVideos.size }); 
            } catch (e) {}
        }
    };

    // Biến Auto-Stop
    let lastScrollHeight = 0;
    let noChangeCount = 0;
    const SCROLL_INTERVAL = 800; 
    const MAX_WAIT_TIME = 5000;  

    // 3. Vòng lặp chính
    const scroller = setInterval(() => {
        if (!window.isScanning) { 
            clearInterval(scroller);
            finishScan();
            return; 
        }
        
        collectLinks(); // Quét liên tục
        
        const targetEl = findScrollableElement();
        if (targetEl) {
            const currentScrollHeight = targetEl.scrollHeight;

            // Cuộn xuống đáy
            if (targetEl === document.body || targetEl === document.scrollingElement) {
                window.scrollTo(0, document.body.scrollHeight);
            } else {
                targetEl.scrollTop = targetEl.scrollHeight;
            }
            
            // Logic Auto Stop
            if (currentScrollHeight === lastScrollHeight) {
                noChangeCount += SCROLL_INTERVAL;
            } else {
                noChangeCount = 0;
                lastScrollHeight = currentScrollHeight;
            }

            if (noChangeCount >= MAX_WAIT_TIME) {
                console.log("🛑 Hết trang. Dừng.");
                window.isScanning = false; 
            }
        }
        
    }, SCROLL_INTERVAL);

    // 4. Kết thúc
    const finishScan = async () => {
        console.log(`🛑 Done. Total: ${window.capturedVideos.size}`);
        await new Promise(r => setTimeout(r, 1000)); 
        collectLinks(); // Quét lần cuối
        
        const finalLinks = Array.from(window.capturedVideos);
        
        // Gửi về Background để tải
        chrome.runtime.sendMessage({ action: "finished_scan_data", links: finalLinks });
        try { chrome.runtime.sendMessage({ action: "scan_complete_notification" }); } catch(e) {}
    };
}