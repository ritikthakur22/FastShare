export interface PeerDeviceName {
  displayName?: string;
  deviceName?: string;
  model?: string;
  os?: string;
  browser?: string;
  type?: string;
}

export interface PeerInfo {
  id: string;
  name?: PeerDeviceName;
  rtcSupported?: boolean;
}

export type ServerClientMessage =
  | {
      type: 'ws-config';
      wsConfig?: {
        rtcConfig?: RTCConfiguration;
        wsFallback?: boolean;
      };
    }
  | {
      type: 'display-name';
      displayName?: string;
      deviceName?: string;
      peerId: string;
      peerIdHash: string;
    }
  | {
      type: 'peers';
      peers: PeerInfo[];
      roomType?: string;
      roomId?: string;
    }
  | {
      type: 'peer-joined';
      peer: PeerInfo;
      roomType?: string;
      roomId?: string;
    }
  | {
      type: 'peer-left';
      peerId: string;
      roomType?: string;
      roomId?: string;
      disconnect?: boolean;
    }
  | {
      type: 'signal';
      sender: { id: string; rtcSupported?: boolean } | string;
      sdp?: RTCSessionDescriptionInit;
      ice?: RTCIceCandidateInit;
      candidate?: RTCIceCandidateInit;
      message?: unknown;
    }
  | {
      type: 'pair-device-initiated';
      pairKey: string;
      roomSecret: string;
    }
  | {
      type: 'pair-device-joined';
      peerId: string;
      roomSecret: string;
    }
  | {
      type: 'pair-device-canceled';
      pairKey?: string;
    }
  | {
      type: 'public-room-created';
      roomId: string;
    }
  | {
      type: 'public-room-left';
    }
  | {
      type: 'ping';
    };

export function parseServerMessage(raw: string): ServerClientMessage | null {
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || typeof data.type !== 'string') {
      return null;
    }

    switch (data.type) {
      case 'ws-config':
        return {
          type: 'ws-config',
          wsConfig: data.wsConfig,
        };
      case 'display-name':
        if (typeof data.peerId === 'string') {
          return {
            type: 'display-name',
            displayName: typeof data.displayName === 'string' ? data.displayName : undefined,
            deviceName: typeof data.deviceName === 'string' ? data.deviceName : undefined,
            peerId: data.peerId,
            peerIdHash: typeof data.peerIdHash === 'string' ? data.peerIdHash : '',
          };
        }
        return null;
      case 'peers':
        if (Array.isArray(data.peers)) {
          return {
            type: 'peers',
            peers: data.peers,
            roomType: typeof data.roomType === 'string' ? data.roomType : undefined,
            roomId: typeof data.roomId === 'string' ? data.roomId : undefined,
          };
        }
        return null;
      case 'peer-joined':
        if (data.peer && typeof data.peer.id === 'string') {
          return {
            type: 'peer-joined',
            peer: data.peer,
            roomType: typeof data.roomType === 'string' ? data.roomType : undefined,
            roomId: typeof data.roomId === 'string' ? data.roomId : undefined,
          };
        }
        return null;
      case 'peer-left':
        if (typeof data.peerId === 'string') {
          return {
            type: 'peer-left',
            peerId: data.peerId,
            roomType: typeof data.roomType === 'string' ? data.roomType : undefined,
            roomId: typeof data.roomId === 'string' ? data.roomId : undefined,
            disconnect: Boolean(data.disconnect),
          };
        }
        return null;
      case 'signal':
        return {
          type: 'signal',
          sender: data.sender,
          sdp: data.sdp,
          ice: data.ice,
          candidate: data.candidate,
          message: data.message,
        };
      case 'pair-device-initiated':
        return {
          type: 'pair-device-initiated',
          pairKey: String(data.pairKey),
          roomSecret: String(data.roomSecret),
        };
      case 'pair-device-joined':
        return {
          type: 'pair-device-joined',
          peerId: String(data.peerId),
          roomSecret: String(data.roomSecret),
        };
      case 'pair-device-canceled':
        return {
          type: 'pair-device-canceled',
          pairKey: data.pairKey,
        };
      case 'public-room-created':
        return {
          type: 'public-room-created',
          roomId: String(data.roomId),
        };
      case 'public-room-left':
        return {
          type: 'public-room-left',
        };
      case 'ping':
        return { type: 'ping' };
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export function serializeServerMessage(msg: unknown): string {
  return JSON.stringify(msg);
}
