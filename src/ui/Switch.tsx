interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
}

export function Switch({ checked, onChange, disabled = false, label, id }: SwitchProps) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
      }}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          width: 0,
          height: 0,
        }}
      />
      <div
        style={{
          width: '44px',
          height: '24px',
          borderRadius: 'var(--fs-radius-pill)',
          backgroundColor: checked ? 'var(--fs-accent)' : 'var(--fs-separator)',
          position: 'relative',
          transition: 'background-color var(--fs-transition-fast)',
          opacity: disabled ? 0.5 : 1,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            position: 'absolute',
            top: '3px',
            left: checked ? '23px' : '3px',
            transition: 'left var(--fs-transition-spring)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          }}
        />
      </div>
      {label && <span style={{ color: 'var(--fs-text)', fontSize: '0.95rem' }}>{label}</span>}
    </label>
  );
}
