import { EVENT_ACTION, EVENT_TYPE } from "../common/constant";
import { sendFromExtMessageToWebsite, generatePoWToken } from "./business";

export const startContent = (version: string) => {
    window.addEventListener("message", (event) => {
        if (event.source !== window) return;
        if (!event.data?.type || !event.data.action) return;
        if (event.data.type != EVENT_TYPE.FROM_PAGE) return;

        if (event.data.action === EVENT_ACTION.SEND_PROMPT) {
            try {
                // Lỗi khi reinstall extension. Thao tác gửi từ page thì bị lỗi -> Chưa fix được. 
                chrome.runtime.sendMessage(
                    { type: EVENT_TYPE.FROM_CONTENT, action: EVENT_ACTION.SEND_PROMPT, prompt: event.data.payload.prompt },
                    (response) => {
                        if (response.error) {
                            // console.error("Error from background:", response.error);
                            sendFromExtMessageToWebsite(EVENT_ACTION.GPT_STREAM_PART, { error: true, content: response.error });
                            return;
                        }

                        if (chrome.runtime.lastError) {
                            sendFromExtMessageToWebsite(EVENT_ACTION.EXT_LOST_CONNECTION);
                        } else {
                            // console.log("Phản hồi từ background:", response);
                        }
                    }
                );
            } catch (e) {
                // Đây là lỗi ném ra ngay khi context bị mất
                console.log("Lỗi gửi message đến background:", e);
                sendFromExtMessageToWebsite(EVENT_ACTION.EXT_LOST_CONNECTION);
            }
        }
        else if (event.data.action === EVENT_ACTION.EXT_CHECK) {
            sendFromExtMessageToWebsite(EVENT_ACTION.EXT_PRESENT, { version: version })
        }
    });

    /* -----------------------End Window Event Listener----------------------- */

    /* -----------------------Chrome Listener----------------------- */

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type !== EVENT_TYPE.FROM_BG) {
            sendResponse("Response from content");
            return true;
        }

        if (message.action === EVENT_ACTION.GET_PROOF_TOKEN) {
            generatePoWToken(message.params[0], message.params[1])
                .then(token => {
                    sendResponse(token);
                })
                .catch(error => {
                    console.error("Token generation error", error);
                    sendResponse(""); // fallback
                });

            // 🔥 PHẢI có dòng này để Chrome chờ promise
            return true;
        }

        if (message.action === EVENT_ACTION.GET_BROWSER_INFO) {
            const pageInfo = {
                page_height: document.documentElement.scrollHeight,
                page_width: document.documentElement.scrollWidth,
                pixel_ratio: window.devicePixelRatio,
                screen_height: window.screen.height,
                screen_width: window.screen.width,
            };

            sendResponse(pageInfo);
        }

        if (message.action === EVENT_ACTION.SSE_PART) {
            sendFromExtMessageToWebsite(EVENT_ACTION.GPT_STREAM_PART, {
                content: message.content
            });
            sendResponse(true);
        }

        if (message.action === EVENT_ACTION.SSE_DONE) {
            sendFromExtMessageToWebsite(EVENT_ACTION.GPT_STREAM_DONE, {
                content: message.content
            });
            sendResponse(true);
        }

        return true;
    });
}