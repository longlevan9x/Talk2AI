import { sha3_512 } from "js-sha3";
import { EVENT_TYPE } from "../constant";


export function sendFromExtMessageToWebsite(action: string, payload?: any) {
  const data = {
    type: EVENT_TYPE.FROM_EXTENSION,
    action: action,
    payload: payload
  };

  window.postMessage(data, "*");
}

export function generateFingerprint() {
  return [navigator.hardwareConcurrency + screen.width + screen.height, new Date().toString(), 4294705152, 0, navigator.userAgent];
}

export async function generatePoWToken(secret: string, difficulty: string) {
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