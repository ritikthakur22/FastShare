export interface PeerDeviceName {
  displayName?: string;
  deviceName?: string;
}

export interface PeerInfo {
  id: string;
  name: PeerDeviceName;
  rtcSupported?: boolean;
}

export type ClientServerMessage =
  | { type: 'join'; name: PeerDeviceName; rooms?: string[] }
  | { type: 'signal'; to: string; sender: string; message: unknown }
  | { type: 'pong' }
  | { type: 'disconnect' };

export type ServerClientMessage =
  | { type: 'ws-config'; rtcConfiguration?: RTCConfiguration }
  | { type: 'peers'; peers: PeerInfo[] }
  | { type: 'peer-joined'; peer: PeerInfo }
  | { type: 'peer-left'; peerId: string; disconnect?: boolean }
  | { type: 'signal'; sender: string; message: unknown }
  | { type: 'ping' };

export function parseServerMessage(raw: string): ServerClientMessage | null {
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || typeof data.type !== 'string') {
      return null;
    }

    switch (data.type) {
      case 'ws-config':
        return { type: 'ws-config', rtcConfiguration: data.rtcConfiguration };
      case 'peers':
        if (Array.isArray(data.peers)) {
          return { type: 'peers', peers: data.peers };
        }
        return null;
      case 'peer-joined':
        if (data.peer && typeof data.peer.id === 'string') {
          return { type: 'peer-joined', peer: data.peer };
        }
        return null;
      case 'peer-left':
        if (typeof data.peerId === 'string') {
          return { type: 'peer-left', peerId: data.peerId, disconnect: Boolean(data.disconnect) };
        }
        return null;
      case 'signal':
        if (typeof data.sender === 'string') {
          return { type: 'signal', sender: data.sender, message: data.message };
        }
        return null;
      case 'ping':
        return { type: 'ping' };
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export function serializeServerMessage(msg: ClientServerMessage): string {
  return JSON.stringify(msg);
}
