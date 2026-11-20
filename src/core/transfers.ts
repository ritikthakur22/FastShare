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
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(item => item && !item.id?.startsWith('seed-')).slice(0, 100);
        if (cleaned.length !== parsed.length) {
          localStorage.setItem('fs.history', JSON.stringify(cleaned));
        }
        return cleaned;
      }
    }
  } catch {
    // fallback
  }

  return [];
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
