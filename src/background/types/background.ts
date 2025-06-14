export type ILocalStoragePrefix = {
    CHATGPT: string;
};
export type ILocalStorageKeys = {
    GPT_CLIENT_ID: string;
};
export type IEventType = {
    FROM_BG: string;
    FROM_CONTENT: string;
};
export type IEventAction = {
    GPT_STREAM_PART: string;
    GPT_STREAM_DONE: string;
    SEND_PROMPT: string;
    GET_BROWSER_INFO: string;
    SSE_PART: string;
    SSE_DONE: string;
    SSE_ERR: string;
    GET_PROOF_TOKEN: string;
};

export interface IChatMessage {
  id: string;
  author: { role: string };
  create_time: number;
  content: {
    content_type: string;
    parts: string[];
  };
  metadata: {
    selected_github_repos: any[];
    selected_all_github_repos: boolean;
    serialization_metadata: { custom_symbol_offsets: any[] };
  };
}

export interface IChatPayload {
  action: string;
  messages: IChatMessage[];
  parent_message_id: string;
  model: string;
  timezone_offset_min: number;
  timezone: string;
  conversation_mode: { kind: string };
  enable_message_followups: boolean;
  system_hints: any[];
  supports_buffering: boolean;
  supported_encodings: string[];
  client_contextual_info: IBrowserInfo & { is_dark_mode: boolean; time_since_loaded: number };
  paragen_cot_summary_display_override: string;
}

export interface IBrowserInfo {
    page_height: number;
    page_width: number;
    pixel_ratio: number;
    screen_height: number;
    screen_width: number;
}

export type IGptHeaders = Record<string, string>;
export type IStorageItems = Record<string, any>;