import LZString from "lz-string";

export function compressState(state: string): string {
    try {
        return LZString.compressToEncodedURIComponent(state);
    } catch (e) {
        console.error("Failed to compress state", e);
        return "";
    }
}

export function decompressState(compressed: string): string {
    try {
        return LZString.decompressFromEncodedURIComponent(compressed) || "";
    } catch (e) {
        console.error("Failed to decompress state", e);
        return "";
    }
}

export function getShareUrl(state: string): string {
    if (typeof window === "undefined") return "";
    const compressed = compressState(state);
    const url = new URL(window.location.href);
    url.searchParams.set("s", compressed);
    return url.toString();
}
