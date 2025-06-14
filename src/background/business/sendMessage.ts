import { getSendMessageParams } from "./utils";

export async function sendMessageFromBG(tabId: number, params: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, getSendMessageParams(params), (response) => {
            const err = chrome.runtime.lastError;
            if (err) {
                reject(err);
            } else {
                resolve(response);
            }
        });
    });
}
