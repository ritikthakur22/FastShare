export type ChannelMessage =
  | { type: 'header'; name: string; size: number; mime?: string }
  | { type: 'partition'; offset: number }
  | { type: 'partition-received'; offset: number }
  | { type: 'progress'; progress: number }
  | { type: 'text'; text: string }
  | { type: 'display-name-changed'; displayName: string };

export function parseChannelMessage(raw: string): ChannelMessage | null {
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || typeof data.type !== 'string') {
      return null;
    }

    switch (data.type) {
      case 'header':
        if (typeof data.name === 'string' && typeof data.size === 'number') {
          return {
            type: 'header',
            name: data.name,
            size: data.size,
            mime: typeof data.mime === 'string' ? data.mime : undefined,
          };
        }
        return null;
      case 'partition':
        if (typeof data.offset === 'number') {
          return { type: 'partition', offset: data.offset };
        }
        return null;
      case 'partition-received':
        if (typeof data.offset === 'number') {
          return { type: 'partition-received', offset: data.offset };
        }
        return null;
      case 'progress':
        if (typeof data.progress === 'number') {
          return { type: 'progress', progress: data.progress };
        }
        return null;
      case 'text':
        if (typeof data.text === 'string') {
          return { type: 'text', text: data.text };
        }
        return null;
      case 'display-name-changed':
        if (typeof data.displayName === 'string') {
          return { type: 'display-name-changed', displayName: data.displayName };
        }
        return null;
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export function serializeChannelMessage(msg: ChannelMessage): string {
  return JSON.stringify(msg);
}
