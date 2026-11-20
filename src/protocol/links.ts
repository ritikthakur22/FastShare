export type EntryLink =
  | { type: 'pair'; key: string }
  | { type: 'room'; roomId: string };

/**
 * Parses URL query parameters (?pair_key=... or ?room_id=...) 
 * AND dynamic route paths (/pair/... or /room/...) for entry point actions.
 */
export function parseEntryLink(urlStr: string): EntryLink | null {
  try {
    const url = new URL(urlStr);

    // 1. Check Query Parameters
    const pairKey = url.searchParams.get('pair_key');
    if (pairKey && /^\d{6}$/.test(pairKey.trim())) {
      return { type: 'pair', key: pairKey.trim() };
    }

    const roomId = url.searchParams.get('room_id');
    if (roomId && /^[a-zA-Z0-9_-]{1,32}$/.test(roomId.trim())) {
      return { type: 'room', roomId: roomId.trim().toLowerCase() };
    }

    // 2. Check Dynamic Path Routes (/pair/NNNNNN or /room/xxxxx)
    const path = url.pathname.replace(/\/+$/, '');
    const pairPathMatch = path.match(/^\/pair\/(\d{6})$/i);
    if (pairPathMatch && pairPathMatch[1]) {
      return { type: 'pair', key: pairPathMatch[1] };
    }

    const roomPathMatch = path.match(/^\/room\/([a-zA-Z0-9_-]{1,32})$/i);
    if (roomPathMatch && roomPathMatch[1]) {
      return { type: 'room', roomId: roomPathMatch[1].toLowerCase() };
    }
  } catch {
    // invalid URL format
  }
  return null;
}
