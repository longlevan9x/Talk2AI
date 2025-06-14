import { ILocalStoragePrefix, ILocalStorageKeys, IEventType, IEventAction } from "../types/background";

export const BASE_CHATGPT_URL = "https://chatgpt.com";
export const CHATGPT_BACKEND_API_URL = BASE_CHATGPT_URL + "/backend-api";
export const LOCAL_STORAGE_PREFIX: ILocalStoragePrefix = {
    CHATGPT: "gpt"
};

export const LOCAL_STORAGE_KEYS: ILocalStorageKeys = {
    GPT_CLIENT_ID: "clientId",
};

export const EVENT_TYPE: IEventType = {
    FROM_BG: "FROM_BG",
    FROM_CONTENT: "FROM_CONTENT"
} as const;

export const EVENT_ACTION: IEventAction = {
    GPT_STREAM_PART: "GPT_STREAM_PART",
    GPT_STREAM_DONE: "GPT_STREAM_DONE",
    SEND_PROMPT: "SEND_PROMPT",
    GET_BROWSER_INFO: "GET_BROWSER_INFO",
    SSE_PART: "SSE_PART",
    SSE_DONE: "SSE_DONE",
    SSE_ERR: "SSE_DONE",
    GET_PROOF_TOKEN: "GET_PROOF_TOKEN"
} as const;


