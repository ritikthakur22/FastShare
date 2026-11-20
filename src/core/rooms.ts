import { createStore } from './store';
import { ServerClientMessage } from '../protocol/server';
import { pushToast } from './notifications';

export interface PairedDevice {
  id: string;
  alias: string;
  secret: string;
  pairedAt: number;
}

export type PairState =
  | { phase: 'idle' }
  | { phase: 'waiting' }
  | { phase: 'showing'; pairKey: string; roomSecret: string }
  | { phase: 'paired'; id: string; alias: string }
  | { phase: 'error'; reason: 'invalid' | 'rate_limit' | 'offline' };

export type RoomState =
  | { phase: 'none' }
  | { phase: 'joining'; code: string }
  | { phase: 'in'; code: string }
  | { phase: 'error'; reason: 'invalid' | 'rate_limit' | 'offline' };

export const PAIR_KEY_REGEX = /^\d{6}$/;
export const ROOM_CODE_REGEX = /^[a-zA-Z0-9_-]{3,32}$/;

const STORAGE_SECRETS_KEY = 'fs.room_secrets';
const STORAGE_PAIRED_KEY = 'fs.paired_devices';
const SESSION_PUBLIC_ROOM_KEY = 'public_room_id';

function loadStoredSecrets(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_SECRETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((s) => typeof s === 'string' && s.length >= 32);
    }
  } catch {
    // ignore
  }
  return [];
}

function loadPairedDevices(): PairedDevice[] {
  try {
    const raw = localStorage.getItem(STORAGE_PAIRED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function persistPairedDevices(list: PairedDevice[]) {
  try {
    localStorage.setItem(STORAGE_PAIRED_KEY, JSON.stringify(list));
    const secrets = list.map((d) => d.secret);
    localStorage.setItem(STORAGE_SECRETS_KEY, JSON.stringify(secrets));
  } catch {
    // ignore
  }
}

export const pairStore = createStore<PairState>({ phase: 'idle' });
export const roomStore = createStore<RoomState>({ phase: 'none' });
export const pairedDevicesStore = createStore<PairedDevice[]>(loadPairedDevices());

let serverSend: ((data: unknown) => boolean) | null = null;

export function registerServerSender(sender: (data: unknown) => boolean) {
  serverSend = sender;
}

export function getStoredRoomSecrets(): string[] {
  const devices = pairedDevicesStore.get();
  const direct = loadStoredSecrets();
  const combined = Array.from(new Set([...devices.map((d) => d.secret), ...direct]));
  return combined;
}

export function startPairing() {
  if (!serverSend || !serverSend({ type: 'pair-device-initiate' })) {
    pairStore.set({ phase: 'error', reason: 'offline' });
    return;
  }
  pairStore.set({ phase: 'waiting' });
}

export function joinPairing(key: string) {
  const clean = key.replace(/\D/g, '');
  if (!PAIR_KEY_REGEX.test(clean)) {
    pairStore.set({ phase: 'error', reason: 'invalid' });
    return;
  }
  if (!serverSend || !serverSend({ type: 'pair-device-join', pairKey: clean })) {
    pairStore.set({ phase: 'error', reason: 'offline' });
    return;
  }
  pairStore.set({ phase: 'waiting' });
}

export function cancelPairing() {
  const cur = pairStore.get();
  if (cur.phase === 'showing') {
    serverSend?.({ type: 'pair-device-cancel' });
  }
  pairStore.set({ phase: 'idle' });
}

export function unpairDevice(deviceId: string) {
  const devices = pairedDevicesStore.get();
  const target = devices.find((d) => d.id === deviceId);
  if (target) {
    serverSend?.({ type: 'room-secrets-deleted', roomSecrets: [target.secret] });
  }
  const next = devices.filter((d) => d.id !== deviceId);
  pairedDevicesStore.set(next);
  persistPairedDevices(next);
}

export function createPublicRoom() {
  if (!serverSend || !serverSend({ type: 'create-public-room' })) {
    roomStore.set({ phase: 'error', reason: 'offline' });
    return;
  }
  roomStore.set({ phase: 'joining', code: '' });
}

export function joinPublicRoom(code: string) {
  const clean = code.trim().toLowerCase();
  if (!clean) return;
  if (!serverSend || !serverSend({ type: 'join-public-room', publicRoomId: clean, createIfInvalid: false })) {
    roomStore.set({ phase: 'error', reason: 'offline' });
    return;
  }
  try {
    sessionStorage.setItem(SESSION_PUBLIC_ROOM_KEY, clean);
  } catch {
    // ignore
  }
  roomStore.set({ phase: 'joining', code: clean });
}

export function leavePublicRoom() {
  serverSend?.({ type: 'leave-public-room' });
  try {
    sessionStorage.removeItem(SESSION_PUBLIC_ROOM_KEY);
  } catch {
    // ignore
  }
  roomStore.set({ phase: 'none' });
}

export function handleRoomServerMessage(msg: ServerClientMessage) {
  switch (msg.type) {
    case 'display-name': {
      // Rejoin all stored room secrets
      const secrets = getStoredRoomSecrets();
      if (secrets.length > 0) {
        serverSend?.({ type: 'room-secrets', roomSecrets: secrets });
      }
      // Rejoin public room if active
      try {
        const publicRoom = sessionStorage.getItem(SESSION_PUBLIC_ROOM_KEY);
        if (publicRoom) {
          serverSend?.({ type: 'join-public-room', publicRoomId: publicRoom, createIfInvalid: true });
          roomStore.set({ phase: 'in', code: publicRoom });
        }
      } catch {
        // ignore
      }
      break;
    }

    case 'pair-device-initiated':
      pairStore.set({
        phase: 'showing',
        pairKey: msg.pairKey,
        roomSecret: msg.roomSecret,
      });
      break;

    case 'pair-device-joined': {
      const alias = 'Paired Device';
      const newDevice: PairedDevice = {
        id: msg.peerId,
        alias,
        secret: msg.roomSecret,
        pairedAt: Date.now(),
      };
      const existing = pairedDevicesStore.get();
      const next = [newDevice, ...existing.filter((d) => d.secret !== msg.roomSecret && d.id !== msg.peerId)];
      pairedDevicesStore.set(next);
      persistPairedDevices(next);

      pairStore.set({
        phase: 'paired',
        id: msg.peerId,
        alias,
      });

      pushToast({
        type: 'info',
        title: 'Device Paired',
        message: 'Successfully paired! Devices will now connect across any Wi-Fi or internet.',
      });
      break;
    }

    case 'pair-device-join-key-invalid':
      pairStore.set({ phase: 'error', reason: 'invalid' });
      pushToast({
        type: 'error',
        title: 'Invalid Pair Code',
        message: 'The code is invalid or has expired. Please check and try again.',
      });
      break;

    case 'join-key-rate-limit':
      if (roomStore.get().phase === 'joining') {
        roomStore.set({ phase: 'error', reason: 'rate_limit' });
      } else {
        pairStore.set({ phase: 'error', reason: 'rate_limit' });
      }
      pushToast({
        type: 'warning',
        title: 'Rate Limit',
        message: 'Too many attempts. Please wait 10 seconds and try again.',
      });
      break;

    case 'pair-device-canceled':
      pairStore.set({ phase: 'idle' });
      break;

    case 'public-room-created':
      try {
        sessionStorage.setItem(SESSION_PUBLIC_ROOM_KEY, msg.roomId);
      } catch {
        // ignore
      }
      roomStore.set({ phase: 'in', code: msg.roomId });
      pushToast({
        type: 'info',
        title: 'Public Room Created',
        message: `Room code is ${msg.roomId.toUpperCase()}. Anyone with this code can connect.`,
      });
      break;

    case 'public-room-id-invalid':
      try {
        sessionStorage.removeItem(SESSION_PUBLIC_ROOM_KEY);
      } catch {
        // ignore
      }
      roomStore.set({ phase: 'error', reason: 'invalid' });
      pushToast({
        type: 'error',
        title: 'Room Not Found',
        message: 'No active public room was found with that code.',
      });
      break;

    case 'public-room-left':
      try {
        sessionStorage.removeItem(SESSION_PUBLIC_ROOM_KEY);
      } catch {
        // ignore
      }
      roomStore.set({ phase: 'none' });
      break;

    case 'secret-room-deleted':
      if (msg.roomSecret) {
        const next = pairedDevicesStore.get().filter((d) => d.secret !== msg.roomSecret);
        pairedDevicesStore.set(next);
        persistPairedDevices(next);
      }
      break;

    case 'room-secret-regenerated':
      if (msg.oldRoomSecret && msg.newRoomSecret) {
        const next = pairedDevicesStore.get().map((d) => {
          if (d.secret === msg.oldRoomSecret) {
            return { ...d, secret: msg.newRoomSecret! };
          }
          return d;
        });
        pairedDevicesStore.set(next);
        persistPairedDevices(next);
        serverSend?.({ type: 'room-secrets', roomSecrets: [msg.newRoomSecret] });
      }
      break;
  }
}
