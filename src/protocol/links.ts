export type EntryLink =
  | { type: 'pair'; key: string }
  | { type: 'room'; roomId: string };

/**
 * Parses URL query parameters for entry point actions (?pair_key=... or ?room_id=...)
 */
export function parseEntryLink(urlStr: string): EntryLink | null {
  try {
    const url = new URL(urlStr);
    const pairKey = url.searchParams.get('pair_key');
    if (pairKey && /^\d{6}$/.test(pairKey.trim())) {
      return { type: 'pair', key: pairKey.trim() };
    }

    const roomId = url.searchParams.get('room_id');
    if (roomId && /^[a-zA-Z0-9_-]{1,32}$/.test(roomId.trim())) {
      return { type: 'room', roomId: roomId.trim() };
    }
  } catch {
    // invalid URL format
  }
  return null;
}
