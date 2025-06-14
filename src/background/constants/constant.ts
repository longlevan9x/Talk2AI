import { ILocalStoragePrefix, ILocalStorageKeys } from "../types/background";

export const BASE_CHATGPT_URL = "https://chatgpt.com";
export const CHATGPT_BACKEND_API_URL = BASE_CHATGPT_URL + "/backend-api";
export const LOCAL_STORAGE_PREFIX: ILocalStoragePrefix = {
    CHATGPT: "gpt"
};

export const LOCAL_STORAGE_KEYS: ILocalStorageKeys = {
    GPT_CLIENT_ID: "clientId",
};

