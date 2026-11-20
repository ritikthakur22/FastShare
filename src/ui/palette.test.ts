import { describe, it, expect } from 'vitest';
import { buildPalette, contrast, accents, CUSTOM_HUES } from './palette';

describe('Design Tokens & Palette', () => {
  it('meets WCAG contrast requirements for all presets in light and dark mode', () => {
    const modes: ('light' | 'dark')[] = ['light', 'dark'];
    const presetKeys = Object.keys(accents) as (keyof typeof accents)[];

    for (const mode of modes) {
      for (const preset of presetKeys) {
        const palette = buildPalette({ type: 'preset', name: preset }, mode);

        // Text primary against background: at least 4.5:1
        const textContrast = contrast(palette.textPrimary, palette.bg);
        expect(textContrast).toBeGreaterThanOrEqual(4.5);

        // Text secondary against surface: at least 4.5:1
        const textSecondaryContrast = contrast(palette.textSecondary, palette.surface);
        expect(textSecondaryContrast).toBeGreaterThanOrEqual(4.5);

        // Danger against surface: at least 4.5:1
        const dangerContrast = contrast(palette.danger, palette.surface);
        expect(dangerContrast).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('meets contrast for custom hues across the wheel', () => {
    for (const hue of CUSTOM_HUES) {
      const palette = buildPalette({ type: 'hue', hue }, 'dark');
      const textContrast = contrast(palette.textPrimary, palette.bg);
      expect(textContrast).toBeGreaterThanOrEqual(4.5);
    }
  });
});
