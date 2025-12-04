// =========================================================
// UI LOGIC (Preview, Help, Settings)
// =========================================================
const helpBtn = document.getElementById('helpBtn');
const helpTooltip = document.getElementById('helpTooltip');
const filePatternInput = document.getElementById('filePattern');
const filenamePreview = document.getElementById('filenamePreview');

// 1. Help Toggle
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

// 2. Settings Link
document.getElementById('btnSettings').addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://settings/downloads' });
});

// 3. Live Preview Logic
function updatePreview() {
    let pattern = filePatternInput.value.trim();
    if (!pattern) pattern = "video_{index}";

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = "14h30";

    let preview = pattern;
    preview = preview.replace(/{index}/g, "1");
    preview = preview.replace(/{date}/g, dateStr);
    preview = preview.replace(/{time}/g, timeStr);
    
    filenamePreview.innerText = preview + ".mp4";
}
if (filePatternInput) {
    filePatternInput.addEventListener('input', updatePreview);
    updatePreview();
}

// =========================================================
// CORE FUNCTIONALITY
// =========================================================

const btnStart = document.getElementById('btnStart');
const btnStop = document.getElementById('btnStop');
const folderInput = document.getElementById('folderName');
const askSaveCheckbox = document.getElementById('askSave');
const modeSelect = document.getElementById('downloadMode');
const statusText = document.getElementById('statusText');
const statusBox = document.getElementById('statusBox');

// START BUTTON
btnStart.addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // 1. Lấy config
    let folderRaw = folderInput.value.trim() || "Tandev_Videos";
    const folderName = folderRaw.replace(/[<>:"/\\|?*]+/g, '_');
    
    let patternRaw = filePatternInput.value.trim() || "video_{index}";
    const askSave = askSaveCheckbox.checked;
    const selectedMode = modeSelect.value;

    // 2. Update UI
    btnStart.style.display = 'none';
    btnStop.style.display = 'flex';
    disableInputs(true);
    
    statusBox.classList.add('running');
    statusText.innerText = "Đang quét... (Có thể đóng popup)";
    statusText.style.color = "#16C3DE";
    
    // 3. Gửi Config xuống Background (để background lo liệu việc tải)
    chrome.runtime.sendMessage({
        action: "save_config",
        config: { folder: folderName, pattern: patternRaw, saveAs: askSave, mode: selectedMode }
    });

    // 4. Lắng nghe cập nhật số lượng (chỉ khi popup còn mở)
    chrome.runtime.onMessage.addListener(handleMessage);

    // 5. Chạy Script quét
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: startUniversalScroll
    });
});

// STOP BUTTON
btnStop.addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => { window.isScanning = false; }
    });
    resetUI();
    statusText.innerText = "Đã dừng quét.";
});

function handleMessage(request) {
    if (request.action === "update_count") {
        document.getElementById('countDisplay').innerText = request.count;
    }
    if (request.action === "scan_complete_notification") {
        statusText.innerText = "Đã gửi lệnh tải xuống!";
        statusText.style.color = "#00b894";
        resetUI();
    }
}

function disableInputs(disabled) {
    folderInput.disabled = disabled;
    filePatternInput.disabled = disabled;
    askSaveCheckbox.disabled = disabled;
    modeSelect.disabled = disabled;
}

function resetUI() {
    statusBox.classList.remove('running');
    btnStart.style.display = 'flex';
    btnStop.style.display = 'none';
    disableInputs(false);
}

// =========================================================
// INJECTED SCRIPT (Chạy bên trong trang web)
// =========================================================
async function startUniversalScroll() {
    window.capturedVideos = new Set();
    window.isScanning = true;
    
    const collectLinks = () => {
        // Tối ưu selector: Quét mọi thẻ video
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            // Ưu tiên src trực tiếp hoặc source con
            let src = video.src;
            if (!src && video.querySelector('source')) {
                src = video.querySelector('source').src;
            }
            
            // Chỉ lấy link http/https (bỏ blob nếu không xử lý được)
            if (src && src.startsWith('http')) {
                window.capturedVideos.add(src);
            }
        });

        // Gửi số lượng về popup (nếu popup đang mở)
        try { chrome.runtime.sendMessage({ action: "update_count", count: window.capturedVideos.size }); } catch (e) {}
    };

    const findScrollContainer = () => {
        if (document.documentElement.scrollHeight > window.innerHeight) return { element: window, type: 'window' };
        let allDivs = document.querySelectorAll('div');
        let maxScrollHeight = 0;
        let targetDiv = null;
        allDivs.forEach(div => {
            const style = window.getComputedStyle(div);
            if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
                if (div.scrollHeight > div.clientHeight && div.scrollHeight > maxScrollHeight) {
                    maxScrollHeight = div.scrollHeight;
                    targetDiv = div;
                }
            }
        });
        if (targetDiv) return { element: targetDiv, type: 'div' };
        return { element: window, type: 'window' };
    };

    const scroller = findScrollContainer();
    let lastScrollHeight = 0;
    let sameHeightCount = 0;

    const scrollInterval = setInterval(() => {
        if (!window.isScanning) { 
            clearInterval(scrollInterval);
            // Nếu bấm Stop, vẫn gửi những gì đã quét được
            const finalLinks = Array.from(window.capturedVideos);
            chrome.runtime.sendMessage({ action: "finished_scan_data", links: finalLinks });
            return; 
        }

        collectLinks();

        let currentScrollHeight;
        if (scroller.type === 'window') {
            window.scrollTo(0, document.body.scrollHeight);
            currentScrollHeight = document.body.scrollHeight;
        } else {
            scroller.element.scrollTop = scroller.element.scrollHeight;
            currentScrollHeight = scroller.element.scrollHeight;
        }

        if (currentScrollHeight === lastScrollHeight) {
            sameHeightCount += 200;
        } else {
            sameHeightCount = 0;
            lastScrollHeight = currentScrollHeight;
        }

        // Tự động dừng sau 3 giây không load thêm nội dung mới
        if (sameHeightCount >= 3000) { 
            clearInterval(scrollInterval);
            finishScan(scroller);
        }
    }, 200);

    const finishScan = async (scrollerInfo) => {
        // Cuộn lên đầu trang một chút để kích hoạt các element lazyload (nếu cần)
        if (scrollerInfo.type === 'window') window.scrollTo(0, 0); 
        else scrollerInfo.element.scrollTop = 0;
        
        await new Promise(r => setTimeout(r, 1000));
        collectLinks(); // Quét lần cuối
        
        const finalLinks = Array.from(window.capturedVideos);
        
        // Gửi dữ liệu về Background để xử lý tải (Popup có đóng cũng không sao)
        chrome.runtime.sendMessage({ action: "finished_scan_data", links: finalLinks });
        
        // Báo cho popup biết
        try { chrome.runtime.sendMessage({ action: "scan_complete_notification" }); } catch(e) {}
    };
}