import { ComponentChildren } from 'preact';

interface TextFieldProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  disabled?: boolean;
  type?: string;
  maxLength?: number;
  rightAction?: ComponentChildren;
  className?: string;
}

export function TextField({
  value,
  onChange,
  placeholder,
  label,
  id,
  disabled = false,
  type = 'text',
  maxLength,
  rightAction,
  className = '',
}: TextFieldProps) {
  const inputId = id || (label ? `field-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label htmlFor={inputId} style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--fs-text-2)' }}>
          {label}
        </label>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--fs-bg)',
          border: '1px solid var(--fs-separator)',
          borderRadius: 'var(--fs-radius-control)',
          padding: '0 12px',
          height: '44px',
          width: '100%',
        }}
        className={`fs-text-field-wrap ${className}`}
      >
        <input
          id={inputId}
          type={type}
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          placeholder={placeholder}
          onInput={(e) => onChange((e.target as HTMLInputElement).value)}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            color: 'var(--fs-text)',
            fontSize: '0.95rem',
            width: '100%',
          }}
        />
        {rightAction}
      </div>
    </div>
  );
}
