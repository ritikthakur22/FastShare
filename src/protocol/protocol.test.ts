import { describe, it, expect } from 'vitest';
import { sanitizeFileName } from './fileName';
import { formatBytes } from './format';
import { generateConnectionCode } from './connectionCode';
import { parseEntryLink } from './links';
import { parseServerMessage, serializeServerMessage } from './server';
import { parseChannelMessage, serializeChannelMessage } from './channel';
import { encodeWebText, decodeWebText } from './webText';

describe('Protocol Codecs & Sanitization', () => {
  it('sanitizes file names safely, stripping directory traversal and direction-override characters', () => {
    // Normal file
    expect(sanitizeFileName('report.pdf')).toBe('report.pdf');

    // Directory traversal & slashes
    expect(sanitizeFileName('../../../etc/passwd')).toBe('passwd');
    expect(sanitizeFileName('C:\\Windows\\system32\\calc.exe')).toBe('calc.exe');

    // Direction-override characters (U+202E RTL override)
    expect(sanitizeFileName('test\u202Efdp.exe')).toBe('testfdp.exe');

    // Leading dots
    expect(sanitizeFileName('...hidden')).toBe('hidden');

    // Empty fallback
    expect(sanitizeFileName('')).toBe('file');
  });

  it('formats byte sizes into readable units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1572864)).toBe('1.5 MB');
    expect(formatBytes(2147483648)).toBe('2.0 GB');
  });

  it('generates consistent connection codes for peer pairs', () => {
    const code1 = generateConnectionCode('peer-alpha', 'peer-beta');
    const code2 = generateConnectionCode('peer-beta', 'peer-alpha');
    expect(code1).toBe(code2);
    expect(code1).toMatch(/^\d{4,6}$/);
  });

  it('encodes and decodes UTF-8 text messages to base64 for wire compatibility', () => {
    const original = 'Hello World! 🚀 fastshare text test with emoji & unicode: नेपाली';
    const encoded = encodeWebText(original);
    expect(encoded).not.toBe(original);
    expect(/^[A-Za-z0-9+/=]+$/.test(encoded)).toBe(true);

    const decoded = decodeWebText(encoded);
    expect(decoded).toBe(original);
  });

  it('parses URL query parameters and dynamic routes for pair_key and room_id', () => {
    // Query parameters
    expect(parseEntryLink('https://fastshare.ritikthakur.com.np/?pair_key=123456')).toEqual({
      type: 'pair',
      key: '123456',
    });

    expect(parseEntryLink('https://fastshare.ritikthakur.com.np/?room_id=testroom')).toEqual({
      type: 'room',
      roomId: 'testroom',
    });

    // Dynamic paths
    expect(parseEntryLink('https://fastshare.ritikthakur.com.np/pair/123456')).toEqual({
      type: 'pair',
      key: '123456',
    });

    expect(parseEntryLink('https://fastshare.ritikthakur.com.np/room/myroom')).toEqual({
      type: 'room',
      roomId: 'myroom',
    });

    expect(parseEntryLink('https://fastshare.ritikthakur.com.np/')).toBeNull();
  });

  it('validates and parses signaling server messages', () => {
    const validPeers = JSON.stringify({
      type: 'peers',
      peers: [
        {
          id: 'peer-1',
          name: { displayName: 'Pixel 8', deviceName: 'Android' },
          rtcSupported: true,
        },
      ],
    });
    const parsed = parseServerMessage(validPeers);
    expect(parsed?.type).toBe('peers');

    const joinMsg = serializeServerMessage({
      type: 'join',
      name: { displayName: 'Redmi Note 9', deviceName: 'Phone' },
    });
    expect(joinMsg).toContain('"type":"join"');
  });

  it('validates data channel messages', () => {
    const headerMsg = JSON.stringify({
      type: 'header',
      name: 'notes.txt',
      size: 1024,
      mime: 'text/plain',
    });
    const parsed = parseChannelMessage(headerMsg);
    expect(parsed?.type).toBe('header');

    const serialized = serializeChannelMessage({
      type: 'text',
      text: 'hello',
    });
    expect(serialized).toContain('"type":"text"');
  });
});
