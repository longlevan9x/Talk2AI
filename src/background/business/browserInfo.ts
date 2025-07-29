import { EVENT_ACTION } from "../../constant";
import { IBrowserInfo } from "../types/background";
import { getCachedBrowserInfo, setCachedBrowserInfo } from "../states/globalState";
import { getSendMessageParams } from "../utils/utils";

export async function getBrowserInfo(): Promise<IBrowserInfo> {
    let cachedBrowserInfo = getCachedBrowserInfo();
    if (cachedBrowserInfo) {
        return cachedBrowserInfo;
    }

    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            cachedBrowserInfo = getDefaultBrowserInfo();
            setCachedBrowserInfo(cachedBrowserInfo);
            resolve(cachedBrowserInfo);
        }, 1000);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError || !tabs.length) {
                clearTimeout(timer);
                cachedBrowserInfo = getDefaultBrowserInfo();
                setCachedBrowserInfo(cachedBrowserInfo);
                return resolve(cachedBrowserInfo);
            }

            chrome.tabs.sendMessage(tabs[0].id!, getSendMessageParams({ action: EVENT_ACTION.GET_BROWSER_INFO }), (response) => {
                clearTimeout(timer);
                if (chrome.runtime.lastError || !response) {
                    cachedBrowserInfo = getDefaultBrowserInfo();
                    setCachedBrowserInfo(cachedBrowserInfo);
                    return resolve(cachedBrowserInfo);
                }
                cachedBrowserInfo = response;
                resolve(response);
            });
        });
    });
}

export function getDefaultBrowserInfo(): IBrowserInfo {
    return {
        page_height: 953,
        page_width: 1920,
        pixel_ratio: 1,
        screen_height: 1080,
        screen_width: 1920
    };
}