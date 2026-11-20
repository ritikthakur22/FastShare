import { ComponentChildren } from 'preact';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: ComponentChildren;
}

interface SegmentedProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: SegmentedProps<T>) {
  return (
    <div
      role="tablist"
      className={`fs-segmented ${className}`}
      style={{
        display: 'inline-flex',
        padding: '4px',
        backgroundColor: 'var(--fs-bg)',
        borderRadius: 'var(--fs-radius-control)',
        border: '1px solid var(--fs-separator)',
        gap: '4px',
        width: '100%',
      }}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: isSelected ? '600' : '400',
              backgroundColor: isSelected ? 'var(--fs-surface-raised)' : 'transparent',
              color: isSelected ? 'var(--fs-text)' : 'var(--fs-text-2)',
              border: isSelected ? '1px solid var(--fs-separator)' : '1px solid transparent',
              boxShadow: isSelected ? 'var(--fs-shadow)' : 'none',
              cursor: 'pointer',
              transition: 'all var(--fs-transition-fast)',
            }}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
