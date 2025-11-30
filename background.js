// =========================================================
// BACKGROUND WORKER
// =========================================================

let downloadQueue = [];
let activeDownloads = 0;
let MAX_CONCURRENT = 3;

// Hàm tạo tên file thông minh
function generateFilename(pattern, index, extension) {
    const now = new Date();
    
    // Ngày: YYYY-MM-DD
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    // Giờ: HHhMM
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hh}h${min}`;

    const indexStr = String(index); 

    let finalName = pattern || "video_{index}"; // Fallback
    finalName = finalName.replace(/{index}/g, indexStr);
    finalName = finalName.replace(/{date}/g, dateStr);
    finalName = finalName.replace(/{time}/g, timeStr);

    finalName = finalName.replace(/[<>:"/\\|?*]+/g, '_');

    return `${finalName}.${extension}`;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "start_download") {
        const { links, folder, saveAs, mode, pattern } = request;

        const forcedSaveAs = (saveAs === true);

        if (mode === 'fast') {
            MAX_CONCURRENT = 10;
        } else {
            MAX_CONCURRENT = 3;
        }

        links.forEach((url, index) => {
            const fileNumber = index + 1;
            let extension = 'mp4';
            if (url.includes('.gif')) extension = 'gif';
            else if (url.includes('.webp')) extension = 'webp';

            // Gọi hàm đặt tên
            const fileNameOnly = generateFilename(pattern, fileNumber, extension);
            const fullPath = `${folder}/${fileNameOnly}`;

            downloadQueue.push({
                url: url,
                filename: fullPath,
                saveAs: forcedSaveAs
            });
        });

        processQueue();
    }
});

function processQueue() {
    if (activeDownloads >= MAX_CONCURRENT || downloadQueue.length === 0) {
        return;
    }

    const item = downloadQueue.shift();
    activeDownloads++;

    chrome.downloads.download({
        url: item.url,
        filename: item.filename,
        conflictAction: 'overwrite',
        saveAs: item.saveAs
    }, (downloadId) => {
        if (chrome.runtime.lastError) {
            console.error(`Lỗi tải: ${item.filename}`, chrome.runtime.lastError);
            activeDownloads--;
            processQueue(); 
        }
    });

    processQueue();
}

chrome.downloads.onChanged.addListener((delta) => {
    if (delta.state) {
        if (delta.state.current === 'complete' || delta.state.current === 'interrupted') {
            activeDownloads--;
            if (activeDownloads < 0) activeDownloads = 0;
            processQueue();
        }
    }
});