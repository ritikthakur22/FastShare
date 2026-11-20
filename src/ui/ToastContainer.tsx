import { useStore } from '../core/useStore';
import { toastStore, dismissToast, InAppToast } from '../core/notifications';
import { Icon } from './Icon';

export function ToastContainer() {
  const toasts = useStore(toastStore);

  if (toasts.length === 0) return null;

  const getIconName = (type: InAppToast['type']) => {
    switch (type) {
      case 'sent':
        return 'send';
      case 'received':
        return 'download';
      case 'incoming':
        return 'refresh';
      default:
        return 'info';
    }
  };

  const getIconColor = (type: InAppToast['type']) => {
    switch (type) {
      case 'sent':
      case 'received':
        return 'var(--fs-accent)';
      case 'incoming':
        return 'var(--fs-warning)';
      default:
        return 'var(--fs-text)';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '460px',
        width: 'calc(100% - 32px)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => dismissToast(toast.id)}
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor: 'var(--fs-surface)',
            border: '1px solid var(--fs-separator)',
            borderRadius: 'var(--fs-radius-row)',
            boxShadow: 'var(--fs-shadow)',
            backdropFilter: 'blur(12px)',
            animation: 'fs-toast-slide 200ms cubic-bezier(0.16, 1, 0.3, 1)',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--fs-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name={getIconName(toast.type)} size={16} color={getIconColor(toast.type)} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--fs-text)', lineHeight: 1.2 }}>
                {toast.title}
              </p>
              {toast.message && (
                <p
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--fs-text-2)',
                    marginTop: '2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {toast.message}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              dismissToast(toast.id);
            }}
            style={{
              color: 'var(--fs-text-3)',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              cursor: 'pointer',
            }}
            aria-label="Dismiss notification"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
