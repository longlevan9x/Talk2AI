import { EVENT_ACTION, EVENT_TYPE } from "../../constant";
import { CHATGPT_BACKEND_API_URL, BASE_CHATGPT_URL } from "../constants/constant";
import { IGptHeaders, IChatPayload } from "../types/background";
import { getBrowserInfo } from "./browserInfo";
import { getChatgptTabId, setChatgptTabId } from "./globalState";
import { getLocalStorageGptKeys, getClientId } from "./storage";
import { generateUUIDv4Str, getSendMessageParams } from "./utils";

export async function sendConversation(message: any): Promise<any> {
    try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const stored = await getLocalStorageGptKeys();

        if (!stored.authorization || !stored.oaiClientVersion) {
            openOrFocusChatGPTTab();
            return { error: "Thiếu token hoặc headers. Đang mở ChatGPT để lấy lại..." };
        }

        const newMessageId = generateUUIDv4Str();
        const rawHeaders = getRequestHeader(stored.authorization);
        const headers: IGptHeaders = { ...rawHeaders, "Accept": "text/event-stream" };
        headers["oai-client-version"] = stored.oaiClientVersion;
        if (stored.userAgent) headers["User-Agent"] = stored.userAgent;
        if (stored.oaiLanguage) headers["oai-language"] = stored.oaiLanguage;
        headers["oai-device-id"] = await getClientId();

        const chatRequirementsToken = await postChatRequirements(headers);
        headers["openai-sentinel-chat-requirements-token"] = chatRequirementsToken.token;

        const proofToken = await getProofToken(chatRequirementsToken.proofofwork.seed, chatRequirementsToken.proofofwork.difficulty);
        headers["openai-sentinel-proof-token"] = proofToken;

        const browserInfo = await getBrowserInfo();
        const payload: IChatPayload = {
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
            parent_message_id: "client-created-root",
            model: "auto",
            timezone_offset_min: new Date().getTimezoneOffset(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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

            chrome.tabs.sendMessage(activeTab.id!, getSendMessageParams({
                action: EVENT_ACTION.SSE_PART,
                content: resJson?.detail
            })).catch((err) => {
                console.log("SendMessage lỗi:", err);
            });

            return { success: false, error: resJson };
        }

        const reader = conversationRes.body!.getReader();
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

                if (dataStr === "[DONE]") {
                    break;
                }

                if (!dataStr) continue;

                try {
                    const json = JSON.parse(dataStr);

                    if (json.v?.message?.author?.role === "user") {
                        continue;
                    }

                    let delta: string | null = null;
                    if (json.v?.message?.content?.parts?.length > 0) {
                        delta = json.v.message.content.parts[0];
                    } else if (typeof json.v === "string") {
                        delta = json.v;
                    } else if (json.p && json.o === "append" && typeof json.v === "string") {
                        delta = json.v;
                    } else if (json?.o === "patch" && Array.isArray(json.v)) {
                        const jsonV = json.v[0];
                        if (jsonV.o === "append" && typeof jsonV.v === "string") {
                            delta = jsonV.v;
                        }
                    }

                    if (delta) {
                        fullContent += delta;

                        chrome.tabs.sendMessage(activeTab.id!, getSendMessageParams({
                            action: EVENT_ACTION.SSE_PART,
                            content: delta,
                        })).catch((err) => {
                            console.log("SendMessage lỗi:", err);
                        });
                    }
                } catch (err) {
                    console.warn("Có lỗi xảy ra:", err);
                }
            }
        }

        return { success: true };
    } catch (error: any) {
        console.log(error);
        return { error: error.message || error };
    }
}

export async function postChatRequirements(headers: Record<string, string>) {
    const clientId = await getClientId();

    const response = await fetch(`${CHATGPT_BACKEND_API_URL}/sentinel/chat-requirements`, {
        method: "POST",
        headers: {
            ...headers,
            Accept: "application/json",
            "Content-Type": "application/json",
            "oai-device-id": clientId
        },
        body: JSON.stringify({
            conversationMode: {
                kind: "primary_assistant"
            }
        })
    });

    return response.json();
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

export function getProofToken(secret: string, difficulty: number): Promise<string> {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: EVENT_TYPE.FROM_BG,
                    action: EVENT_ACTION.GET_PROOF_TOKEN,
                    params: [secret, difficulty]
                }, (response) => {
                    resolve(response);
                });
            } else {
                resolve("");
            }
        });
    });
}


export function getRequestHeader(bearerToken: string): Record<string, string> {
    if (!bearerToken.startsWith("Bearer ")) {
        bearerToken = "Bearer " + bearerToken;
    }
    return {
        "Content-Type": "application/json",
        Authorization: `${bearerToken}`,
        origin: BASE_CHATGPT_URL,
        referer: `${BASE_CHATGPT_URL}/`
    };
}
