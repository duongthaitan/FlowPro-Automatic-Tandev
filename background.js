chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "start_download") {
        const links = request.links;
        const folder = request.folder;
        const saveAs = request.saveAs;

        links.forEach((url, index) => {
            const fileNumber = index + 1;
            let extension = 'mp4';
            if (url.includes('.gif')) extension = 'gif';
            else if (url.includes('.webp')) extension = 'webp';

            const filename = `${folder}/video${fileNumber}.${extension}`;

            chrome.downloads.download({
                url: url,
                filename: filename,
                conflictAction: 'overwrite',
                saveAs: saveAs
            });
        });
    }
});