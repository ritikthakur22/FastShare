import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';

interface SendTrayProps {
  title: string;
  detail: string;
  onClear: () => void;
  done?: boolean;
  action?: { label: string; onPress: () => void };
}

export function SendTray({
  title,
  detail,
  onClear,
  done = false,
  action,
}: SendTrayProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 48px)',
        maxWidth: '560px',
        backgroundColor: 'var(--fs-surface-raised)',
        border: '1px solid var(--fs-separator)',
        borderRadius: 'var(--fs-radius-card)',
        padding: '16px',
        boxShadow: 'var(--fs-shadow)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 50,
        animation: 'slideUp 240ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'var(--fs-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--fs-on-accent)',
            flexShrink: 0,
          }}
        >
          <Icon name="send" size={20} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: '0.95rem',
              fontWeight: '700',
              color: 'var(--fs-text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </p>
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--fs-text-2)',
              marginTop: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {detail}
          </p>
        </div>

        <button
          onClick={onClear}
          title={done ? 'Done' : 'Clear selection'}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--fs-surface)',
            border: '1px solid var(--fs-separator)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: done ? 'var(--fs-accent)' : 'var(--fs-text-2)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Icon name={done ? 'check' : 'close'} size={18} />
        </button>
      </div>

      {action && (
        <Button variant="primary" fullWidth onClick={action.onPress} icon={<Icon name="send" size={16} />}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
