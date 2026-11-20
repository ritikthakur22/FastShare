import { createStore } from './store';
import { parseServerMessage, serializeServerMessage } from '../protocol/server';
import { setPeers, addPeer, removePeer } from './peers';
import { settingsStore } from './settings';

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
let signalHandlers: ((sender: string, message: unknown) => void)[] = [];

export function onSignal(handler: (sender: string, message: unknown) => void) {
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

  const { serverUrl, deviceName, deviceType } = settingsStore.get();
  signalingStore.update((s) => ({ ...s, connecting: true, error: null }));

  try {
    socket = new WebSocket(serverUrl);
  } catch (err) {
    signalingStore.update((s) => ({ ...s, connecting: false, error: 'Failed to connect' }));
    scheduleReconnect();
    return;
  }

  socket.onopen = () => {
    reconnectAttempts = 0;
    signalingStore.update((s) => ({ ...s, connected: true, connecting: false, error: null }));

    // Send join message
    const joinMsg = serializeServerMessage({
      type: 'join',
      name: {
        displayName: deviceName,
        deviceName: deviceType === 'auto' ? 'Browser' : deviceType,
      },
    });
    socket?.send(joinMsg);
  };

  socket.onmessage = (event) => {
    if (typeof event.data !== 'string') return;
    const msg = parseServerMessage(event.data);
    if (!msg) return;

    switch (msg.type) {
      case 'ping':
        socket?.send(serializeServerMessage({ type: 'pong' }));
        break;
      case 'peers':
        setPeers(msg.peers);
        break;
      case 'peer-joined':
        addPeer(msg.peer);
        break;
      case 'peer-left':
        removePeer(msg.peerId);
        break;
      case 'signal':
        for (const handler of signalHandlers) {
          handler(msg.sender, msg.message);
        }
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

export function sendSignal(toPeerId: string, message: unknown) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  const myId = signalingStore.get().peerId || 'self';
  socket.send(
    serializeServerMessage({
      type: 'signal',
      to: toPeerId,
      sender: myId,
      message,
    })
  );
}

export function refreshConnection() {
  if (socket) {
    try {
      socket.close();
    } catch {
      // ignore
    }
  }
  connectSignaling();
}

export function pairDevice(pairKey: string) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: 'pair-device', pairKey }));
}

export function joinRoom(roomId: string) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: 'join-room', roomId }));
}

export function leaveRoom(roomId: string) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: 'leave-room', roomId }));
}
