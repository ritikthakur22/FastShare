import { pairedDevicesStore, PairedDevice, rejoinRoomSecrets } from './rooms';
import { updateSettings } from './settings';
import { addTransferRecord } from './transfers';

const MIGRATION_DONE_KEY = 'fs.legacyImport';
const STORAGE_SECRETS_KEY = 'fs.room_secrets';
const STORAGE_PAIRED_KEY = 'fs.paired_devices';

export async function migrateLegacyData(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    if (localStorage.getItem(MIGRATION_DONE_KEY) === 'done') {
      return;
    }
  } catch {
    return;
  }

  // 1. Migrate legacy localStorage items
  try {
    const legacyTheme = localStorage.getItem('theme');
    if (legacyTheme === 'light' || legacyTheme === 'dark') {
      updateSettings({ theme: legacyTheme });
    }

    const legacyWss = localStorage.getItem('setting-wss');
    if (legacyWss && legacyWss.length > 5 && legacyWss.startsWith('wss://')) {
      updateSettings({ serverUrl: legacyWss });
    }

    const legacyClipboard = localStorage.getItem('fastshare-clipboard-history');
    if (legacyClipboard) {
      try {
        const parsed = JSON.parse(legacyClipboard);
        if (Array.isArray(parsed)) {
          parsed.forEach((text: unknown, idx: number) => {
            if (typeof text === 'string' && text.trim().length > 0) {
              addTransferRecord({
                id: `legacy-clip-${idx}-${Date.now()}`,
                peerId: 'legacy',
                peerName: 'Clipboard History',
                name: 'Pasted Text',
                size: text.length,
                direction: 'received',
                status: 'completed',
                timestamp: Date.now() - idx * 1000,
                textPayload: text,
              });
            }
          });
        }
      } catch {
        // ignore malformed history
      }
    }
  } catch (err) {
    console.warn('FastShare: localStorage migration non-fatal error:', err);
  }

  // 2. Open fastshare_store IndexedDB WITHOUT creating it (W-012)
  if (!('indexedDB' in window)) {
    try {
      localStorage.setItem(MIGRATION_DONE_KEY, 'done');
    } catch {
      // ignore
    }
    return;
  }

  await new Promise<void>((resolve) => {
    let existed = true;
    let request: IDBOpenDBRequest;
    try {
      // W-012: Call indexedDB.open('fastshare_store') with NO version.
      request = window.indexedDB.open('fastshare_store');
    } catch {
      resolve();
      return;
    }

    request.onupgradeneeded = (e) => {
      // If upgradeneeded fires when no version was passed, the DB did NOT exist!
      existed = false;
      try {
        const txn = (e.target as IDBOpenDBRequest).transaction;
        txn?.abort();
      } catch {
        // ignore
      }
    };

    request.onerror = () => {
      // Aborted or failed to open -> do nothing, legacy DB did not exist
      resolve();
    };

    request.onsuccess = (e) => {
      if (!existed) {
        resolve();
        return;
      }

      const db = (e.target as IDBOpenDBRequest).result;
      try {
        const storeNames = Array.from(db.objectStoreNames);

        // Check if room_secrets store exists
        if (storeNames.includes('room_secrets')) {
          const txn = db.transaction('room_secrets', 'readonly');
          const store = txn.objectStore('room_secrets');
          const getAllReq = store.getAll();

          getAllReq.onsuccess = () => {
            const entries = getAllReq.result;
            if (Array.isArray(entries) && entries.length > 0) {
              const importedDevices: PairedDevice[] = [];
              const importedSecrets: string[] = [];

              for (let i = 0; i < entries.length; i++) {
                const item = entries[i];
                if (item && typeof item.secret === 'string' && /^[\x00-\x7F]{64,256}$/.test(item.secret)) {
                  importedSecrets.push(item.secret);
                  importedDevices.push({
                    id: `legacy-${i}-${item.secret.slice(0, 8)}`,
                    alias: typeof item.display_name === 'string' && item.display_name.trim()
                      ? item.display_name.trim().slice(0, 64)
                      : 'Paired Device',
                    secret: item.secret,
                    pairedAt: Date.now(),
                  });
                }
              }

              if (importedDevices.length > 0) {
                const currentDevices = pairedDevicesStore.get();
                const merged = [...importedDevices, ...currentDevices.filter((d) => !importedSecrets.includes(d.secret))];
                pairedDevicesStore.set(merged);

                try {
                  localStorage.setItem(STORAGE_PAIRED_KEY, JSON.stringify(merged));
                  const allSecrets = merged.map((d) => d.secret);
                  localStorage.setItem(STORAGE_SECRETS_KEY, JSON.stringify(allSecrets));
                } catch {
                  // ignore
                }

                // Immediately inform the signaling server of the imported secrets
                rejoinRoomSecrets();
              }
            }
          };
        }

        // Check if keyval store exists (for edited_display_name)
        if (storeNames.includes('keyval')) {
          try {
            const keyTxn = db.transaction('keyval', 'readonly');
            const keyStore = keyTxn.objectStore('keyval');
            const nameReq = keyStore.get('edited_display_name');
            nameReq.onsuccess = () => {
              if (typeof nameReq.result === 'string' && nameReq.result.trim()) {
                updateSettings({ deviceName: nameReq.result.trim().slice(0, 64) });
              }
            };
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.warn('FastShare: IndexedDB legacy read error:', err);
      } finally {
        try {
          db.close();
        } catch {
          // ignore
        }
        resolve();
      }
    };
  });

  try {
    localStorage.setItem(MIGRATION_DONE_KEY, 'done');
  } catch {
    // ignore
  }
}
