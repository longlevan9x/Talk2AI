import { getSendMessageParams } from "../utils/utils";

export async function sendMessageFromBG(tabId: number, message: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, getSendMessageParams(message), (response) => {
            const err = chrome.runtime.lastError;
            if (err) {
                reject(err);
            } else {
                resolve(response);
            }
        });
    });
}

export function chromeTabSendMessage<M = any, R = any>(tabId: number, action: string, message: M): Promise<R> {
    const _message = getSendMessageParams({
        action: action,
        ...message
    });

    return chrome.tabs.sendMessage(tabId!, _message);
}