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
    if (!pattern) pattern = "video_{index}"; // Gợi ý mặc định

    // Giả lập ngày giờ
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = "14h30";

    let preview = pattern;
    preview = preview.replace(/{index}/g, "1");
    preview = preview.replace(/{date}/g, dateStr);
    preview = preview.replace(/{time}/g, timeStr);
    
    filenamePreview.innerText = preview + ".mp4";
}
filePatternInput.addEventListener('input', updatePreview);
updatePreview(); // Chạy 1 lần lúc mở

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

// START
btnStart.addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // UI Update
    btnStart.style.display = 'none';
    btnStop.style.display = 'flex';
    folderInput.disabled = true;
    filePatternInput.disabled = true;
    askSaveCheckbox.disabled = true;
    modeSelect.disabled = true;
    
    statusBox.classList.add('running');
    statusText.innerText = "Đang quét và cuộn...";
    statusText.style.color = "#16C3DE";
    
    chrome.runtime.onMessage.addListener(handleMessage);

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: startUniversalScroll
    });
});

// STOP
btnStop.addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    statusBox.classList.remove('running');
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: forceStopAndReturn
    });
});

function handleMessage(request) {
    if (request.action === "update_count") {
        document.getElementById('countDisplay').innerText = request.count;
    }
    if (request.action === "finished_scan") {
        processDownload(request.links);
    }
}

function processDownload(links) {
    // 1. Tự động điền nếu trống
    let folderRaw = folderInput.value.trim();
    if (!folderRaw) folderRaw = "Veo_Videos";
    const folderName = folderRaw.replace(/[<>:"/\\|?*]+/g, '_');
    
    let patternRaw = filePatternInput.value.trim();
    if (!patternRaw) patternRaw = "video_{index}";
    
    const askSave = askSaveCheckbox.checked;
    const selectedMode = modeSelect.value;

    statusBox.classList.remove('running');
    const reversedLinks = links.reverse();

    if (reversedLinks.length > 0) {
        statusText.innerText = "Hoàn tất! Đang tải...";
        statusText.style.color = "#00b894";
        
        chrome.runtime.sendMessage({
            action: "start_download",
            links: reversedLinks,
            folder: folderName,
            pattern: patternRaw,
            saveAs: askSave,
            mode: selectedMode
        });
    } else {
        statusText.innerText = "Không tìm thấy video nào";
        statusText.style.color = "#e53e3e";
    }

    // Reset UI
    btnStart.style.display = 'flex';
    btnStop.style.display = 'none';
    folderInput.disabled = false;
    filePatternInput.disabled = false;
    askSaveCheckbox.disabled = false;
    modeSelect.disabled = false;
    chrome.runtime.onMessage.removeListener(handleMessage);
}

// =========================================================
// CONTENT SCRIPT
// =========================================================
async function startUniversalScroll() {
    window.capturedVideos = new Set();
    window.isScanning = true;
    
    const collectLinks = () => {
        const containers = document.querySelectorAll('.sc-7c2943cd-3, div[class*="sc-"]');
        containers.forEach(div => {
            const video = div.querySelector('video');
            if (video) {
                let src = video.src || (video.querySelector('source') ? video.querySelector('source').src : null);
                if (src && src.startsWith('http')) window.capturedVideos.add(src);
            }
        });
        
        document.querySelectorAll('video').forEach(v => {
            let src = v.src || (v.querySelector('source') ? v.querySelector('source').src : null);
            if (src && src.startsWith('http')) window.capturedVideos.add(src);
        });

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
        if (!window.isScanning) { clearInterval(scrollInterval); return; }
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

        if (sameHeightCount >= 3000) {
            clearInterval(scrollInterval);
            finishScan(scroller);
        }
    }, 200);

    const finishScan = async (scrollerInfo) => {
        if (scrollerInfo.type === 'window') window.scrollTo(0, 0); 
        else scrollerInfo.element.scrollTop = 0;
        await new Promise(r => setTimeout(r, 1000));
        collectLinks();
        const finalLinks = Array.from(window.capturedVideos);
        chrome.runtime.sendMessage({ action: "finished_scan", links: finalLinks });
    };
}

function forceStopAndReturn() {
    window.isScanning = false;
    const finalLinks = Array.from(window.capturedVideos || []);
    chrome.runtime.sendMessage({ action: "finished_scan", links: finalLinks });
}