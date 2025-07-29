import { IBrowserInfo } from "../types/background";

let cachedBrowserInfo: IBrowserInfo | null = null;
let chatgptTabId: number | null = null;
let cachedClientId: string | null = null;

export function getCachedBrowserInfo(): IBrowserInfo | null {
  return cachedBrowserInfo;
}

export function setCachedBrowserInfo(info: IBrowserInfo | null): void {
  cachedBrowserInfo = info;
}

export function getChatgptTabId(): number | null {
  return chatgptTabId;
}

export function setChatgptTabId(id: number | null): void {
  chatgptTabId = id;
}

export function getCachedClientId(): string | null {
  return cachedClientId;
}
export function setCachedClientId(id: string | null): void {
  cachedClientId = id;
}