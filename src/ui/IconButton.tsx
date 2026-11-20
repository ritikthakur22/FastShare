import { ComponentChildren } from 'preact';

export interface IconButtonProps {
  children: ComponentChildren;
  size?: number;
  onClick?: (e: MouseEvent) => void;
  title?: string;
  className?: string;
  active?: boolean;
}

export function IconButton({
  children,
  size = 40,
  onClick,
  title,
  className = '',
  active = false,
}: IconButtonProps) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`fs-icon-btn ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: active ? 'var(--fs-accent-tint)' : 'var(--fs-surface)',
        color: active ? 'var(--fs-accent)' : 'var(--fs-text)',
        border: '1px solid var(--fs-separator)',
        cursor: 'pointer',
        transition: 'all var(--fs-transition-fast)',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}
