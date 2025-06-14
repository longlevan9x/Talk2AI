console.log("Content script loaded");
const VERSION = "1.0.1";

const EVENT_TYPE = {
  FROM_PAGE: "FROM_PAGE",
  FROM_EXTENSION: "FROM_EXTENSION",
  FROM_BG: "FROM_BG",
  FROM_CONTENT: "FROM_CONTENT"
}

const EVENT_ACTION = {
  // Website Action
  EXT_LOST_CONNECTION: "EXT_LOST_CONNECTION",
  EXT_CHECK: "EXT_CHECK",
  EXT_PRESENT: "EXT_PRESENT",

  // Content Action 
  SEND_PROMPT: "SEND_PROMPT",

  //BG Action 
  GET_PROOF_TOKEN: "GET_PROOF_TOKEN",
  GET_BROWSER_INFO: "GET_BROWSER_INFO",
  SSE_PART: "SSE_PART",
  SSE_DONE: "SSE_DONE",
  GPT_STREAM_PART: "GPT_STREAM_PART",
  GPT_STREAM_DONE: "GPT_STREAM_DONE",
}

/* -----------------------Event Listener----------------------- */
/* -----------------------Window Event Listener----------------------- */
// Lắng nghe message từ website a gửi vào
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
          if (chrome.runtime.lastError) {
            sendFromExtMessageToWebsite(EVENT_ACTION.EXT_LOST_CONNECTION);
          } else {
            console.log("Phản hồi từ background:", response);
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
    sendFromExtMessageToWebsite(EVENT_ACTION.EXT_PRESENT, { version: VERSION })
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
/* -----------------------End Chrome Listener----------------------- */

/* -----------------------End Event Listener----------------------- */

/* -----------------------Util Functions----------------------- */
function sendFromExtMessageToWebsite(action, payload) {
  const data = {
    type: EVENT_TYPE.FROM_EXTENSION,
    action: action,
    payload: payload
  };

  window.postMessage(data, "*");
}

function generateFingerprint() {
  return [navigator.hardwareConcurrency + screen.width + screen.height, new Date().toString(), 4294705152, 0, navigator.userAgent];
}

async function generatePoWToken(secret, difficulty) {
  let u = generateFingerprint();

  for (let p = 0; p < 100000; p++) {
    u[3] = p;
    let y = JSON.stringify(u);
    let yBytes = new TextEncoder().encode(y);
    let S = btoa(String.fromCharCode(...yBytes));

    let hash = sha3_512(secret + S);

    if (hash.slice(0, difficulty.length) <= difficulty) {
      return `gAAAAAB${S}`;
    }
  }

  return `gAAAAABwQ8Lk5FbGpA2NcR9dShT6gYjU7VxZ4D${btoa(secret)}`;
}
/* -----------------------End Util Functions----------------------- */