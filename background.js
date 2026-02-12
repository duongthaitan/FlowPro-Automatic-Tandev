// =========================================================
// BACKGROUND WORKER | Tandev Ultimate Suite
// =========================================================

let downloadQueue = [];
let activeDownloads = 0;
const MAX_CONCURRENT = 5; 
let isBatchRunning = false;
let totalFilesInitial = 0;

let currentConfig = {
    folder: "Flow_Videos",
    pattern: "video_{index}"
};

let sessionHistory = new Set();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 1. Lưu cấu hình
    if (request.action === "save_config") {
        currentConfig = request.config;
    }

    // 2. Nhận dữ liệu -> Bắt đầu hàng đợi
    if (request.action === "finished_scan_data") {
        const links = request.links;
        if (!links || links.length === 0) return;

        isBatchRunning = true;
        totalFilesInitial = 0;
        
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
    
    // 3. Hủy tiến trình
    if (request.action === "kill_process") {
        downloadQueue = [];
        isBatchRunning = false;
        updateBadge();
    }
});

function processQueue() {
    if (activeDownloads === 0 && downloadQueue.length === 0) {
        if (isBatchRunning) {
            isBatchRunning = false;
            updateBadge();
            if (totalFilesInitial > 0) notifySuccess(totalFilesInitial);
        }
        return;
    }

    if (activeDownloads >= MAX_CONCURRENT || downloadQueue.length === 0) {
        return;
    }

    const item = downloadQueue.shift();
    activeDownloads++;
    updateBadge();

    chrome.downloads.download({
        url: item.url,
        filename: item.filename,
        conflictAction: 'uniquify',
        saveAs: false 
    }, (downloadId) => {
        if (chrome.runtime.lastError) {
            console.warn(`Lỗi tải: ${item.url}`, chrome.runtime.lastError);
            activeDownloads--; 
            processQueue(); 
        }
    });

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
        chrome.action.setBadgeBackgroundColor({ color: "#21A691" });
    } else {
        chrome.action.setBadgeText({ text: "" });
    }
}

function buildPath(url, index) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');

    let ext = 'mp4';
    if (url.includes('.gif')) ext = 'gif';
    else if (url.includes('.webp')) ext = 'webp';

    let name = currentConfig.pattern || "video_{index}";
    name = name.replace(/{index}/g, index)
               .replace(/{date}/g, `${yyyy}-${mm}-${dd}`)
               .replace(/{time}/g, `${hh}h${min}`);
    
    name = name.replace(/[<>:"/\\|?*]+/g, '_');
    
    return `${currentConfig.folder}/${name}.${ext}`;
}

function notifySuccess(count) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png', // Đảm bảo bạn có file icon
        title: 'Tandev Downloader',
        message: `✅ Đã tải xong ${count} video!`,
        priority: 2
    });
}