
let cachedBrowserInfo = null;
let chatgptTabId = null;

const BASE_CHATGPT_URL = "https://chatgpt.com";
const CHATGPT_BACKEND_API_URL = BASE_CHATGPT_URL + "/backend-api";
const LOCAL_STORAGE_PREFIX = {
    CHATGPT: "gpt"
};

const LOCAL_STORAGE_KEYS = {
    GPT_CLIENT_ID: "clientId",
};


const EVENT_TYPE = {
    FROM_BG: "FROM_BG",
    FROM_CONTENT: "FROM_CONTENT"
}

const EVENT_ACTION = {
    GPT_STREAM_PART: "GPT_STREAM_PART",
    GPT_STREAM_DONE: "GPT_STREAM_DONE",
    SEND_PROMPT: "SEND_PROMPT",
    GET_BROWSER_INFO: "GET_BROWSER_INFO",
    SSE_PART: "SSE_PART",
    SSE_DONE: "SSE_DONE",
    SSE_ERR: "SSE_DONE",
    GET_PROOF_TOKEN: "GET_PROOF_TOKEN"
}

/* -----------------------Event Listener----------------------- */
// Bắt và lưu token từ header Authorization
chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        const headers = details.requestHeaders;
        // console.log("onBeforeSendHeaders", details)

        if (details.initiator === BASE_CHATGPT_URL) {
            // if (details.url === `${BASE_CHATGPT_URL}/auth/logout`) {
            //     clearChatGptHeaders();
            // }
            return setChatGptHeaders(headers);
        }


    },
    { urls: [`${BASE_CHATGPT_URL}/*`] },
    ["requestHeaders"]
);

// chrome.webRequest.onBeforeRequest.addListener(
//     function (details) {
//         console.log("Intercepted:", details);
//         // Ví dụ chuyển hướng
//         if (details.url.includes("example.com")) {
//             return { redirectUrl: "https://google.com" };
//         }
//         return {}; // Không làm gì
//     },
//     { urls: [`${BASE_CHATGPT_URL}/*`] },
//     []
// );


chrome.runtime.onInstalled.addListener(async () => {
    cachedClientId = await initClientId();
    console.log("ClientId initialized:", cachedClientId);
});

chrome.runtime.onStartup.addListener(async () => {
    cachedClientId = await initClientId();
    console.log("ClientId ready on startup:", cachedClientId);
});

// Lắng nghe message từ content_script hoặc website a
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type != EVENT_TYPE.FROM_CONTENT) return;

    if (message.action === EVENT_ACTION.SEND_PROMPT) {
        sendConversation(message).then(result => {
            sendResponse(result);
        }).catch(error => {
            sendResponse({ error: error.message || error });
        });
        return true; // Giữ kênh async
    }
});

/* -----------------------End Event Listener----------------------- */

/* -----------------------Handle Send ChatGpt Function----------------------- */

async function sendConversation(message) {
    try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

        const stored = await getLocalStorageGptKeys();

        if (!stored.authorization || !stored.oaiClientVersion) {
            openOrFocusChatGPTTab();
            return { error: "Thiếu token hoặc headers. Đang mở ChatGPT để lấy lại..." };
        }

        const newMessageId = generateUUIDv4();
        const rawHeaders = getRequestHeader(stored.authorization);
        const headers = { ...rawHeaders, ...{ "Accept": "text/event-stream" } };
        headers["oai-client-version"] = stored.oaiClientVersion;

        if (stored.userAgent) headers["User-Agent"] = stored.userAgent;
        if (stored.oaiLanguage) headers["oai-language"] = stored.oaiLanguage;

        headers["oai-device-id"] = await getClientId();

        const chatRequirementsToken = await postChatRequirements(headers);
        headers["openai-sentinel-chat-requirements-token"] = chatRequirementsToken.token;

        const proofToken = await getProofToken(chatRequirementsToken.proofofwork.seed, chatRequirementsToken.proofofwork.difficulty);
        headers["openai-sentinel-proof-token"] = proofToken;

        const browserInfo = await getBrowserInfo();
        const payload = {
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

        const resContentType = conversationRes.headers.get('content-type');

        if (conversationRes.status !== 200) {
            let resJson = null;
            if (resContentType === "application/json") {
                resJson = await conversationRes.json();
            }

            chrome.tabs.sendMessage(activeTab.id, getSendMessageParams({
                action: EVENT_ACTION.SSE_PART,
                content: resJson?.detail
            }))
                .then(r => r)
                .catch((err) => {
                    console.log("SendMessage lỗi:", err);
                });

            return { success: false, error: resJson };
        }

        const reader = conversationRes.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let fullContent = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n\n");
            buffer = parts.pop(); // giữ phần chưa hoàn chỉnh

            for (const part of parts) {
                const lines = part.trim().split("\n");
                let eventType = null;
                let dataLines = [];

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

                    // console.log(JSON.stringify(json));

                    if (json.v?.message?.author?.role == "user") {
                        continue;
                    }

                    // console.log( typeof json.v);
                    // Lấy delta phần text, hỗ trợ các dạng khác nhau
                    let delta = null;
                    if (json.v?.message?.content?.parts?.length > 0) {
                        delta = json.v.message.content.parts[0];
                    } else if (typeof json.v === "string") {
                        delta = json.v;
                    } else if (json.p && json.o === "append" && typeof json.v === "string") {
                        delta = json.v;
                    } else if (json?.o === "patch" && typeof Array.isArray(json.v)) {
                        const jsonV = json.v[0];
                        if (jsonV.o === "append" && typeof jsonV.v === "string") {
                            delta = jsonV.v;
                        }
                    }

                    if (delta) {
                        fullContent += delta;

                        chrome.tabs.sendMessage(activeTab.id, getSendMessageParams({
                            action: EVENT_ACTION.SSE_PART,
                            content: delta,
                        }))
                            .then(r => r)
                            .catch((err) => {
                                console.log("SendMessage lỗi:", err);
                            });
                    }
                } catch (err) {
                    console.warn("Có lỗi xảy ra:", err);
                }
            }
        }

        // Gửi nội dung cuối cùng
        // await chrome.tabs.sendMessage(activeTab.id, getSendMessageParams( {
        //     action: EVENT_ACTION.SSE_DONE,
        // }));

        return { success: true };
    } catch (error) {
        console.log(error);
        return { error: error.message || error };
    }
}


// Hàm tạo hoặc focus tab chatgpt.com để lấy token mới
function openOrFocusChatGPTTab() {
    if (chatgptTabId !== null) {
        chrome.tabs.get(chatgptTabId, (tab) => {
            if (chrome.runtime.lastError || !tab) {
                createChatGPTTab();
            } else {
                chrome.tabs.reload(chatgptTabId);
                chrome.tabs.update(chatgptTabId, { active: false });
            }
        });
    } else {
        createChatGPTTab();
    }
}

async function postChatRequirements(headers) {
    // Lấy clientId từ đối tượng gt
    const clientId = await getClientId();

    // Gửi POST request với fetch method tự định nghĩa
    const response = await fetch(`${CHATGPT_BACKEND_API_URL}/sentinel/chat-requirements`, {
        method: "POST",
        headers: {
            ...headers,
            ...{ Accept: "application/json" },
            "Content-Type": "application/json",
            "oai-device-id": clientId
        },
        data: {
            conversationMode: {
                kind: "primary_assistant"
            }
        }
    });

    return response.json();
}
/* -----------------------End Handle Send ChatGpt Function----------------------- */

/* -----------------------ChatGpt Function----------------------- */
async function getLocalStorageGptKeys() {
    const items = await getLocalStorageSync(null);

    const filtered = {};
    for (const key in items) {
        if (key.startsWith(LOCAL_STORAGE_PREFIX.CHATGPT)) {
            const newKey = gptConvertStorageKey(key);
            filtered[newKey] = items[key];
        }
    }

    return filtered;
}

/**
 * 
 * @param {string} key 
 * @returns new key without prefix
 */
function gptConvertStorageKey(key) {
    return key.replace(LOCAL_STORAGE_PREFIX.CHATGPT + "_", "");
}

/**
 * 
 * @param {string} key 
 * @returns 
 */
async function getLocalStorageGptKey(key) {
    const storageKey = getChatGPTLocalStoragePrefixKey(key);
    const stored = await getLocalStorageSync(storageKey);

    return { [key]: stored[storageKey] };
}

/**
 * 
 * @param {string} key 
 * @returns return key with prefix
 */
function getChatGPTLocalStoragePrefixKey(key) {
    return LOCAL_STORAGE_PREFIX.CHATGPT + "_" + key;
}

function clearChatGptHeaders() {
    storageRemoveKeyPrefix(LOCAL_STORAGE_PREFIX.CHATGPT);
}

function setChatGptHeaders(headers) {
    const lowercased = h => h.name.toLowerCase();

    const wantedHeaders = [
        "authorization",
        "oai-client-version",
        "user-agent",
        "accept-language",
        "oai-language"
        // "openai-sentinel-turnstile-token"
    ];

    const dataToStore = {};

    headers.forEach(h => {
        const key = lowercased(h);
        if (wantedHeaders.includes(key)) {
            // Chuyển tên header về camelCase để lưu trữ nhất quán
            const storageKey = headerNameToStorageKey(h.name);
            dataToStore[getChatGPTLocalStoragePrefixKey(storageKey)] = h.value;
        }
    });

    if (Object.keys(dataToStore).length > 0) {
        chrome.storage.local.set(dataToStore);
    }

    return { requestHeaders: headers };
}

/* -----------------------End ChatGpt Function----------------------- */

/* -----------------------Chrome Functions----------------------- */
function createChatGPTTab() {
    chrome.tabs.create({ url: BASE_CHATGPT_URL, active: false }, (tab) => {
        chatgptTabId = tab.id;
    });
}
/* -----------------------End Chrome Functions----------------------- */

/* -----------------------LocalStorage Functions----------------------- */
async function getClientId() {
    const result = await getLocalStorageGptKey(LOCAL_STORAGE_KEYS.GPT_CLIENT_ID);
    return result.clientId || null;
}

async function setClientId(clientId) {
    await chrome.storage.local.set({ [getChatGPTLocalStoragePrefixKey(LOCAL_STORAGE_KEYS.GPT_CLIENT_ID)]: clientId });
    return clientId;
}

async function storageRemoveKeyPrefix(prefix) {
    const items = await chrome.storage.local.get();
    const keysToRemove = Object.keys(items).filter((key) => key.startsWith(prefix));

    if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
        console.log("Removed keys:", keysToRemove);
    } else {
        console.log("No keys matched the pattern.");
    }
}

/**
 * 
 * @param {string|null|string[]} key 
 * @returns 
 */
function getLocalStorageSync(key) {
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
/* -----------------------End LocalStorage Functions----------------------- */

/* -----------------------Util Functions----------------------- */
async function initClientId() {
    try {
        const existingClientId = await getClientId();

        if (existingClientId) {
            return existingClientId;
        }

        const newClientId = generateUUIDv4();
        await setClientId(newClientId);

        return newClientId;
    } catch (err) {
        throw err;
    }
}

function getProofToken(secret, difficulty) {
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
                resolve(""); // fallback nếu không tìm được tab
            }
        });
    });
}

/**
 * 
 * @param {string} bearerToken 
 * @returns 
 */
function getRequestHeader(bearerToken) {
    if (!bearerToken.startsWith("Bearer ")) {
        bearerToken = "Bearer " + bearerToken;
    }

    return {
        "Content-Type": "application/json",
        Authorization: `${bearerToken}`,
        "origin": BASE_CHATGPT_URL,
        "referer": `${BASE_CHATGPT_URL}/`
    }
}

function setOptionHeaderWithLocalStorage() {

}

async function sendMessageFromBG(tabId, params) {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, getSendMessageParams(params), (response) => {
            const err = chrome.runtime.lastError;
            if (err) {
                reject(err);
            } else {
                resolve(response);
            }
        });
    });
}

function getSendMessageParams(params) {
    return { type: EVENT_TYPE.FROM_BG, ...params };
}

/* -----------------------End Util Functions----------------------- */

/* -----------------------Helper Functions----------------------- */


function headerNameToStorageKey(headerName) {
    return headerName
        .toLowerCase()
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .replace(/ /g, '')
        .replace(/^\w/, c => c.toLowerCase());
}

// Tạo bảng hex từ 0-255 → ["00", "01", ..., "ff"]
const hexTable = Array.from({ length: 256 }, (_, i) =>
    (i + 256).toString(16).slice(1)
);

// Định dạng một mảng 16 byte thành chuỗi UUID
function formatUUID(bytes, offset = 0) {
    return (
        hexTable[bytes[offset + 0]] +
        hexTable[bytes[offset + 1]] +
        hexTable[bytes[offset + 2]] +
        hexTable[bytes[offset + 3]] + "-" +
        hexTable[bytes[offset + 4]] +
        hexTable[bytes[offset + 5]] + "-" +
        hexTable[bytes[offset + 6]] +
        hexTable[bytes[offset + 7]] + "-" +
        hexTable[bytes[offset + 8]] +
        hexTable[bytes[offset + 9]] + "-" +
        hexTable[bytes[offset + 10]] +
        hexTable[bytes[offset + 11]] +
        hexTable[bytes[offset + 12]] +
        hexTable[bytes[offset + 13]] +
        hexTable[bytes[offset + 14]] +
        hexTable[bytes[offset + 15]]
    );
}

// Sinh UUID v4 (giống `cie`)
function generateUUIDv4(options = {}, targetArray = null, offset = 0) {
    // Nếu hỗ trợ sẵn randomUUID thì dùng luôn (giống nhánh đầu tiên trong hàm gốc)
    if (crypto.randomUUID && !targetArray && !options) {
        return crypto.randomUUID();
    }

    // Lấy mảng byte 16 phần tử ngẫu nhiên
    const randomBytes = options.random || (options.rng || (() => {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return array;
    }))();

    // Đặt version và variant cho UUID v4
    randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40; // version 4
    randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80; // variant

    // Nếu cung cấp mảng để ghi UUID dưới dạng bytes
    if (targetArray) {
        for (let i = 0; i < 16; ++i) {
            targetArray[offset + i] = randomBytes[i];
        }
        return targetArray;
    }

    // Trả về chuỗi UUID
    return formatUUID(randomBytes);
}

/* -----------------------End Helper Functions----------------------- */

/* -----------------------Browser Function------------------------- */

/**
 * 
 * @returns { page_height: number, page_width: number, pixel_ratio: number, screen_height: number, screen_width: number}
 */
async function getBrowserInfo() {
    if (cachedBrowserInfo) {
        return cachedBrowserInfo;
    }

    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            // Sau 1 giây không có kết quả, trả về default
            cachedBrowserInfo = getDefaultBrowserInfo();
            resolve(cachedBrowserInfo);
        }, 1000);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError || !tabs.length) {
                clearTimeout(timer);
                cachedBrowserInfo = getDefaultBrowserInfo();
                return resolve(cachedBrowserInfo);
            }

            chrome.tabs.sendMessage(tabs[0].id, getSendMessageParams({ action: EVENT_ACTION.GET_BROWSER_INFO }), (response) => {
                clearTimeout(timer);
                if (chrome.runtime.lastError || !response) {
                    cachedBrowserInfo = getDefaultBrowserInfo();
                    return resolve(cachedBrowserInfo);
                }
                cachedBrowserInfo = response;
                resolve(response);
            });
        });
    });
}

/**
 * 
 * @returns { page_height: number, page_width: number, pixel_ratio: number, screen_height: number, screen_width: number}
 */
function getDefaultBrowserInfo() {
    return {
        page_height: 953,
        page_width: 1920,
        pixel_ratio: 1,
        screen_height: 1080,
        screen_width: 1920
    };
}
/* -----------------------End Browser Function------------------------- */