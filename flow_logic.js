let flow_selectedFiles = [];
let flow_processedPrompts = [];

const flow_updateUI = (percent, msg, current, total, time) => {
    const bar = document.getElementById('flow_progressBar');
    const txt = document.getElementById('flow_statusText');
    const timer = document.getElementById('flow_timeInfo');

    if (bar) bar.style.width = `${percent}%`;
    if (txt) txt.innerText = msg;
    if (timer && time) timer.innerText = time;
};

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "UPDATE_PROGRESS") {
        flow_updateUI(request.percent, request.message, request.currentIdx, request.total, request.timeLeft);
    }
});

document.getElementById('flow_imageInput').addEventListener('change', (e) => {
    flow_selectedFiles = Array.from(e.target.files).sort((a, b) => {
        return (parseInt(a.name.match(/\d+/)) || 0) - (parseInt(b.name.match(/\d+/)) || 0);
    });
    const label = document.getElementById('flow_fileLabelText');
    const badge = document.getElementById('flow_imageCount');
    if (flow_selectedFiles.length > 0) {
        label.innerText = `Đã chọn ${flow_selectedFiles.length} file`;
        badge.innerText = flow_selectedFiles.length;
    }
});

document.getElementById('flow_promptInput').addEventListener('input', (e) => {
    const raw = e.target.value;
    flow_processedPrompts = raw.split('\n').map(l => l.trim()).filter(l => l !== "" && !/^\d+[\.\)]?$/.test(l));
    document.getElementById('flow_promptCount').innerText = `${flow_processedPrompts.length} dòng`;
});

// START
document.getElementById('flow_startBtn').addEventListener('click', async () => {
    if (flow_selectedFiles.length === 0 || flow_processedPrompts.length === 0) {
        document.getElementById('flow_statusText').innerText = "⚠️ Thiếu ảnh hoặc prompt!";
        return;
    }
    const btn = document.getElementById('flow_startBtn');
    const stopBtn = document.getElementById('flow_stopBtn');

    btn.disabled = true; 
    btn.innerHTML = `<span class="material-icons-round">hourglass_top</span> Đang chạy...`;
    
    // [MỚI] Hiện nút Stop
    stopBtn.style.display = 'flex'; 

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['flow_content.js'] 
        });
    } catch(e) {}

    const loopCount = Math.min(flow_selectedFiles.length, flow_processedPrompts.length);
    for (let i = 0; i < loopCount; i++) {
        const base64 = await flow_toBase64(flow_selectedFiles[i]);
        const job = {
            id: i + 1,
            fileName: flow_selectedFiles[i].name,
            fileData: base64,
            fileType: flow_selectedFiles[i].type,
            prompt: flow_processedPrompts[i],
            total: loopCount
        };
        await chrome.tabs.sendMessage(tab.id, { action: "ADD_JOB", job: job });
    }
    chrome.tabs.sendMessage(tab.id, { action: "START_QUEUE" });
});

// STOP
document.getElementById('flow_stopBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.reload(tab.id);
    
    // [MỚI] Ẩn nút Stop và Reset nút Start
    document.getElementById('flow_stopBtn').style.display = 'none';
    const btn = document.getElementById('flow_startBtn');
    btn.disabled = false;
    btn.innerHTML = `<span class="material-icons-round">play_arrow</span> CHẠY FLOW`;
    
    document.getElementById('flow_statusText').innerText = "Đã dừng thủ công.";
});

const flow_toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});