import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/preact';
import { Button } from './Button';
import { Icon } from './Icon';
import { Chip } from './Chip';
import { Switch } from './Switch';
import { QrCode } from './QrCode';

describe('UI Components', () => {
  it('renders Button with variants and labels', () => {
    const { getByText } = render(<Button variant="primary">Send files</Button>);
    expect(getByText('Send files')).toBeDefined();
  });

  it('renders Icon SVG element with proper attributes', () => {
    const { container } = render(<Icon name="radar" size={24} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
    expect(svg?.getAttribute('width')).toBe('24');
    expect(svg?.getAttribute('height')).toBe('24');
  });

  it('renders Chip with active state', () => {
    const { getByText } = render(<Chip active>All</Chip>);
    const chip = getByText('All');
    expect(chip.getAttribute('data-active')).toBe('true');
  });

  it('renders Switch toggle', () => {
    const { container } = render(<Switch checked={true} onChange={() => {}} />);
    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('generates SVG QR code', () => {
    const { container } = render(<QrCode value="https://fastshare.ritikthakur.com.np/?pair_key=123456" size={160} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
    expect(svg?.getAttribute('width')).toBe('160');
  });
});
