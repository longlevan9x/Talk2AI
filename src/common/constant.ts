import { ILocalStoragePrefix } from "./types/localstorage";

export enum EVENT_TYPE {
  FROM_PAGE = "FROM_PAGE",
  FROM_EXTENSION = "FROM_EXTENSION",
  FROM_BG = "FROM_BG",
  FROM_CONTENT = "FROM_CONTENT"
}

export enum EVENT_ACTION {
  EXT_LOST_CONNECTION = "EXT_LOST_CONNECTION",
  EXT_CHECK = "EXT_CHECK",
  EXT_PRESENT = "EXT_PRESENT",
  SEND_PROMPT = "SEND_PROMPT",
  GET_PROOF_TOKEN = "GET_PROOF_TOKEN",
  GET_BROWSER_INFO = "GET_BROWSER_INFO",
  PING = "PING",
  PONG = "PONG",
  //background
  SSE_PART = "SSE_PART",
  SSE_DONE = "SSE_DONE",
  SSE_ERROR = "SSE_ERROR",
  // content
  GPT_STREAM_PART = "GPT_STREAM_PART",
  GPT_STREAM_DONE = "GPT_STREAM_DONE",
  GPT_STREAM_ERROR = "GPT_STREAM_ERROR",
}

export const BASE_CHATGPT_URL = "https://chatgpt.com";
export const CHATGPT_BACKEND_API_URL = BASE_CHATGPT_URL + "/backend-api";

export const LOCAL_STORAGE_PREFIX: ILocalStoragePrefix = {
    CHATGPT: "gpt"
};

export const LOCAL_STORAGE_KEYS = {
    GPT_CLIENT_ID: "clientId",
    CONVERSATION_ID: "conversation_id",
    CURRENT_MESSAGE_ID: "current_message_id",
    MESSAGE_COUNT: "message_count",
    EXPLAIN_MESSAGE_COUNT: "explain_message_count",
    TRAN_MESSAGE_COUNT: "tran_message_count",
    SETTINGS: "settings"
};