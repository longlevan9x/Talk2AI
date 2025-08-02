import { defaultSettings } from "../../common/config";
import { LOCAL_STORAGE_PREFIX, LOCAL_STORAGE_KEYS } from "../../common/constant";
import { ISetting } from "../../common/types/setting";
import { IStorageItems } from "../types/background";
import { gptConvertStorageKey, getChatGPTLocalStoragePrefixKey, generateUUIDv4Str } from "../utils/utils";

export async function getLocalStorageGptKeys(): Promise<Record<string, any>> {
    const items: IStorageItems = await getLocalStorageSync(null);

    const filtered: Record<string, any> = {};
    for (const key in items) {
        if (key.startsWith(LOCAL_STORAGE_PREFIX.CHATGPT)) {
            const newKey = gptConvertStorageKey(key);
            filtered[newKey] = items[key];
        }
    }

    return filtered;
}

export async function getLocalStorageGptKey<T>(key: string): Promise<Record<string, T>> {
    const storageKey = getChatGPTLocalStoragePrefixKey(key);
    const stored = await getLocalStorageSync(storageKey);
    return { [key]: stored[storageKey] };
}

export async function getClientId(): Promise<string> {
    const result = await getLocalStorageGptKey<string>(LOCAL_STORAGE_KEYS.GPT_CLIENT_ID);
    return result.clientId || "";
}

export async function setClientId(clientId: string): Promise<string> {
    await chrome.storage.local.set({ [getChatGPTLocalStoragePrefixKey(LOCAL_STORAGE_KEYS.GPT_CLIENT_ID)]: clientId });
    return clientId;
}

export async function storageRemoveKeyPrefix(prefix: string): Promise<void> {
    const items = await chrome.storage.local.get();
    const keysToRemove = Object.keys(items).filter((key) => key.startsWith(prefix));

    if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
        console.log("Removed keys:", keysToRemove);
    } else {
        console.log("No keys matched the pattern.");
    }
}

export async function storageRemoveKeys(prefix: string, key: string | string[]): Promise<void> {
    if (Array.isArray(key)) {
        key = key.map((k) => prefix + "_" + k);
    }
    else {
        key = prefix + "_" + key;
    }

    await chrome.storage.local.remove(key);
}

export function getLocalStorageSync(key: string | string[] | null): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, (result) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result);
            }
        });
    });
}

export async function initClientId(): Promise<string> {
    try {
        const existingClientId = await getClientId();
        if (existingClientId) return existingClientId;

        const newClientId = generateUUIDv4Str();
        await setClientId(newClientId);
        return newClientId;
    } catch (err) {
        throw err;
    }
}

export function setLocalStorageGpt(items: { [key: string]: any }) {
    const _items: any = {};
    for (const key in items) {
        const element = items[key];
        _items[getChatGPTLocalStoragePrefixKey(key)] = element;
    }

    chrome.storage.local.set(_items);
}

export function setLocalStorageGptSplit(key: string, value: any) {
    setLocalStorageGpt({ [key]: value });
}

export async function getSettingsSync(): Promise<ISetting> {
    const storage = await getLocalStorageSync(LOCAL_STORAGE_KEYS.SETTINGS);

    if (!storage?.settings) {
        return defaultSettings;
    }

    return storage.settings;
}