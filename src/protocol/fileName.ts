// FastShare File Name Sanitizer - Copyright (c) 2026 Ritik Thakur

/**
 * Strips path separators, forbidden filesystem characters, control characters,
 * and direction-override / isolate characters (U+202A–U+202E, U+2066–U+2069).
 */
export function sanitizeFileName(rawName: string): string {
  if (!rawName || typeof rawName !== 'string') return 'file';

  // Extract basename from POSIX or Windows paths
  let name = rawName.split(/[/\\]/).pop() ?? '';

  // Remove control characters (0x00-0x1F, 0x7F-0x9F)
  name = name.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  // Remove direction-override and isolate characters
  // U+202A-U+202E: LRE, RLE, PDF, LRO, RLO
  // U+2066-U+2069: LRI, RLI, FSI, PDI
  name = name.replace(/[\u202A-\u202E\u2066-\u2069]/g, '');

  // Remove forbidden file system characters: : * ? " < > |
  name = name.replace(/[:*?"<>|]/g, '');

  // Remove leading dots
  name = name.replace(/^\.+/, '');

  // Normalize Unicode (NFC)
  try {
    name = name.normalize('NFC');
  } catch {
    // fallback if normalization fails
  }

  name = name.trim();

  // If empty after stripping, default to 'file'
  if (!name) return 'file';

  // Limit UTF-8 length to at most 200 bytes while preserving extension
  const encoder = new TextEncoder();
  if (encoder.encode(name).length > 200) {
    const extIndex = name.lastIndexOf('.');
    const ext = extIndex > 0 ? name.slice(extIndex) : '';
    const base = extIndex > 0 ? name.slice(0, extIndex) : name;

    let truncatedBase = base;
    while (encoder.encode(truncatedBase + ext).length > 200 && truncatedBase.length > 0) {
      truncatedBase = truncatedBase.slice(0, -1);
    }
    name = (truncatedBase || 'file') + ext;
  }

  return name;
}
