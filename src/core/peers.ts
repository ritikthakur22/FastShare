import { createStore } from './store';
import { PeerInfo } from '../protocol/server';

export type PeerConnectionState = 'connecting' | 'connected' | 'transferring' | 'done' | 'failed' | 'disconnected';

export interface DiscoveredPeer {
  id: string;
  displayName: string;
  deviceName: string;
  state: PeerConnectionState;
  paired?: boolean;
  publicRoom?: boolean;
  ipNetwork?: boolean;
  lastSeen: number;
  roomType?: string;
  roomId?: string;
}

export type PeersMap = Record<string, DiscoveredPeer>;

export const peersStore = createStore<PeersMap>({});

export function setPeers(peerList: PeerInfo[], roomType = 'ip', roomId?: string) {
  peersStore.update((curr) => {
    const next: PeersMap = { ...curr };
    for (const p of peerList) {
      if (!p.id) continue;
      const isIp = roomType === 'ip';
      const isSecret = roomType === 'secret';
      const isPublic = roomType === 'public-id';

      const displayName = p.name?.displayName || p.name?.deviceName || 'Nearby Device';
      const deviceName = p.name?.deviceName || p.name?.model || p.name?.os || 'Device';

      next[p.id] = {
        id: p.id,
        displayName,
        deviceName,
        state: next[p.id]?.state || 'connecting',
        ipNetwork: isIp,
        paired: isSecret,
        publicRoom: isPublic,
        lastSeen: Date.now(),
        roomType,
        roomId,
      };
    }
    return next;
  });
}

export function addPeer(peer: PeerInfo, roomType = 'ip', roomId?: string) {
  if (!peer.id) return;
  const isIp = roomType === 'ip';
  const isSecret = roomType === 'secret';
  const isPublic = roomType === 'public-id';

  const displayName = peer.name?.displayName || peer.name?.deviceName || 'Nearby Device';
  const deviceName = peer.name?.deviceName || peer.name?.model || peer.name?.os || 'Device';

  peersStore.update((curr) => ({
    ...curr,
    [peer.id]: {
      id: peer.id,
      displayName,
      deviceName,
      state: curr[peer.id]?.state || 'connecting',
      ipNetwork: isIp,
      paired: isSecret,
      publicRoom: isPublic,
      lastSeen: Date.now(),
      roomType,
      roomId,
    },
  }));
}

export function updatePeerState(peerId: string, state: PeerConnectionState) {
  peersStore.update((curr) => {
    if (!curr[peerId]) return curr;
    return {
      ...curr,
      [peerId]: {
        ...curr[peerId],
        state,
        lastSeen: Date.now(),
      },
    };
  });
}

export function updatePeerName(peerId: string, displayName: string) {
  peersStore.update((curr) => {
    if (!curr[peerId]) return curr;
    return {
      ...curr,
      [peerId]: {
        ...curr[peerId],
        displayName,
        lastSeen: Date.now(),
      },
    };
  });
}

export function removePeer(peerId: string) {
  peersStore.update((curr) => {
    const next = { ...curr };
    delete next[peerId];
    return next;
  });
}
