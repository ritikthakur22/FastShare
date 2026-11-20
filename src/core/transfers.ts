import { createStore } from './store';

export type TransferDirection = 'sent' | 'received';
export type TransferStatus = 'transferring' | 'completed' | 'failed' | 'cancelled';

export interface TransferRecord {
  id: string;
  peerId: string;
  peerName: string;
  direction: TransferDirection;
  name: string;
  size: number;
  timestamp: number;
  status: TransferStatus;
  progress?: number; // 0 to 1
  speed?: number; // bytes/sec
}

export interface TransfersState {
  active: Record<string, TransferRecord>;
  history: TransferRecord[];
}

function loadHistory(): TransferRecord[] {
  try {
    const raw = localStorage.getItem('fs.history');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.slice(0, 100);
    }
  } catch {
    // fallback
  }

  // Initial seed demo history matching the UI showcase if empty
  return [
    {
      id: 'seed-1',
      peerId: 'p-1',
      peerName: 'Lenovo Laptop',
      direction: 'sent',
      name: 'wallpaper.jpg',
      size: 2400000,
      timestamp: Date.now() - 2 * 60 * 1000,
      status: 'completed',
    },
    {
      id: 'seed-2',
      peerId: 'p-2',
      peerName: 'PC',
      direction: 'received',
      name: 'Design_Report.pdf',
      size: 1800000,
      timestamp: Date.now() - 5 * 60 * 1000,
      status: 'completed',
    },
    {
      id: 'seed-3',
      peerId: 'p-3',
      peerName: 'MacBook',
      direction: 'sent',
      name: 'video.mp4',
      size: 12600000,
      timestamp: Date.now() - 8 * 60 * 1000,
      status: 'completed',
    },
    {
      id: 'seed-4',
      peerId: 'p-1',
      peerName: 'Laptop',
      direction: 'received',
      name: 'notes.txt',
      size: 12000,
      timestamp: Date.now() - 12 * 60 * 1000,
      status: 'completed',
    },
  ];
}

export const transfersStore = createStore<TransfersState>({
  active: {},
  history: loadHistory(),
});

function persistHistory(history: TransferRecord[]) {
  try {
    localStorage.setItem('fs.history', JSON.stringify(history.slice(0, 100)));
  } catch {
    // ignore
  }
}

export function addTransferRecord(rec: TransferRecord) {
  transfersStore.update((curr) => {
    const history = [rec, ...curr.history].slice(0, 100);
    persistHistory(history);
    return { ...curr, history };
  });
}

export function updateActiveTransfer(id: string, partial: Partial<TransferRecord>) {
  transfersStore.update((curr) => {
    const active = { ...curr.active };
    if (active[id]) {
      active[id] = { ...active[id], ...partial };
      if (partial.status === 'completed' || partial.status === 'failed' || partial.status === 'cancelled') {
        const completedRec = active[id];
        delete active[id];
        const history = [completedRec, ...curr.history].slice(0, 100);
        persistHistory(history);
        return { active, history };
      }
    } else if (partial.name && partial.direction) {
      active[id] = partial as TransferRecord;
    }
    return { ...curr, active };
  });
}

export function removeTransferRecord(id: string) {
  transfersStore.update((curr) => {
    const history = curr.history.filter((h) => h.id !== id);
    persistHistory(history);
    return { ...curr, history };
  });
}

export function clearHistory() {
  transfersStore.update((curr) => {
    persistHistory([]);
    return { ...curr, history: [] };
  });
}
