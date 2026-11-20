import { createStore } from './store';
import { parseServerMessage } from '../protocol/server';
import { setPeers, addPeer, removePeer, peersStore } from './peers';
import { settingsStore, DEFAULT_SERVER_URL } from './settings';
import { setRtcConfig, connectToPeer, createPeerConnection, closePeerConnection } from './rtc';
import {
  registerServerSender,
  handleRoomServerMessage,
  startPairing,
  joinPairing,
  cancelPairing,
  createPublicRoom,
  joinPublicRoom,
  leavePublicRoom,
} from './rooms';

export interface SignalingState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  peerId: string | null;
}

export const signalingStore = createStore<SignalingState>({
  connected: false,
  connecting: false,
  error: null,
  peerId: null,
});

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
let signalHandlers: ((sender: string, message: { sdp?: RTCSessionDescriptionInit; ice?: RTCIceCandidateInit; candidate?: RTCIceCandidateInit }) => void)[] = [];
let myPeerId: string | null = null;

registerServerSender((data: unknown) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
    return true;
  }
  return false;
});

export function onSignal(
  handler: (sender: string, message: { sdp?: RTCSessionDescriptionInit; ice?: RTCIceCandidateInit; candidate?: RTCIceCandidateInit }) => void
) {
  signalHandlers.push(handler);
  return () => {
    signalHandlers = signalHandlers.filter((h) => h !== handler);
  };
}

export function connectSignaling() {
  if (typeof window === 'undefined') return;
  if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) {
    return;
  }

  const { serverUrl, deviceType } = settingsStore.get();
  signalingStore.update((s) => ({ ...s, connecting: true, error: null }));

  try {
    const base = serverUrl || DEFAULT_SERVER_URL;
    const url = new URL(base);
    url.searchParams.set('webrtc_supported', 'true');

    const storedPeerId = sessionStorage.getItem('peer_id');
    const storedPeerIdHash = sessionStorage.getItem('peer_id_hash');
    if (storedPeerId && storedPeerIdHash) {
      url.searchParams.set('peer_id', storedPeerId);
      url.searchParams.set('peer_id_hash', storedPeerIdHash);
    }

    if (deviceType === 'phone') {
      url.searchParams.set('device_icon', 'phone-iphone');
    } else if (deviceType === 'desktop') {
      url.searchParams.set('device_icon', 'desktop-mac');
    }

    socket = new WebSocket(url.toString());
  } catch {
    signalingStore.update((s) => ({ ...s, connecting: false, error: 'Failed to connect' }));
    scheduleReconnect();
    return;
  }

  socket.onopen = () => {
    reconnectAttempts = 0;
    signalingStore.update((s) => ({ ...s, connected: true, connecting: false, error: null }));
  };

  socket.onmessage = (event) => {
    if (typeof event.data !== 'string') return;
    const msg = parseServerMessage(event.data);
    if (!msg) return;

    switch (msg.type) {
      case 'ping':
        socket?.send(JSON.stringify({ type: 'pong' }));
        break;

      case 'ws-config':
        if (msg.wsConfig?.rtcConfig) {
          setRtcConfig(msg.wsConfig.rtcConfig);
        }
        break;

      case 'display-name': {
        myPeerId = msg.peerId;
        try {
          sessionStorage.setItem('peer_id', msg.peerId);
          sessionStorage.setItem('peer_id_hash', msg.peerIdHash);
        } catch {
          // ignore
        }
        signalingStore.update((s) => ({
          ...s,
          peerId: msg.peerId,
          connected: true,
          connecting: false,
        }));

        // Join the IP room (nearby Wi-Fi devices)
        socket?.send(JSON.stringify({ type: 'join-ip-room' }));
        handleRoomServerMessage(msg);
        break;
      }

      case 'peers': {
        const peers = (msg.peers || []).filter((p) => p.id !== myPeerId && p.rtcSupported !== false);
        setPeers(peers, msg.roomType || 'ip', msg.roomId);

        // We are the caller for every peer announced in 'peers'
        for (const p of peers) {
          connectToPeer(p.id, msg.roomType || 'ip', msg.roomId);
        }
        break;
      }

      case 'peer-joined': {
        if (msg.peer && msg.peer.id !== myPeerId && msg.peer.rtcSupported !== false) {
          addPeer(msg.peer, msg.roomType || 'ip', msg.roomId);
          createPeerConnection(msg.peer.id, msg.roomType || 'ip', msg.roomId);
        }
        break;
      }

      case 'peer-left': {
        removePeer(msg.peerId);
        closePeerConnection(msg.peerId);
        break;
      }

      case 'signal': {
        const senderId = typeof msg.sender === 'object' ? msg.sender.id : msg.sender;
        if (senderId && senderId !== myPeerId) {
          for (const handler of signalHandlers) {
            handler(senderId, {
              sdp: msg.sdp,
              candidate: msg.candidate || msg.ice,
              ice: msg.ice || msg.candidate,
            });
          }
        }
        break;
      }

      case 'pair-device-initiated':
      case 'pair-device-joined':
      case 'pair-device-join-key-invalid':
      case 'pair-device-canceled':
      case 'join-key-rate-limit':
      case 'public-room-created':
      case 'public-room-id-invalid':
      case 'public-room-left':
      case 'secret-room-deleted':
      case 'room-secret-regenerated':
        handleRoomServerMessage(msg);
        break;
    }
  };

  socket.onclose = () => {
    signalingStore.update((s) => ({ ...s, connected: false, connecting: false }));
    scheduleReconnect();
  };

  socket.onerror = () => {
    signalingStore.update((s) => ({ ...s, connected: false, connecting: false }));
  };
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  const backoff = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 15000);
  reconnectAttempts++;
  reconnectTimer = setTimeout(() => {
    connectSignaling();
  }, backoff);
}

export function sendSignal(
  toPeerId: string,
  signalData: { sdp?: unknown; candidate?: unknown; ice?: unknown },
  roomType?: string,
  roomId?: string
) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  const peer = peersStore.get()[toPeerId];
  const targetRoomType = roomType || peer?.roomType || 'ip';
  const targetRoomId = roomId || peer?.roomId;

  const payload: Record<string, unknown> = {
    type: 'signal',
    to: toPeerId,
    roomType: targetRoomType,
  };
  if (targetRoomId) payload.roomId = targetRoomId;
  if (signalData.sdp) payload.sdp = signalData.sdp;
  if (signalData.candidate) {
    payload.candidate = signalData.candidate;
    payload.ice = signalData.candidate;
  }
  if (signalData.ice) {
    payload.ice = signalData.ice;
    payload.candidate = signalData.ice;
  }

  socket.send(JSON.stringify(payload));
}

export function refreshConnection() {
  if (socket) {
    try {
      socket.close();
    } catch {
      // ignore
    }
    socket = null;
  }
  connectSignaling();
}

export function pairDeviceInitiate() {
  startPairing();
}

export function pairDeviceJoin(pairKey: string) {
  joinPairing(pairKey);
}

export function pairDeviceCancel() {
  cancelPairing();
}

export {
  createPublicRoom,
  joinPublicRoom,
  leavePublicRoom,
};

export const pairDevice = pairDeviceJoin;
export const joinRoom = joinPublicRoom;
export const leaveRoom = leavePublicRoom;
