// =========================================================
// BACKGROUND WORKER | Flow Downloader Auto
// =========================================================

let downloadQueue = [];
let activeDownloads = 0;
const MAX_CONCURRENT = 5; // Optimized for Speed (Default)
let isBatchRunning = false;
let totalFilesInitial = 0;

// Default Config
let currentConfig = {
    folder: "Flow_Videos",
    pattern: "video_{index}"
};

// Memory to prevent duplicate downloads in same session
let sessionHistory = new Set();

// =========================================================
// 1. MESSAGING & LOGIC
// =========================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 1. Save Config
    if (request.action === "save_config") {
        currentConfig = request.config;
    }

    // 2. Receive Data -> Start Queue
    if (request.action === "finished_scan_data") {
        const links = request.links;
        if (!links || links.length === 0) return;

        // Reset for new batch
        isBatchRunning = true;
        totalFilesInitial = 0;
        
        // Reverse to download oldest content (bottom) as #1
        links.reverse().forEach((url, index) => {
            if (sessionHistory.has(url)) return;
            sessionHistory.add(url);

            const fileNumber = index + 1;
            const filename = buildPath(url, fileNumber);
            
            downloadQueue.push({ url, filename });
            totalFilesInitial++;
        });

        updateBadge();
        processQueue();
    }
    
    // 3. Kill Switch
    if (request.action === "kill_process") {
        downloadQueue = [];
        isBatchRunning = false;
        updateBadge();
        // Optional: Cancel active downloads (requires ID tracking, simpler to just stop queue)
    }
});

// =========================================================
// 2. QUEUE PROCESSING
// =========================================================

function processQueue() {
    // Check if finished
    if (activeDownloads === 0 && downloadQueue.length === 0) {
        if (isBatchRunning) {
            isBatchRunning = false;
            updateBadge();
            if (totalFilesInitial > 0) notifySuccess(totalFilesInitial);
        }
        return;
    }

    // Check concurrency limit
    if (activeDownloads >= MAX_CONCURRENT || downloadQueue.length === 0) {
        return;
    }

    // Start download
    const item = downloadQueue.shift();
    activeDownloads++;
    updateBadge();

    chrome.downloads.download({
        url: item.url,
        filename: item.filename,
        conflictAction: 'uniquify',
        saveAs: false // Always auto-save in PRO mode
    }, (downloadId) => {
        if (chrome.runtime.lastError) {
            console.warn(`Download failed: ${item.url}`, chrome.runtime.lastError);
            activeDownloads--; 
            processQueue(); 
        }
    });

    // Try to spawn more threads if available
    processQueue();
}

chrome.downloads.onChanged.addListener((delta) => {
    if (delta.state && (delta.state.current === 'complete' || delta.state.current === 'interrupted')) {
        activeDownloads--;
        if (activeDownloads < 0) activeDownloads = 0;
        updateBadge();
        processQueue();
    }
});

function updateBadge() {
    const remaining = downloadQueue.length + activeDownloads;
    if (remaining > 0) {
        chrome.action.setBadgeText({ text: String(remaining) });
        chrome.action.setBadgeBackgroundColor({ color: "#16C3DE" });
    } else {
        chrome.action.setBadgeText({ text: "" });
    }
}

// =========================================================
// 3. UTILITIES (Naming & Sound)
// =========================================================

function buildPath(url, index) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');

    // Extension detection
    let ext = 'mp4';
    if (url.includes('.gif')) ext = 'gif';
    else if (url.includes('.webp')) ext = 'webp';

    let name = currentConfig.pattern || "video_{index}";
    name = name.replace(/{index}/g, index)
               .replace(/{date}/g, `${yyyy}-${mm}-${dd}`)
               .replace(/{time}/g, `${hh}h${min}`);
    
    // Sanitize filename
    name = name.replace(/[<>:"/\\|?*]+/g, '_');
    
    return `${currentConfig.folder}/${name}.${ext}`;
}

function notifySuccess(count) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon128.png',
        title: 'Flow Downloader Completed',
        message: `✅ Thành công! Đã lưu ${count} video vào máy.`,
        priority: 2
    });
    playSuccessSound();
}

async function playSuccessSound() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (tab) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(500, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
                    gain.gain.setValueAtTime(0.3, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.5);
                }
            });
        }
    } catch(e) {} // Ignore audio errors
}