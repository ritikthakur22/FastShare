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
}

export type PeersMap = Record<string, DiscoveredPeer>;

export const peersStore = createStore<PeersMap>({});

export function setPeers(peerList: PeerInfo[]) {
  peersStore.update((curr) => {
    const next: PeersMap = { ...curr };
    for (const p of peerList) {
      if (!next[p.id]) {
        next[p.id] = {
          id: p.id,
          displayName: p.name?.displayName || 'Nearby Device',
          deviceName: p.name?.deviceName || 'Peer',
          state: 'connecting',
          ipNetwork: true,
          lastSeen: Date.now(),
        };
      }
    }
    return next;
  });
}

export function addPeer(peer: PeerInfo) {
  peersStore.update((curr) => ({
    ...curr,
    [peer.id]: {
      id: peer.id,
      displayName: peer.name?.displayName || 'Nearby Device',
      deviceName: peer.name?.deviceName || 'Peer',
      state: 'connecting',
      ipNetwork: true,
      lastSeen: Date.now(),
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
