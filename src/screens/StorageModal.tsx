import { useState } from 'preact/hooks';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';

export function StorageModal() {
  const [cacheCleared, setCacheCleared] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);

  const handleClearCache = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      setCacheCleared(true);
    } catch {
      setCacheCleared(true);
    }
  };

  const handleWipeAllData = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      window.location.href = '/';
    } catch {
      window.location.reload();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ fontSize: '0.9rem', color: 'var(--fs-text-2)', marginBottom: '8px' }}>
        Manage your received files, offline cache, and stored browser data
      </p>

      {/* Downloads folder row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderRadius: 'var(--fs-radius-row)',
          backgroundColor: 'var(--fs-bg)',
          border: '1px solid var(--fs-separator)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--fs-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="download" size={20} color="var(--fs-accent)" />
          </div>
          <div>
            <p style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--fs-text)' }}>
              Download destination
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--fs-text-2)', marginTop: '2px' }}>
              Browser default downloads folder
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: '0.8rem',
            color: 'var(--fs-text-3)',
            backgroundColor: 'var(--fs-surface)',
            padding: '4px 10px',
            borderRadius: 'var(--fs-radius-control)',
            border: '1px solid var(--fs-separator)',
          }}
        >
          Auto
        </span>
      </div>

      {/* Cache row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderRadius: 'var(--fs-radius-row)',
          backgroundColor: 'var(--fs-bg)',
          border: '1px solid var(--fs-separator)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--fs-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="shield" size={20} color="var(--fs-accent)" />
          </div>
          <div>
            <p style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--fs-text)' }}>
              Temporary offline cache
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--fs-text-2)', marginTop: '2px' }}>
              {cacheCleared ? '0 KB' : 'App shell & icons cache'}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={handleClearCache}
          disabled={cacheCleared}
        >
          {cacheCleared ? 'Cleared' : 'Clear'}
        </Button>
      </div>

      {/* Wipe All Data Section (WF26) */}
      <div
        style={{
          marginTop: '12px',
          paddingTop: '16px',
          borderTop: '1px solid var(--fs-separator)',
        }}
      >
        <button
          onClick={() => setShowWipeConfirm(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderRadius: 'var(--fs-radius-row)',
            backgroundColor: 'transparent',
            border: '1px solid var(--fs-separator)',
            color: 'var(--fs-danger)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            transition: 'background-color var(--fs-transition-fast)',
          }}
        >
          <Icon name="delete" size={16} color="var(--fs-danger)" />
          <span>Remove all FastShare data from this browser</span>
        </button>
      </div>

      {/* Wipe Confirmation Dialog */}
      {showWipeConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--fs-scrim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
            padding: '16px',
          }}
          onClick={() => setShowWipeConfirm(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--fs-surface)',
              border: '1px solid var(--fs-separator)',
              borderRadius: 'var(--fs-radius-card)',
              padding: '24px',
              maxWidth: '420px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: 'var(--fs-shadow)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(248, 113, 113, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="warning" size={20} color="var(--fs-danger)" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--fs-text)' }}>
                Remove all data?
              </h3>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--fs-text-2)', lineHeight: '1.5' }}>
              This will completely erase all stored preferences, paired device keys, saved text history, and offline cached files from this browser. This action cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button variant="secondary" onClick={() => setShowWipeConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleWipeAllData}
              >
                Erase Everything
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
