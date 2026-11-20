import { ComponentChildren } from 'preact';

export interface ChipProps {
  children: ComponentChildren;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Chip({ children, active = false, onClick, className = '' }: ChipProps) {
  return (
    <button
      data-active={active}
      onClick={onClick}
      className={`fs-chip ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 16px',
        borderRadius: 'var(--fs-radius-pill)',
        fontSize: '0.875rem',
        fontWeight: active ? '600' : '500',
        backgroundColor: active ? 'var(--fs-accent)' : 'var(--fs-surface)',
        color: active ? 'var(--fs-on-accent)' : 'var(--fs-text-2)',
        border: active ? '1px solid var(--fs-accent)' : '1px solid var(--fs-separator)',
        cursor: 'pointer',
        transition: 'all var(--fs-transition-fast)',
      }}
    >
      {children}
    </button>
  );
}
