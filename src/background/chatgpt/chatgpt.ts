import { BASE_CHATGPT_URL, CHATGPT_BACKEND_API_URL, EVENT_ACTION, LOCAL_STORAGE_KEYS, LOCAL_STORAGE_PREFIX } from "../../common/constant";
import { IGptHeaders, IChatPayload, IBrowserInfo } from "../types/background";
import { getBrowserInfo } from "../business/browserInfo";
import { getChatgptTabId, setChatgptTabId } from "../states/globalState";
import { chromeTabSendMessage } from "../business/sendMessage";
import { getLocalStorageGptKeys, getClientId, setLocalStorageGpt, setLocalStorageGptSplit, getSettingsSync, storageRemoveKeys } from "../states/storage";
import { generateUUIDv4Str, sleep } from "../utils/utils";
import { ISetting } from "../../common/types/setting";
import { PROMPT_TYPE } from "../constants/constant";
import { IConversationStorage } from "../types/converstaion";

interface SettingInfo {
    conversationId: string | undefined,
    oldConversationId: string,
    messageCount: number,
    currentMessageId: string,
    conversationIdKey: string,
    currentMessageIdKey: string,
    messageCountKey: string,
    isHideConversation: boolean
}

export async function sendConversation(message: { prompt: string, promptType: string }): Promise<any> {
    try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const activeTabId = activeTab.id!;
        const stored = await getLocalStorageGptKeys();
        const settings = await getSettingsSync();

        if (!await _ensureToken(stored, activeTabId)) {
            return { error: "Thiếu token hoặc headers. Đang mở ChatGPT để lấy lại..." };
        }

        let settingInfo = _prepareSetting(settings, stored as IConversationStorage, message.promptType)

        const newMessageId = generateUUIDv4Str();
        const rawHeaders = getRequestHeader(stored.authorization);
        const storageHeaders = getStorageHeader(stored);
        let headers: IGptHeaders = { ...rawHeaders, ...storageHeaders, "Accept": "text/event-stream" };

        if (settingInfo.isHideConversation) {
            await hideConversation(settingInfo.oldConversationId, headers);
            await storageRemoveKeys(LOCAL_STORAGE_PREFIX.CHATGPT, [settingInfo.conversationIdKey, settingInfo.currentMessageIdKey]);
        }

        const chatRequirementsToken = await postChatRequirements(headers);
        headers["openai-sentinel-chat-requirements-token"] = chatRequirementsToken.token;

        const proofToken = await getProofToken(chatRequirementsToken.proofofwork.seed, chatRequirementsToken.proofofwork.difficulty);
        // console.log(proofToken);
        if (!proofToken) {
            // await chromeTabSendMessage(activeTabId, EVENT_ACTION.SSE_PART, { error: true, content: "Thiếu proofToken. Hãy thử lại..." }).catch((err) => {
            //     console.log("SendMessage lỗi:", err);
            // });

            return { error: "Thiếu proofToken. Hãy thử lại..." };
        }

        headers["openai-sentinel-proof-token"] = proofToken;

        const browserInfo = await getBrowserInfo();
        const payload = _buildPayload(message, browserInfo, settingInfo.conversationId, settingInfo.currentMessageId, newMessageId);

        const conversationRes = await fetch(`${CHATGPT_BACKEND_API_URL}/conversation`, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
            credentials: "include"
        });

        if (conversationRes.status === 401) {
            openOrFocusChatGPTTab();
            return { error: "Token expired, opened chatgpt.com to refresh token" };
        }

        const resContentType = conversationRes.headers.get("content-type");

        if (conversationRes.status !== 200) {
            let resJson: any = null;
            if (resContentType === "application/json") {
                resJson = await conversationRes.json();
            }

            await chromeTabSendMessage(activeTabId, EVENT_ACTION.SSE_PART, { error: true, content: resJson?.detail?.message || resJson?.detail }).catch((err) => {
                console.log("SendMessage lỗi:", err);
            });

            return { success: false, error: resJson };
        }

        settingInfo.messageCount += 1;
        setLocalStorageGptSplit(settingInfo.messageCountKey, settingInfo.messageCount);

        const reader = conversationRes.body!.getReader();
        await _handleStream(reader, activeTabId, settingInfo);

        return { success: true };
    } catch (error: any) {
        console.log(error);
        return { error: error.message || error };
    }
}

export async function hideConversation(conversationId: string | undefined, headers: Record<string, string>) {
    if (!conversationId) {
        return null;
    }

    const payload = {
        is_visible: false
    };

    const response = await fetch(`${CHATGPT_BACKEND_API_URL}/conversation/${conversationId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
        credentials: "include"
    });

    if (!response.ok) {
        let errorDetail = null;
        try {
            errorDetail = await response.json();
            if (errorDetail?.detail) {
                errorDetail = errorDetail.detail;
            }

        } catch {
            errorDetail = await response.text();
        }

        throw new Error(errorDetail || "Failed to hide conversation");
    }

    return response.json();
}

export async function postChatRequirements(headers: Record<string, string>) {
    const clientId = await getClientId();

    const response = await fetch(`${CHATGPT_BACKEND_API_URL}/sentinel/chat-requirements`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
            conversationMode: {
                kind: "primary_assistant"
            }
        })
    });

    if (!response.ok) {
        let errorDetail = null;
        try {
            errorDetail = await response.json();
            if (errorDetail?.detail) {
                errorDetail = errorDetail.detail;
            }

        } catch {
            errorDetail = await response.text();
        }

        throw new Error(errorDetail || "Failed to fetch chat requirements");
    }

    return response.json();
}

export function getProofToken(secret: string, difficulty: number): Promise<string> {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chromeTabSendMessage(tabs[0].id, EVENT_ACTION.GET_PROOF_TOKEN, { params: [secret, difficulty] }).then(response => {
                    resolve(response);
                }).catch(err => {
                    console.log("getProofToken err", err);
                    resolve("");
                })
            } else {
                resolve("");
            }
        });
    });
}

function getStorageHeader(storage: any): IGptHeaders {
    const headers: IGptHeaders = {};

    headers["oai-client-version"] = storage.oaiClientVersion;

    if (storage.userAgent) headers["User-Agent"] = storage.userAgent;
    if (storage.oaiLanguage) headers["oai-language"] = storage.oaiLanguage;

    storage["oai-device-id"] = storage.clientId;

    return headers;
}

export function getRequestHeader(bearerToken: string): Record<string, string> {
    if (bearerToken && !bearerToken.startsWith("Bearer ")) {
        bearerToken = "Bearer " + bearerToken;
    }

    return {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `${bearerToken}`,
        origin: BASE_CHATGPT_URL,
        referer: `${BASE_CHATGPT_URL}/`
    };
}

// Hàm tạo hoặc focus tab chatgpt.com để lấy token mới
export function openOrFocusChatGPTTab(): void {
    const chatgptTabId = getChatgptTabId();
    if (chatgptTabId !== null) {
        chrome.tabs.get(chatgptTabId, (tab) => {
            if (chrome.runtime.lastError || !tab) {
                createChatGPTTab();
            } else {
                chrome.tabs.reload(chatgptTabId!);
                chrome.tabs.update(chatgptTabId!, { active: false });
            }
        });
    } else {
        createChatGPTTab();
    }
}

export function createChatGPTTab(): void {
    chrome.tabs.create({ url: BASE_CHATGPT_URL, active: false }, (tab) => {
        if (tab.id !== undefined) {
            setChatgptTabId(tab.id);
        }
    });
}

async function _ensureToken(stored: any, activeTabId: number): Promise<boolean> {
    if (!stored.authorization || !stored.oaiClientVersion) {
        openOrFocusChatGPTTab();
        await chromeTabSendMessage(activeTabId, EVENT_ACTION.SSE_PART, { error: true, content: "Thiếu token. Hãy đăng nhập lại chatgpt." });
        return false;
    }
    return true;
}

function _buildPayload(message: { prompt: string }, browserInfo: IBrowserInfo, conversationId: string | undefined, currentMessageId: string, newMessageId: string): IChatPayload {
    return {
        action: "next",
        messages: [
            {
                id: newMessageId,
                author: { role: "user" },
                create_time: Date.now() / 1000,
                content: {
                    content_type: "text",
                    parts: [message.prompt]
                },
                metadata: {
                    selected_github_repos: [],
                    selected_all_github_repos: false,
                    serialization_metadata: { custom_symbol_offsets: [] }
                }
            }
        ],
        parent_message_id: currentMessageId,
        model: "auto",
        timezone_offset_min: new Date().getTimezoneOffset(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        conversation_id: conversationId,
        conversation_mode: { kind: "primary_assistant" },
        enable_message_followups: true,
        system_hints: [],
        supports_buffering: true,
        supported_encodings: ["v1"],
        client_contextual_info: {
            is_dark_mode: true,
            time_since_loaded: performance.now() / 1000,
            page_height: browserInfo.page_height,
            page_width: browserInfo.page_width,
            pixel_ratio: browserInfo.pixel_ratio,
            screen_height: browserInfo.screen_height,
            screen_width: browserInfo.screen_width
        },
        paragen_cot_summary_display_override: "allow"
    };
}

async function _handleStream(reader: ReadableStreamDefaultReader<Uint8Array>, activeTabId: number, settingInfo: SettingInfo) {
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let fullContent = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
            const lines = part.trim().split("\n");
            let eventType: string | null = null;
            const dataLines: string[] = [];

            for (const line of lines) {
                if (line.startsWith("event:")) {
                    eventType = line.slice(6).trim();
                } else if (line.startsWith("data:")) {
                    dataLines.push(line.slice(6).trim());
                }
            }

            const dataStr = dataLines.join("\n");
            if (dataStr === "[DONE]") break;
            if (!dataStr) continue;

            try {
                const json = JSON.parse(dataStr);

                // 2025-10-11: Response json của message từ 1 object -> thành 1 array các object
                
                let jsonArray = [];
                if (Array.isArray(json?.v)) {
                    jsonArray = json.v;
                } else if (json?.message) {
                    jsonArray = [json];
                }

                for (const jsonItem of jsonArray) {
                    if (jsonItem.v?.conversation_id) setLocalStorageGpt({ [settingInfo.conversationIdKey]: jsonItem.v.conversation_id });
                    if (jsonItem.v?.message?.id) setLocalStorageGpt({ [settingInfo.currentMessageIdKey]: jsonItem.v.message.id });
                    if (jsonItem.v?.message?.author?.role === "user") continue;

                    let delta: string | null = null;
                    if (jsonItem.v?.message?.content?.parts?.length > 0) delta = jsonItem.v.message.content.parts[0];
                    else if (typeof jsonItem.v === "string") delta = jsonItem.v;
                    else if (jsonItem.p && jsonItem.o === "append" && typeof jsonItem.v === "string") delta = jsonItem.v;
                    else if (jsonItem?.o === "patch" && Array.isArray(jsonItem.v)) {
                        const jsonItemV = jsonItem.v[0];
                        if (jsonItemV.o === "append" && typeof jsonItemV.v === "string") delta = jsonItemV.v;
                    }

                    if (delta) {
                        fullContent += delta;
                        await chromeTabSendMessage(activeTabId, EVENT_ACTION.SSE_PART, { content: delta });
                    }
                }
            } catch (err) {
                console.warn("Có lỗi xảy ra:", err);
            }
        }
    }
    return fullContent;
}

function _prepareSetting(settings: ISetting, stored: IConversationStorage, promptType: string): SettingInfo {
    const rootMessageId = "client-created-root";

    // Mapping cho các loại prompt
    const promptConfigs = {
        [PROMPT_TYPE.TRAN]: {
            prefix: "tran",
        },
        [PROMPT_TYPE.EXPLAIN]: {
            prefix: "explain",
        },
        [PROMPT_TYPE.CUSTOM]: {
            prefix: "custom",
        }
    };

    let prefix = "";

    if (settings.splitConversation) {
        const config = promptConfigs[promptType as keyof typeof promptConfigs];
        prefix = config.prefix;
    }

    // Lấy config cho prompt type hiện tại hoặc default
    const _stored = stored as any;
    const _settings = settings as any;

    // Sử dụng hàm buildKey để tạo các key
    let conversationId = _stored[_buildKey(prefix, "conversation_id")] || undefined;
    let currentMessageId = _stored[_buildKey(prefix, "current_message_id")] || rootMessageId;
    let messageCount = _stored[_buildKey(prefix, "message_count")] ? parseInt(_stored[_buildKey(prefix, "message_count")]) : 0;
    let isHideConversation = _settings[_buildKey(prefix, "isHideConversation", true)]; // isCamelCase = true
    const maxCount = _settings[_buildKey(prefix, "messageCount", true)]; // isCamelCase = true
    let conversationIdKey = _buildKey(prefix, "conversation_id");
    let currentMessageIdKey = _buildKey(prefix, "current_message_id");
    let messageCountKey = _buildKey(prefix, "message_count");

    let oldConversationId = conversationId;
    let _isHideConversation = false;

    // Kiểm tra nếu đã vượt quá giới hạn
    if (messageCount > maxCount) {
        conversationId = undefined;
        currentMessageId = rootMessageId;
        messageCount = 0;
        _isHideConversation = isHideConversation ? true : false;
    }

    return {
        conversationId,
        oldConversationId: oldConversationId,
        messageCount,
        currentMessageId,
        conversationIdKey: conversationIdKey,
        currentMessageIdKey: currentMessageIdKey,
        messageCountKey: messageCountKey,
        isHideConversation: _isHideConversation
    };
}

// Thêm hàm utility này vào đầu file hoặc tạo file utils riêng
function _buildKey(prefix: string, key: string, isCamelCase: boolean = false): string {
    if (!prefix) {
        return key;
    }

    if (isCamelCase) {
        // Chuyển ký tự đầu của key thành uppercase
        const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
        return prefix + capitalizedKey;
    }

    // Nối prefix với key bằng underscore
    return prefix + "_" + key;
}