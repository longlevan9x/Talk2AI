import { EVENT_TYPE, LOCAL_STORAGE_PREFIX } from "../../common/constant";

export function generateUUIDv4Str(options: { random?: Uint8Array; rng?: () => Uint8Array } = {},
    offset = 0): string {
    return generateUUIDv4(options, null, offset) as string;
}

export function generateUUIDv4(
    options: { random?: Uint8Array; rng?: () => Uint8Array } = {},
    targetArray: Uint8Array | null = null,
    offset = 0
): string | Uint8Array {
    if (crypto.randomUUID && !targetArray && !options.random && !options.rng) {
        return crypto.randomUUID();
    }

    const randomBytes = options.random || (options.rng || (() => {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return array;
    }))();

    randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40;
    randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80;

    if (targetArray) {
        for (let i = 0; i < 16; ++i) {
            targetArray[offset + i] = randomBytes[i];
        }
        return targetArray;
    }

    return formatUUID(randomBytes);
}

export function headerNameToStorageKey(headerName: string): string {
    return headerName
        .toLowerCase()
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .replace(/ /g, '')
        .replace(/^\w/, c => c.toLowerCase());
}

const hexTable: string[] = Array.from({ length: 256 }, (_, i) =>
    (i + 256).toString(16).slice(1)
);

export function formatUUID(bytes: Uint8Array, offset = 0): string {
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

export function getSendMessageParams(params: Record<string, any>): Record<string, any> {
    return { type: EVENT_TYPE.FROM_BG, ...params };
}

export function gptConvertStorageKey(key: string): string {
    return key.replace(`${LOCAL_STORAGE_PREFIX.CHATGPT}_`, "");
}

export function getChatGPTLocalStoragePrefixKey(key: string): string {
    return `${LOCAL_STORAGE_PREFIX.CHATGPT}_${key}`;
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}