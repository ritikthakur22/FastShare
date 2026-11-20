import { createStore } from './store';
import { buildPalette, AccentChoice, ThemeMode, rgb } from '../ui/palette';

export type DeviceType = 'phone' | 'desktop' | 'auto';
export type VisibilityMode = 'everyone' | 'paired';

export const DEFAULT_SERVER_URL = 'wss://fastshare-ja1a.onrender.com/server';
export const DEFAULT_ICE_SERVERS = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
  'stun:stun2.l.google.com:19302',
  'stun:global.stun.twilio.com:3478',
];

export interface SettingsState {
  theme: 'system' | 'light' | 'dark';
  accent: AccentChoice;
  deviceName: string;
  deviceType: DeviceType;
  visibility: VisibilityMode;
  autoDownload: boolean;
  saveToGallery: boolean;
  saveAsZip: boolean;
  notifications: boolean;
  sound: boolean;
  serverUrl: string;
  iceServers: string[];
  autoRetry: boolean;
}

export const RANDOM_ONE_WORD_NAMES = [
  'Prince', 'Aadarsh', 'Richa', 'Bikash', 'Aayush', 'Prem', 'Aaditya',
  'Prashant', 'Pratik', 'Pratyush', 'Radium', 'Ranjan', 'Rijan', 'Ritik',
  'Riya', 'Rohit', 'Rosha', 'Sachin', 'Saksham', 'Sakshyam', 'Samar',
  'Samir', 'Sanjiban', 'Saroj', 'Saugat', 'Saurav', 'Saurya', 'Seemon',
  'Shailesh', 'Sharamsh', 'Shyam', 'Sneha', 'Sourav', 'Sovana', 'Subash',
  'Subechhya', 'Subham', 'Sujan', 'Sumina', 'Sumiran', 'Sumit', 'Sushant',
  'Sushil', 'Suyog', 'Swikriti', 'Utsav', 'Utsuk',
];

export function getRandomWordName(): string {
  const idx = Math.floor(Math.random() * RANDOM_ONE_WORD_NAMES.length);
  return RANDOM_ONE_WORD_NAMES[idx]!;
}

export function getDefaultDeviceName(): string {
  return getRandomWordName();
}

function loadInitialSettings(): SettingsState {
  const theme = (localStorage.getItem('fs.theme') as SettingsState['theme']) || 'dark';

  // Check if user explicitly renamed their device in Settings
  const explicitCustomName = localStorage.getItem('fs.customDeviceName');

  let sessionName: string | null = null;
  try {
    sessionName = sessionStorage.getItem('fs.sessionDeviceName');
  } catch {
    // ignore
  }

  let deviceName: string;
  if (explicitCustomName && explicitCustomName.trim()) {
    deviceName = explicitCustomName.trim();
  } else if (sessionName && sessionName.trim()) {
    deviceName = sessionName.trim();
  } else {
    // Every new tab or visit gets a fresh random name from user's custom dictionary
    deviceName = getRandomWordName();
    try {
      sessionStorage.setItem('fs.sessionDeviceName', deviceName);
    } catch {
      // ignore
    }
  }

  // Auto-upgrade generic desktop names to unique one-word random names
  try {
    const legacy = localStorage.getItem('fs.deviceName');
    if (legacy && (legacy.includes('PC') || legacy.includes('Device') || legacy.includes('Phone') || legacy === 'Linux PC' || legacy === 'Windows PC')) {
      localStorage.removeItem('fs.deviceName');
    }
  } catch {
    // ignore
  }
  const deviceType = (localStorage.getItem('fs.deviceType') as DeviceType) || 'auto';
  const visibility = (localStorage.getItem('fs.visibility') as VisibilityMode) || 'everyone';
  const autoDownload = localStorage.getItem('fs.autoDownload') === 'true';
  const saveToGallery = localStorage.getItem('fs.saveToGallery') === 'true';
  const saveAsZip = localStorage.getItem('fs.saveAsZip') !== 'false';
  const notifications = localStorage.getItem('fs.notifications') !== 'false';
  const sound = localStorage.getItem('fs.sound') !== 'false';
  const serverUrl = localStorage.getItem('fs.serverUrl') || (import.meta.env.VITE_SIGNALING_URL ?? DEFAULT_SERVER_URL);
  const autoRetry = localStorage.getItem('fs.autoRetry') !== 'false';

  let iceServers: string[] = DEFAULT_ICE_SERVERS;
  try {
    const rawIce = localStorage.getItem('fs.iceServers');
    if (rawIce) {
      const parsed = JSON.parse(rawIce);
      if (Array.isArray(parsed) && parsed.length > 0) iceServers = parsed;
    }
  } catch {
    // fallback
  }

  let accent: AccentChoice = { type: 'preset', name: 'signal' };
  try {
    const rawAccent = localStorage.getItem('fs.accent');
    if (rawAccent) accent = JSON.parse(rawAccent);
  } catch {
    // fallback
  }

  return {
    theme,
    accent,
    deviceName,
    deviceType,
    visibility,
    autoDownload,
    saveToGallery,
    saveAsZip,
    notifications,
    sound,
    serverUrl,
    iceServers,
    autoRetry,
  };
}

export const settingsStore = createStore<SettingsState>(loadInitialSettings());

export function applyThemeAndPalette(settings: SettingsState) {
  if (typeof document === 'undefined') return;

  const mode: ThemeMode =
    settings.theme === 'system'
      ? window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark'
      : settings.theme;

  document.documentElement.setAttribute('data-theme', mode);

  const palette = buildPalette(settings.accent, mode);
  const vars: Record<string, string> = {
    '--fs-bg': palette.bg,
    '--fs-surface': palette.surface,
    '--fs-surface-raised': palette.surfaceRaised,
    '--fs-separator': palette.separator,
    '--fs-text': palette.textPrimary,
    '--fs-text-2': palette.textSecondary,
    '--fs-text-3': palette.textTertiary,
    '--fs-accent': palette.accent,
    '--fs-accent-rgb': rgb(palette.accent).join(', '),
    '--fs-on-accent': palette.onAccent,
    '--fs-accent-tint': palette.accentTint,
    '--fs-danger': palette.danger,
    '--fs-warning': palette.warning,
  };

  for (const [k, v] of Object.entries(vars)) {
    document.documentElement.style.setProperty(k, v);
  }

  try {
    localStorage.setItem('fs.palette', JSON.stringify(vars));
  } catch {
    // ignore
  }
}

export function updateSettings(partial: Partial<SettingsState>) {
  settingsStore.update((curr) => {
    const next = { ...curr, ...partial };
    if (partial.theme !== undefined) localStorage.setItem('fs.theme', next.theme);
    if (partial.deviceName !== undefined) {
      const clean = partial.deviceName.trim();
      if (clean) {
        localStorage.setItem('fs.customDeviceName', clean);
        localStorage.setItem('fs.deviceName', clean);
        try {
          sessionStorage.setItem('fs.sessionDeviceName', clean);
        } catch {
          // ignore
        }
      } else {
        localStorage.removeItem('fs.customDeviceName');
        localStorage.removeItem('fs.deviceName');
        const fresh = getRandomWordName();
        try {
          sessionStorage.setItem('fs.sessionDeviceName', fresh);
        } catch {
          // ignore
        }
        next.deviceName = fresh;
      }
    }
    if (partial.deviceType !== undefined) localStorage.setItem('fs.deviceType', next.deviceType);
    if (partial.visibility !== undefined) localStorage.setItem('fs.visibility', next.visibility);
    if (partial.autoDownload !== undefined) localStorage.setItem('fs.autoDownload', String(next.autoDownload));
    if (partial.saveToGallery !== undefined) localStorage.setItem('fs.saveToGallery', String(next.saveToGallery));
    if (partial.saveAsZip !== undefined) localStorage.setItem('fs.saveAsZip', String(next.saveAsZip));
    if (partial.notifications !== undefined) localStorage.setItem('fs.notifications', String(next.notifications));
    if (partial.sound !== undefined) localStorage.setItem('fs.sound', String(next.sound));
    if (partial.serverUrl !== undefined) localStorage.setItem('fs.serverUrl', next.serverUrl);
    if (partial.accent !== undefined) localStorage.setItem('fs.accent', JSON.stringify(next.accent));
    if (partial.iceServers !== undefined) localStorage.setItem('fs.iceServers', JSON.stringify(next.iceServers));
    if (partial.autoRetry !== undefined) localStorage.setItem('fs.autoRetry', String(next.autoRetry));

    applyThemeAndPalette(next);
    return next;
  });
}

export function resetSettingsToDefault() {
  localStorage.removeItem('fs.customDeviceName');
  localStorage.removeItem('fs.deviceName');
  const fresh = getRandomWordName();
  try {
    sessionStorage.setItem('fs.sessionDeviceName', fresh);
  } catch {
    // ignore
  }

  const defaults: SettingsState = {
    theme: 'dark',
    accent: { type: 'preset', name: 'signal' },
    deviceName: fresh,
    deviceType: 'auto',
    visibility: 'everyone',
    autoDownload: false,
    saveToGallery: false,
    saveAsZip: true,
    notifications: true,
    sound: true,
    serverUrl: DEFAULT_SERVER_URL,
    iceServers: [...DEFAULT_ICE_SERVERS],
    autoRetry: true,
  };

  localStorage.removeItem('fs.theme');
  localStorage.removeItem('fs.deviceType');
  localStorage.removeItem('fs.visibility');
  localStorage.removeItem('fs.autoDownload');
  localStorage.removeItem('fs.saveToGallery');
  localStorage.removeItem('fs.saveAsZip');
  localStorage.removeItem('fs.notifications');
  localStorage.removeItem('fs.sound');
  localStorage.removeItem('fs.serverUrl');
  localStorage.removeItem('fs.accent');
  localStorage.removeItem('fs.iceServers');
  localStorage.removeItem('fs.autoRetry');

  settingsStore.set(defaults);
  applyThemeAndPalette(defaults);
}
