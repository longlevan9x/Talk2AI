import { EVENT_ACTION, EVENT_TYPE } from "../../constant";
import { BASE_CHATGPT_URL } from "../constants/constant";
import { sendConversation } from "../chatgpt/chatgpt";
import { setCachedClientId } from "../states/globalState";
import { clearChatGptHeaders, setChatGptHeaders } from "../helpers/headers";
import { initClientId } from "../states/storage";

export const startBackground = () => {
    chrome.webRequest.onBeforeSendHeaders.addListener(
        (details) => {
            const headers = details.requestHeaders || [];

            if (details.initiator === BASE_CHATGPT_URL) {
                if (details.url === `${BASE_CHATGPT_URL}/auth/logout`) {
                    clearChatGptHeaders();
                }

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