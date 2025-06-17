import { ILocalStoragePrefix } from "../types/background";

export const BASE_CHATGPT_URL = "https://chatgpt.com";
export const CHATGPT_BACKEND_API_URL = BASE_CHATGPT_URL + "/backend-api";
export const LOCAL_STORAGE_PREFIX: ILocalStoragePrefix = {
    CHATGPT: "gpt"
};

export const LOCAL_STORAGE_KEYS = {
    GPT_CLIENT_ID: "clientId",
    CONVERSATION_ID: "conversation_id",
    CURRENT_MESSAGE_ID: "current_message_id",
    MESSAGE_COUNT: "message_count"
};

