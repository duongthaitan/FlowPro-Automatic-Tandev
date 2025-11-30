// =========================================================
// UI LOGIC
// =========================================================
const helpBtn = document.getElementById('helpBtn');
const helpTooltip = document.getElementById('helpTooltip');
const statusBox = document.getElementById('statusBox');

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

// =========================================================
// CORE FUNCTIONALITY
// =========================================================

const btnStart = document.getElementById('btnStart');
const btnStop = document.getElementById('btnStop');
const folderInput = document.getElementById('folderName');
const askSaveCheckbox = document.getElementById('askSave');
const statusText = document.getElementById('statusText');

// START
btnStart.addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Update UI
    btnStart.style.display = 'none';
    btnStop.style.display = 'flex';
    folderInput.disabled = true;
    askSaveCheckbox.disabled = true;
    
    statusBox.classList.add('running');
    statusText.innerText = "Đang quét dữ liệu...";
    
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
    const folderRaw = folderInput.value.trim();
    const folderName = folderRaw.replace(/[<>:"/\\|?*]+/g, '_') || "Veo_Videos";
    const askSave = askSaveCheckbox.checked;

    statusBox.classList.remove('running');
    const reversedLinks = links.reverse();

    if (reversedLinks.length > 0) {
        statusText.innerText = "Hoàn tất! Đang tải...";
        chrome.runtime.sendMessage({
            action: "start_download",
            links: reversedLinks,
            folder: folderName,
            saveAs: askSave
        });
    } else {
        statusText.innerText = "Không tìm thấy video nào";
    }

    // Reset UI
    btnStart.style.display = 'flex';
    btnStop.style.display = 'none';
    folderInput.disabled = false;
    askSaveCheckbox.disabled = false;
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