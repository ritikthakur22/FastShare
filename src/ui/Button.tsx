import { ComponentChildren } from 'preact';

export interface ButtonProps {
  children: ComponentChildren;
  variant?: 'primary' | 'secondary' | 'danger' | 'text';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: (e: MouseEvent) => void;
  className?: string;
  icon?: ComponentChildren;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  className = '',
  icon,
}: ButtonProps) {
  const getStyles = () => {
    const base: Record<string, string> = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      borderRadius: 'var(--fs-radius-pill)',
      fontWeight: '600',
      transition: 'all var(--fs-transition-fast)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? '0.5' : '1',
      width: fullWidth ? '100%' : 'auto',
      border: 'none',
      whiteSpace: 'nowrap',
    };

    if (size === 'sm') {
      base.padding = '8px 16px';
      base.fontSize = '0.875rem';
      base.height = '36px';
    } else if (size === 'lg') {
      base.padding = '14px 28px';
      base.fontSize = '1.05rem';
      base.height = '52px';
    } else {
      base.padding = '10px 20px';
      base.fontSize = '0.95rem';
      base.height = '44px';
    }

    if (variant === 'primary') {
      base.background = 'var(--fs-accent)';
      base.color = 'var(--fs-on-accent)';
    } else if (variant === 'secondary') {
      base.background = 'var(--fs-surface)';
      base.color = 'var(--fs-text)';
      base.border = '1px solid var(--fs-separator)';
    } else if (variant === 'danger') {
      base.background = 'var(--fs-danger)';
      base.color = '#FFFFFF';
    } else {
      base.background = 'transparent';
      base.color = 'var(--fs-text)';
    }

    return base;
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`fs-button ${className}`}
      style={getStyles()}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
