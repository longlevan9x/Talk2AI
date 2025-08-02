import { LOCAL_STORAGE_PREFIX } from "../../common/constant";
import { headerNameToStorageKey, getChatGPTLocalStoragePrefixKey } from "../utils/utils";

export function clearChatGptHeaders(): void {
    chrome.storage.local.set({[`${LOCAL_STORAGE_PREFIX.CHATGPT}_authorization`]: ""});
}

export function setChatGptHeaders(headers: chrome.webRequest.HttpHeader[]): { requestHeaders: chrome.webRequest.HttpHeader[] } {
    const lowercased = (h: chrome.webRequest.HttpHeader) => h.name.toLowerCase();

    const wantedHeaders = [
        "authorization",
        "oai-client-version",
        "user-agent",
        "accept-language",
        "oai-language",
        // "openai-sentinel-turnstile-token"
    ];

    const dataToStore: Record<string, string | undefined> = {};

    headers.forEach(h => {
        const key = lowercased(h);

        if (wantedHeaders.includes(key) && h.value) {
            const storageKey = headerNameToStorageKey(h.name);
            dataToStore[getChatGPTLocalStoragePrefixKey(storageKey)] = h.value;
        }
    });

    if (Object.keys(dataToStore).length > 0) {
        chrome.storage.local.set(dataToStore);
    }

    return { requestHeaders: headers };
}