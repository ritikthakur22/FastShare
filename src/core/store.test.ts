import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from './store';
import { settingsStore, updateSettings } from './settings';
import { peersStore, setPeers, updatePeerState, removePeer } from './peers';
import { transfersStore, addTransferRecord, clearHistory } from './transfers';

describe('Reactive Stores', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('handles get, set, and subscriptions in createStore', () => {
    const store = createStore({ count: 0 });
    let observed = 0;
    const unsubscribe = store.subscribe((s) => {
      observed = s.count;
    });

    store.set({ count: 5 });
    expect(observed).toBe(5);
    expect(store.get().count).toBe(5);

    unsubscribe();
    store.set({ count: 10 });
    expect(observed).toBe(5); // Not called after unsubscribe
  });

  it('persists settings to localStorage and updates state', () => {
    updateSettings({ theme: 'light', deviceName: 'My MacBook' });
    const s = settingsStore.get();
    expect(s.theme).toBe('light');
    expect(s.deviceName).toBe('My MacBook');
    expect(localStorage.getItem('fs.theme')).toBe('light');
    expect(localStorage.getItem('fs.deviceName')).toBe('My MacBook');
  });

  it('manages discovered peers and updates connection status', () => {
    setPeers([
      {
        id: 'peer-abc',
        name: { displayName: 'Linux PC', deviceName: 'Chrome' },
        rtcSupported: true,
      },
    ]);

    expect(peersStore.get()['peer-abc']).toBeDefined();
    expect(peersStore.get()['peer-abc'].displayName).toBe('Linux PC');
    expect(peersStore.get()['peer-abc'].state).toBe('connecting');

    updatePeerState('peer-abc', 'connected');
    expect(peersStore.get()['peer-abc'].state).toBe('connected');

    removePeer('peer-abc');
    expect(peersStore.get()['peer-abc']).toBeUndefined();
  });

  it('tracks transfer activity and history', () => {
    clearHistory();
    expect(transfersStore.get().history.length).toBe(0);

    addTransferRecord({
      id: 'tx-1',
      peerId: 'peer-abc',
      peerName: 'Linux PC',
      direction: 'sent',
      name: 'wallpaper.jpg',
      size: 2400000,
      timestamp: Date.now(),
      status: 'completed',
    });

    const items = transfersStore.get().history;
    expect(items.length).toBe(1);
    expect(items[0].name).toBe('wallpaper.jpg');
    expect(items[0].direction).toBe('sent');
  });

  it('provides random names from the curated Nepali name list', async () => {
    const { RANDOM_ONE_WORD_NAMES, getRandomWordName, getDefaultDeviceName } = await import('./settings');
    expect(RANDOM_ONE_WORD_NAMES).toContain('Prince');
    expect(RANDOM_ONE_WORD_NAMES).toContain('Ritik');
    expect(RANDOM_ONE_WORD_NAMES).toContain('Richa');
    expect(RANDOM_ONE_WORD_NAMES).toContain('Bikash');
    expect(RANDOM_ONE_WORD_NAMES).toContain('Sneha');
    expect(RANDOM_ONE_WORD_NAMES).toContain('Sujan');

    const rand = getRandomWordName();
    expect(RANDOM_ONE_WORD_NAMES).toContain(rand);

    const def = getDefaultDeviceName();
    expect(RANDOM_ONE_WORD_NAMES).toContain(def);
  });
});
