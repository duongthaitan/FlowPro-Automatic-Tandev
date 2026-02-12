if (!window.hasFlowAutomationRun) {
    window.hasFlowAutomationRun = true;
    
    var jobQueue = []; 
    // Thời gian chờ sau khi bấm Tạo (1 phút 40 giây)
    const WAIT_TIME_AFTER_CREATE = (1 * 60 + 40) * 1000; 

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    const reportProgress = (percent, message, currentIdx, total, timeLeft = "") => {
        try {
            chrome.runtime.sendMessage({
                action: "UPDATE_PROGRESS",
                percent: percent,
                message: message,
                currentIdx: currentIdx,
                total: total,
                timeLeft: timeLeft
            });
        } catch (e) {}
    };

    const waitForElement = (selector, timeout = 5000) => {
        return new Promise((resolve) => {
            if (document.querySelector(selector)) return resolve(document.querySelector(selector));
            const observer = new MutationObserver(() => {
                if (document.querySelector(selector)) {
                    observer.disconnect();
                    resolve(document.querySelector(selector));
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => { observer.disconnect(); resolve(null); }, timeout);
        });
    };

    const getCreateButton = () => {
        let btn = document.querySelector('button.gdXWm') || document.querySelector('button.gdArnN');
        if (!btn) {
            const allButtons = Array.from(document.querySelectorAll('button'));
            btn = allButtons.find(b => {
                const txt = (b.textContent || "").trim();
                const icon = b.querySelector('i')?.textContent || "";
                return txt.includes("Tạo") || icon.includes("arrow_forward");
            });
        }
        return btn;
    };

    const findButton = (textToFind, iconToFind) => {
        const allButtons = Array.from(document.querySelectorAll('button'));
        return allButtons.find(btn => {
            const btnText = (btn.textContent || "").trim();
            const iconText = (btn.querySelector('i, span.material-icons, span.google-symbols')?.textContent || "").trim();
            if (textToFind && btnText.includes(textToFind)) return true;
            if (iconToFind && iconText === iconToFind) return true;
            return false;
        });
    };

    const nuclearClick = (btnElement) => {
        if (!btnElement) return;
        const target = btnElement.querySelector('div[data-type="button-overlay"]') || btnElement;
        ['mousedown', 'mouseup', 'click'].forEach(evtType => {
            target.dispatchEvent(new MouseEvent(evtType, {
                bubbles: true, cancelable: true, view: window, buttons: 1
            }));
        });
    };

    const findAndClickUploadButton = async () => {
        let fileInput = document.querySelector('input[type="file"]');
        if (fileInput) return fileInput;

        const allButtons = Array.from(document.querySelectorAll('button'));
        const addButtons = allButtons.filter(btn => {
            const iconText = btn.querySelector('i, span.material-icons, span.google-symbols')?.textContent?.trim();
            const hasOverlay = btn.querySelector('div[data-type="button-overlay"]'); 
            return iconText === 'add' && hasOverlay;
        });

        if (addButtons.length > 0) {
            const leftButton = addButtons[0];
            nuclearClick(leftButton);
            fileInput = await waitForElement('input[type="file"]', 5000);
            return fileInput;
        }
        return null;
    };

    const forceReactUpdate = async (input, value) => {
        if (!input) return;
        input.focus();
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
        
        nativeSetter?.call(input, value + " ");
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Space', code: 'Space', keyCode: 32, bubbles: true }));
        await sleep(300);
        
        nativeSetter?.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        
        input.blur(); 
        input.dispatchEvent(new Event('blur', { bubbles: true }));
    };

    const handleCropModal = async () => {
        let cropBtn = null;
        for (let i = 0; i < 10; i++) {
            cropBtn = findButton('Cắt và lưu', 'crop');
            if (cropBtn && !cropBtn.innerText.includes("Hủy")) break;
            await sleep(500);
        }

        if (cropBtn) {
            nuclearClick(cropBtn);
            return true; 
        }
        return false; 
    };

    const handleCreateButton = async (promptValue) => {
        for (let i = 0; i < 30; i++) {
            let createBtn = getCreateButton();
            const promptInput = document.getElementById('PINHOLE_TEXT_AREA_ELEMENT_ID');

            if (createBtn) {
                if (!createBtn.disabled) {
                    createBtn.scrollIntoView({ behavior: 'auto', block: 'center' });
                    nuclearClick(createBtn);
                    return true; 
                } else {
                    if (promptInput) await forceReactUpdate(promptInput, promptValue);
                }
            }
            await sleep(1000); 
        }
        return false;
    };

    // --- MAIN ---
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "ADD_JOB") {
            jobQueue.push(request.job);
            sendResponse({status: "ok"});
        }
        if (request.action === "START_QUEUE") processQueue();
    });

    async function processQueue() {
        if (jobQueue.length === 0) return;
        const currentJobs = [...jobQueue];
        jobQueue = []; 

        for (const [index, job] of currentJobs.entries()) {
            const currentStep = index + 1;
            const totalSteps = currentJobs.length;

            try {
                // STEP 1: UPLOAD (Thử lại 3 lần)
                let fileInput = null;
                let retryCount = 0;
                while (retryCount < 3) {
                    reportProgress(10, `Đang tải lên: ${job.fileName} (Thử ${retryCount+1})`, currentStep, totalSteps);
                    fileInput = await findAndClickUploadButton();
                    if (fileInput) break;
                    await sleep(2000);
                    retryCount++;
                }

                if (fileInput) {
                    const file = await urlToFile(job.fileData, job.fileName, job.fileType);
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    fileInput.files = dt.files;
                    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                    fileInput.dispatchEvent(new Event('input', { bubbles: true }));
                } else {
                    reportProgress(10, `❌ Lỗi Upload: ${job.fileName}`, currentStep, totalSteps);
                    await sleep(2000);
                    continue; 
                }

                // STEP 2: CẮT ẢNH
                reportProgress(30, "Đang xử lý cắt ảnh...", currentStep, totalSteps);
                await sleep(4000);
                const didCrop = await handleCropModal();
                if (didCrop) {
                    reportProgress(35, "Đang load ảnh đã cắt...", currentStep, totalSteps);
                    await sleep(20000); 
                } else { 
                    await sleep(3000); 
                }

                // STEP 3: PROMPT
                reportProgress(50, "Đang nhập Prompt...", currentStep, totalSteps);
                const promptInput = await waitForElement('#PINHOLE_TEXT_AREA_ELEMENT_ID', 5000);
                if (promptInput) {
                    promptInput.focus();
                    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
                    nativeSetter?.call(promptInput, job.prompt);
                    promptInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
                
                // STEP 4: TẠO
                reportProgress(60, "Chờ 5s...", currentStep, totalSteps);
                await sleep(5000); 
                reportProgress(70, "Bấm nút Tạo...", currentStep, totalSteps);
                
                const success = await handleCreateButton(job.prompt);
                
                if (success) {
                    const startTime = Date.now();
                    const endTime = startTime + WAIT_TIME_AFTER_CREATE;
                    while (Date.now() < endTime) {
                        const remaining = endTime - Date.now();
                        const seconds = Math.ceil(remaining / 1000);
                        const percent = 70 + ((WAIT_TIME_AFTER_CREATE - remaining) / WAIT_TIME_AFTER_CREATE * 30);
                        reportProgress(
                            Math.min(99, percent), 
                            `Chờ render... ${seconds}s`, 
                            currentStep, totalSteps,
                            `${Math.floor(seconds/60)}:${(seconds%60).toString().padStart(2, '0')}`
                        );
                        await sleep(1000);
                    }
                } else {
                    if(promptInput) promptInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                    await sleep(WAIT_TIME_AFTER_CREATE);
                }

            } catch (e) { console.error(e); }
        }
        
        reportProgress(100, "✅ Hoàn thành tất cả!", currentJobs.length, currentJobs.length);

        // [MỚI] PHÁT ÂM THANH "TING TING" KHI XONG
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();
                // Nốt 1
                const osc1 = ctx.createOscillator();
                const gain1 = ctx.createGain();
                osc1.connect(gain1);
                gain1.connect(ctx.destination);
                osc1.type = "sine";
                osc1.frequency.setValueAtTime(660, ctx.currentTime);
                gain1.gain.setValueAtTime(0.1, ctx.currentTime);
                gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
                osc1.start();
                osc1.stop(ctx.currentTime + 0.5);
                // Nốt 2
                setTimeout(() => {
                    const osc2 = ctx.createOscillator();
                    const gain2 = ctx.createGain();
                    osc2.connect(gain2);
                    gain2.connect(ctx.destination);
                    osc2.type = "sine";
                    osc2.frequency.setValueAtTime(880, ctx.currentTime);
                    gain2.gain.setValueAtTime(0.1, ctx.currentTime);
                    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
                    osc2.start();
                    osc2.stop(ctx.currentTime + 0.5);
                }, 200);
            }
        } catch (e) {}
    }

    async function urlToFile(url, fname, mime) {
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        return new File([buf], fname, { type: mime });
    }
}