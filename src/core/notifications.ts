import { createStore } from './store';
import { settingsStore } from './settings';

export interface InAppToast {
  id: string;
  type: 'sent' | 'received' | 'incoming' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export const toastStore = createStore<InAppToast[]>([]);

export function pushToast(toast: Omit<InAppToast, 'id'>) {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const item: InAppToast = { ...toast, id };
  toastStore.update((curr) => [...curr.slice(-3), item]);
  setTimeout(() => {
    toastStore.update((curr) => curr.filter((t) => t.id !== id));
  }, toast.duration ?? 4000);
}

export function dismissToast(id: string) {
  toastStore.update((curr) => curr.filter((t) => t.id !== id));
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playNotificationSound(type: 'sent' | 'received' | 'incoming') {
  const { sound } = settingsStore.get();
  if (!sound) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'sent') {
      // Pleasant rising two-tone chime: 520Hz -> 680Hz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.12);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'received') {
      // Harmonic three-tone arrival chord: 440Hz -> 554Hz -> 659Hz
      [440, 554, 659].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = now + idx * 0.08;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.16, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.28);
      });
    } else if (type === 'incoming') {
      // Attention double beep: 587Hz -> 587Hz
      [0, 0.14].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = now + delay;
        osc.frequency.setValueAtTime(587.33, start);
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.16);
      });
    }
  } catch {
    // audio context may require user interaction
  }
}

export function showBrowserNotification(title: string, options?: { body?: string; tag?: string }) {
  const { notifications } = settingsStore.get();
  if (!notifications) return;

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body: options?.body,
        icon: '/icons/favicon.svg',
        tag: options?.tag,
      });
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch {
      // ignore
    }
  }
}

export function notifyFilesSent(peerName: string, files: { name: string }[] | number) {
  const count = typeof files === 'number' ? files : files.length;
  const summary =
    typeof files === 'object' && files.length === 1
      ? `Sent ${files[0].name} to ${peerName}`
      : `Sent ${count} file${count > 1 ? 's' : ''} to ${peerName}`;

  playNotificationSound('sent');
  showBrowserNotification('Files Sent', { body: summary, tag: 'sent-files' });
  pushToast({ type: 'sent', title: 'Files Sent', message: summary });
}

export function notifyFileReceived(peerName: string, fileName: string) {
  const body = `Received ${fileName} from ${peerName}`;
  playNotificationSound('received');
  showBrowserNotification('File Received', { body, tag: 'received-file' });
  pushToast({ type: 'received', title: 'File Received', message: body });
}

export function notifyTextSent(peerName: string, text: string) {
  const snippet = text.length > 35 ? `${text.slice(0, 35)}...` : text;
  const body = `Sent to ${peerName}: "${snippet}"`;
  playNotificationSound('sent');
  showBrowserNotification('Message Sent', { body, tag: 'sent-text' });
  pushToast({ type: 'sent', title: 'Message Sent', message: body });
}

export function notifyTextReceived(peerName: string, text: string) {
  const snippet = text.length > 35 ? `${text.slice(0, 35)}...` : text;
  const body = `From ${peerName}: "${snippet}"`;
  playNotificationSound('received');
  showBrowserNotification(`Message from ${peerName}`, { body, tag: 'recv-text' });
  pushToast({ type: 'received', title: `Message from ${peerName}`, message: snippet });
}

export function notifyIncomingTransfer(senderAlias: string, fileCount: number, totalSizeStr: string) {
  const body = `${senderAlias} wants to send ${fileCount} file${fileCount > 1 ? 's' : ''} (${totalSizeStr})`;
  playNotificationSound('incoming');
  showBrowserNotification('Incoming Transfer', { body, tag: 'incoming-transfer' });
  pushToast({ type: 'incoming', title: 'Incoming Transfer', message: body, duration: 6000 });
}
