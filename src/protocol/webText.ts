// The website sends text as base64 of its UTF-8 bytes (docs/TRANSFER_PROTOCOL.md "Online protocol").
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export const MAX_TEXT_MESSAGE_BYTES = 64 * 1024; // 64 KiB

function utf8(text: string): number[] {
  const out: number[] = [];
  for (const ch of text) {
    let c = ch.codePointAt(0) ?? 0;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else {
      out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      c = 0;
    }
  }
  return out;
}

function fromUtf8(bytes: number[]): string {
  let out = '';
  for (let i = 0; i < bytes.length;) {
    const b = bytes[i] ?? 0;
    const need = b < 0x80 ? 0 : b >= 0xf0 ? 3 : b >= 0xe0 ? 2 : b >= 0xc0 ? 1 : -1;
    if (need < 0 || i + need >= bytes.length + (need === 0 ? 1 : 0)) {
      out += '';
      i++;
      continue;
    }
    let c = need === 0 ? b : b & (0x3f >> need);
    for (let k = 1; k <= need; k++) c = (c << 6) | ((bytes[i + k] ?? 0) & 63);
    out += String.fromCodePoint(c);
    i += need + 1;
  }
  return out;
}

/**
 * Encodes plain text as base64 of UTF-8 bytes for WebRTC data-channel text frames.
 */
export function encodeWebText(text: string): string {
  const bytes = utf8(text);
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const [a = 0, b = 0, c = 0] = [bytes[i], bytes[i + 1], bytes[i + 2]];
    const n = (a << 16) | (b << 8) | c;
    out += ALPHABET[n >> 18]! + ALPHABET[(n >> 12) & 63]!;
    out += i + 1 < bytes.length ? ALPHABET[(n >> 6) & 63]! : '=';
    out += i + 2 < bytes.length ? ALPHABET[n & 63]! : '=';
  }
  return out;
}

/**
 * Decodes base64-encoded UTF-8 text from WebRTC data-channel text frames.
 * Returns null if the string is not valid base64.
 */
export function decodeWebText(b64: string): string | null {
  const clean = b64.replace(/=+$/, '');
  if (!/^[A-Za-z0-9+/]*$/.test(clean) || clean.length % 4 === 1) return null;
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of clean) {
    buffer = (buffer << 6) | ALPHABET.indexOf(ch);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return fromUtf8(bytes);
}

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
