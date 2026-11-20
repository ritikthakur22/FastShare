// FastShare Web Design Tokens & Palette System - Copyright (c) 2026 Ritik Thakur

export const accents = {
  signal: { label: 'Signal green', light: '#08755A', dark: '#45D19E' },
  cobalt: { label: 'Cobalt', light: '#2450C8', dark: '#86A8FF' },
  violet: { label: 'Violet', light: '#6A3FCB', dark: '#B7A1FF' },
  ember: { label: 'Ember', light: '#B5460F', dark: '#FF9B66' },
  rose: { label: 'Rose', light: '#BC2A5C', dark: '#FF8FB0' },
  graphite: { label: 'Graphite', light: '#2B2D31', dark: '#DCDFE4' },
} as const;

export type AccentName = keyof typeof accents;
export type ThemeMode = 'light' | 'dark';
export type AccentChoice =
  | { type: 'preset'; name: AccentName }
  | { type: 'hue'; hue: number }
  | { type: 'custom'; hex: string };

export const ACCENT_NAMES = Object.keys(accents) as AccentName[];
export const DEFAULT_ACCENT: AccentName = 'signal';

export interface Palette {
  mode: ThemeMode;
  bg: string;
  surface: string;
  surfaceRaised: string;
  separator: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  onAccent: string;
  accentTint: string;
  danger: string;
  warning: string;
}

export const rgb = (hex: string): [number, number, number] =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

export const hex = (c: number[]): string =>
  '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

export const mix = (a: string, b: string, t: number): string => {
  const [x, y] = [rgb(a), rgb(b)];
  return hex(x.map((v, i) => v + ((y[i] ?? v) - v) * t));
};

export const alpha = (c: string, a: number): string => `rgba(${rgb(c).join(',')},${a})`;

export function luminance(c: string): number {
  const [r, g, b] = rgb(c).map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

export function hsl(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  };
  return hex([f(0), f(8), f(4)]);
}

export const CUSTOM_HUES = Array.from({ length: 18 }, (_, i) => i * 20);

export function accentFromHue(hue: number, mode: ThemeMode): string {
  const light = mode === 'light';
  const against = light ? '#ECECEA' : '#262A2F';
  let l = light ? 0.5 : 0.62;
  for (let i = 0; i < 60 && contrast(hsl(hue, light ? 0.7 : 0.85, l), against) < 4.6; i++) {
    l += light ? -0.01 : 0.01;
  }
  return hsl(hue, light ? 0.7 : 0.85, l);
}

export function normalizeHex(input: string): string | null {
  let h = input.trim().replace(/^#?/, '#');
  if (/^#[0-9a-f]{3}$/i.test(h)) h = '#' + [...h.slice(1)].map((c) => c + c).join('');
  return /^#[0-9a-f]{6}$/i.test(h) ? h.toUpperCase() : null;
}

export function toHsl(c: string): [number, number, number] {
  const [r, g, b] = rgb(c).map((v) => v / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

export function accentFromHex(c: string, mode: ThemeMode): string {
  const light = mode === 'light';
  const against = light ? '#ECECEA' : '#262A2F';
  if (contrast(c, against) >= 4.6) return c.toUpperCase();
  const [h, s, l0] = toHsl(c);
  let l = l0;
  for (let i = 0; i < 100 && contrast(hsl(h, s, l), against) < 4.6; i++) {
    l = Math.min(1, Math.max(0, l + (light ? -0.01 : 0.01)));
  }
  return hsl(h, s, l).toUpperCase();
}

export function buildPalette(choice: AccentChoice | AccentName | number | string, mode: ThemeMode): Palette {
  let accent: string;
  if (typeof choice === 'object') {
    if (choice.type === 'preset') {
      accent = accents[choice.name]?.[mode] ?? accents.signal[mode];
    } else if (choice.type === 'hue') {
      accent = accentFromHue(choice.hue, mode);
    } else {
      accent = accentFromHex(normalizeHex(choice.hex) ?? '#45D19E', mode);
    }
  } else if (typeof choice === 'number') {
    accent = accentFromHue(choice, mode);
  } else if (choice in accents) {
    accent = accents[choice as AccentName][mode];
  } else {
    accent = accentFromHex(normalizeHex(choice) ?? '#45D19E', mode);
  }

  const ink = '#111214';
  const paper = '#FFFFFF';
  const onAccent = contrast(paper, accent) >= contrast(ink, accent) ? paper : '#0E0F11';

  if (mode === 'light') {
    return {
      mode,
      bg: '#F8F9FA',
      surface: paper,
      surfaceRaised: paper,
      separator: '#E2E8F0',
      textPrimary: ink,
      textSecondary: '#64748B',
      textTertiary: '#94A3B8',
      accent,
      onAccent,
      accentTint: alpha(accent, 0.12),
      danger: '#B91C1C',
      warning: '#B45309',
    };
  } else {
    return {
      mode,
      bg: '#0B0F19', // Deep navy background matching showcase
      surface: '#131927', // Slate card surface
      surfaceRaised: '#1E2638', // Elevated surface
      separator: '#232D42', // Subtle separator
      textPrimary: '#F8FAFC',
      textSecondary: '#94A3B8',
      textTertiary: '#64748B',
      accent,
      onAccent,
      accentTint: alpha(accent, 0.18),
      danger: '#F87171',
      warning: '#FBBF24',
    };
  }
}
