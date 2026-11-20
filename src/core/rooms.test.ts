import { describe, it, expect, beforeEach } from 'vitest';
import {
  pairStore,
  roomStore,
  pairedDevicesStore,
  registerServerSender,
  startPairing,
  joinPairing,
  cancelPairing,
  unpairDevice,
  createPublicRoom,
  joinPublicRoom,
  leavePublicRoom,
  handleRoomServerMessage,
  getStoredRoomSecrets,
} from './rooms';

describe('Rooms & Pairing Module (rooms.ts)', () => {
  let sentMessages: any[] = [];

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    sentMessages = [];
    registerServerSender((data) => {
      sentMessages.push(data);
      return true;
    });
    pairStore.set({ phase: 'idle' });
    roomStore.set({ phase: 'none' });
    pairedDevicesStore.set([]);
  });

  it('initiates pairing by sending pair-device-initiate', () => {
    startPairing();
    expect(sentMessages).toContainEqual({ type: 'pair-device-initiate' });
    expect(pairStore.get().phase).toBe('waiting');
  });

  it('joins pairing when valid key is provided', () => {
    joinPairing('654321');
    expect(sentMessages).toContainEqual({ type: 'pair-device-join', pairKey: '654321' });
    expect(pairStore.get().phase).toBe('waiting');
  });

  it('joins public room when valid room code is provided', () => {
    joinPublicRoom('XYZ99');
    expect(sentMessages).toContainEqual({
      type: 'join-public-room',
      publicRoomId: 'xyz99',
      createIfInvalid: false,
    });
    expect(roomStore.get().phase).toBe('joining');
  });

  it('updates state to showing when pair-device-initiated is received', () => {
    handleRoomServerMessage({
      type: 'pair-device-initiated',
      pairKey: '123456',
      roomSecret: 'secret_abc_123_456_789_000_111_222_333_444_555',
    });

    const s = pairStore.get();
    expect(s.phase).toBe('showing');
    if (s.phase === 'showing') {
      expect(s.pairKey).toBe('123456');
    }
  });

  it('cancels pairing when canceled', () => {
    handleRoomServerMessage({
      type: 'pair-device-initiated',
      pairKey: '123456',
      roomSecret: 'secret_abc_123_456_789_000_111_222_333_444_555',
    });

    cancelPairing();
    expect(sentMessages).toContainEqual({ type: 'pair-device-cancel' });
    expect(pairStore.get().phase).toBe('idle');
  });

  it('saves paired device and secret when pair-device-joined arrives', () => {
    handleRoomServerMessage({
      type: 'pair-device-joined',
      peerId: 'peer-uuid-999',
      roomSecret: 'secret_abc_123_456_789_000_111_222_333_444_555',
    });

    expect(pairStore.get().phase).toBe('paired');
    expect(pairedDevicesStore.get().length).toBe(1);
    expect(pairedDevicesStore.get()[0].id).toBe('peer-uuid-999');

    const secrets = getStoredRoomSecrets();
    expect(secrets).toContain('secret_abc_123_456_789_000_111_222_333_444_555');
  });

  it('handles invalid pairing code and rate limits', () => {
    handleRoomServerMessage({ type: 'pair-device-join-key-invalid' });
    expect(pairStore.get()).toEqual({ phase: 'error', reason: 'invalid' });

    handleRoomServerMessage({ type: 'join-key-rate-limit' });
    expect(pairStore.get()).toEqual({ phase: 'error', reason: 'rate_limit' });
  });

  it('handles public room creation, joining, and leaving', () => {
    createPublicRoom();
    expect(sentMessages).toContainEqual({ type: 'create-public-room' });
    expect(roomStore.get().phase).toBe('joining');

    handleRoomServerMessage({ type: 'public-room-created', roomId: 'abcde' });
    expect(roomStore.get()).toEqual({ phase: 'in', code: 'abcde' });
    expect(sessionStorage.getItem('public_room_id')).toBe('abcde');

    leavePublicRoom();
    expect(sentMessages).toContainEqual({ type: 'leave-public-room' });
    expect(roomStore.get().phase).toBe('none');
    expect(sessionStorage.getItem('public_room_id')).toBeNull();
  });

  it('unpairs device and notifies server', () => {
    handleRoomServerMessage({
      type: 'pair-device-joined',
      peerId: 'peer-uuid-1',
      roomSecret: 'secret_abc_123_456_789_000_111_222_333_444_555',
    });

    expect(pairedDevicesStore.get().length).toBe(1);

    unpairDevice('peer-uuid-1');
    expect(sentMessages).toContainEqual({
      type: 'room-secrets-deleted',
      roomSecrets: ['secret_abc_123_456_789_000_111_222_333_444_555'],
    });
    expect(pairedDevicesStore.get().length).toBe(0);
  });
});
