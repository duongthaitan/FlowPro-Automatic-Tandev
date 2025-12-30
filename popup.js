// =========================================================
// UI CONTROLLER | Tandev.foto
// =========================================================

// --- Elements ---
const helpBtn = document.getElementById('helpBtn');
const helpTooltip = document.getElementById('helpTooltip');
const filePatternInput = document.getElementById('filePattern');
const filenamePreview = document.getElementById('filenamePreview');
const folderInput = document.getElementById('folderName');
const btnStart = document.getElementById('btnStart');
const btnStop = document.getElementById('btnStop');
const btnKill = document.getElementById('btnKill');
const statusText = document.getElementById('statusText');
const statusBox = document.getElementById('statusBox');
const runGroup = document.getElementById('runningGroup');

// --- 1. Interaction Logic ---
if (helpBtn && helpTooltip) {
    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        helpTooltip.classList.toggle('show');
        helpBtn.classList.toggle('active');
    });
    document.addEventListener('click', (e) => {
        if (!helpBtn.contains(e.target) && !helpTooltip.contains(e.target)) {
            helpTooltip.classList.remove('show');
            helpBtn.classList.remove('active');
        }
    });
}

document.getElementById('btnSettings').addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://settings/downloads' });
});

// --- 2. Live Preview ---
function updatePreview() {
    let pattern = filePatternInput.value.trim() || "video_{index}";
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = "14h30";

    let preview = pattern
        .replace(/{index}/g, "1")
        .replace(/{date}/g, dateStr)
        .replace(/{time}/g, timeStr);
    
    filenamePreview.innerText = preview + ".mp4";
}
if (filePatternInput) {
    filePatternInput.addEventListener('input', updatePreview);
    updatePreview();
}

// --- 3. Button UI Swapper ---
function toggleRunningState(isRunning) {
    if (isRunning) {
        btnStart.style.display = 'none';
        runGroup.style.display = 'flex';
        statusBox.classList.add('running');
        statusText.innerText = "Đang tự động cuộn & quét...";
        statusText.style.color = "#6FF2FF";
        folderInput.disabled = true;
        filePatternInput.disabled = true;
    } else {
        btnStart.style.display = 'flex';
        runGroup.style.display = 'none';
        statusBox.classList.remove('running');
        folderInput.disabled = false;
        filePatternInput.disabled = false;
    }
}

// =========================================================
// CORE LOGIC
// =========================================================

// START SCAN
btnStart.addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Get Config
    const folderRaw = folderInput.value.trim() || "Flow_Videos";
    const folderName = folderRaw.replace(/[<>:"/\\|?*]+/g, '_');
    const patternRaw = filePatternInput.value.trim() || "video_{index}";

    // Update UI
    toggleRunningState(true);

    // Send Config to Background
    chrome.runtime.sendMessage({
        action: "save_config",
        config: { folder: folderName, pattern: patternRaw }
    });

    // Listener for live counts
    chrome.runtime.onMessage.addListener(handleMessage);

    // Inject Scanner
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: startUniversalScroll // Hàm này đã được phục hồi logic gốc bên dưới
    });
});

// STOP SCAN (Trigger download immediately)
btnStop.addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if(tab) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => { window.isScanning = false; }
        });
    }
    statusText.innerText = "Đang dừng và gửi dữ liệu...";
});

// KILL PROCESS
btnKill.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "kill_process" });
    toggleRunningState(false);
    statusText.innerText = "Đã hủy tiến trình.";
    statusText.style.color = "#ef4444";
});

function handleMessage(request) {
    if (request.action === "update_count") {
        document.getElementById('countDisplay').innerText = request.count;
    }
    if (request.action === "scan_complete_notification") {
        statusText.innerText = "Đã gửi lệnh tải xuống!";
        statusText.style.color = "#00b894";
        toggleRunningState(false);
        chrome.runtime.onMessage.removeListener(handleMessage);
    }
}

// =========================================================
// INJECTED SCRIPT (Content Script) - ĐÃ KHÔI PHỤC LOGIC GỐC
// =========================================================
async function startUniversalScroll() {
    window.capturedVideos = new Set();
    window.isScanning = true;
    
    // 1. Hàm thu thập Link (Giữ nguyên logic quét tất cả)
    const collectLinks = () => {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            let src = video.src;
            if (!src && video.querySelector('source')) {
                src = video.querySelector('source').src;
            }
            if (src && src.startsWith('http')) {
                window.capturedVideos.add(src);
            }
        });
        
        // Report back to Popup
        try { chrome.runtime.sendMessage({ action: "update_count", count: window.capturedVideos.size }); } catch (e) {}
    };

    // 2. Logic tìm thanh cuộn (ĐÃ KHÔI PHỤC TỪ CODE CŨ CỦA BẠN)
    // Logic này quét toàn bộ các div để tìm ra div nào đang giữ thanh cuộn
    const findScrollContainer = () => {
        // Ưu tiên 1: Nếu body cuộn được
        if (document.documentElement.scrollHeight > window.innerHeight) return { element: window, type: 'window' };
        
        // Ưu tiên 2: Tìm div cụ thể
        let allDivs = document.querySelectorAll('div');
        let maxScrollHeight = 0;
        let targetDiv = null;
        
        allDivs.forEach(div => {
            try {
                const style = window.getComputedStyle(div);
                // Chỉ lấy div có thuộc tính scroll
                if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
                    if (div.scrollHeight > div.clientHeight && div.scrollHeight > maxScrollHeight) {
                        maxScrollHeight = div.scrollHeight;
                        targetDiv = div;
                    }
                }
            } catch(e) {}
        });
        
        if (targetDiv) return { element: targetDiv, type: 'div' };
        return { element: window, type: 'window' };
    };

    const scroller = findScrollContainer();
    let lastScrollHeight = 0;
    let sameHeightCount = 0;

    // 3. Vòng lặp cuộn
    const scrollInterval = setInterval(() => {
        if (!window.isScanning) { 
            clearInterval(scrollInterval);
            finishScan(scroller);
            return; 
        }

        collectLinks();

        // Thực hiện lệnh cuộn
        let currentScrollHeight;
        if (scroller.type === 'window') {
            window.scrollTo(0, document.body.scrollHeight);
            currentScrollHeight = document.body.scrollHeight;
        } else {
            scroller.element.scrollTop = scroller.element.scrollHeight;
            currentScrollHeight = scroller.element.scrollHeight;
        }

        // Kiểm tra xem đã kịch sàn chưa
        if (currentScrollHeight === lastScrollHeight) {
            sameHeightCount += 200;
        } else {
            sameHeightCount = 0;
            lastScrollHeight = currentScrollHeight;
        }

        // Tự động dừng sau 3 giây (3000ms) không load thêm được gì
        if (sameHeightCount >= 5000) { 
            window.isScanning = false;
        }
    }, 200);

    // 4. Kết thúc
    const finishScan = async (scrollerInfo) => {
        // Cuộn lên đầu trang nhẹ để trigger lazyload lần cuối nếu cần
        if (scrollerInfo.type === 'window') window.scrollTo(0, 0); 
        else scrollerInfo.element.scrollTop = 0;
        
        await new Promise(r => setTimeout(r, 1800));
        collectLinks(); // Quét lần chốt
        
        const finalLinks = Array.from(window.capturedVideos);
        
        // Gửi dữ liệu về Background
        chrome.runtime.sendMessage({ action: "finished_scan_data", links: finalLinks });
        try { chrome.runtime.sendMessage({ action: "scan_complete_notification" }); } catch(e) {}
    };
}