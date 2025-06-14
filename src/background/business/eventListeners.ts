import { BASE_CHATGPT_URL, EVENT_TYPE, EVENT_ACTION } from "../constants/constant";
import { sendConversation } from "./chatgpt";
import { setCachedClientId } from "./globalState";
import { setChatGptHeaders } from "./headers";
import { initClientId } from "./storage";

export const startBackground = () => {
    chrome.webRequest.onBeforeSendHeaders.addListener(
        (details) => {
            const headers = details.requestHeaders || [];

            if (details.initiator === BASE_CHATGPT_URL) {
                return setChatGptHeaders(headers);
            }
        },
        { urls: [`${BASE_CHATGPT_URL}/*`] },
        ["requestHeaders"]
    );

    chrome.runtime.onInstalled.addListener(async () => {
        const cachedClientId = await initClientId();
        setCachedClientId(cachedClientId);
        console.log("ClientId initialized:", cachedClientId);
    });

    chrome.runtime.onStartup.addListener(async () => {
        const cachedClientId = await initClientId();
        setCachedClientId(cachedClientId);
        console.log("ClientId ready on startup:", cachedClientId);
    });

    chrome.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
        if (message.type !== EVENT_TYPE.FROM_CONTENT) return;

        if (message.action === EVENT_ACTION.SEND_PROMPT) {
            sendConversation(message).then(result => {
                sendResponse(result);
            }).catch(error => {
                sendResponse({ error: error.message || error });
            });
            return true;
        }
    });
}