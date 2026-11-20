// FastShare Text Codecs - Copyright (c) 2026 Ritik Thakur

export const MAX_TEXT_MESSAGE_BYTES = 64 * 1024; // 64 KiB

/**
 * Checks if text fits within data channel single-message limit.
 */
export function fitsInTextMessage(text: string): boolean {
  return new TextEncoder().encode(text).length <= MAX_TEXT_MESSAGE_BYTES;
}

/**
 * Extracts valid URLs from plain text safely (http/https only).
 */
export function extractSafeLinks(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"`{}|\\^]+/gi;
  const matches = text.match(urlRegex) ?? [];
  return matches.filter((u) => {
    try {
      const parsed = new URL(u);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  });
}
