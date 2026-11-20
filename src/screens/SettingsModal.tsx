import { useState } from 'preact/hooks';
import { Segmented } from '../ui/Segmented';
import { Switch } from '../ui/Switch';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { useStore } from '../core/useStore';
import { settingsStore, updateSettings, resetSettingsToDefault, DeviceType, VisibilityMode } from '../core/settings';
import { accents, AccentName } from '../ui/palette';

interface SettingsModalProps {
  onOpenReceiving: () => void;
  onOpenStorage: () => void;
  onOpenAbout: () => void;
  onOpenLinkDevices: () => void;
  onOpenAdvanced: () => void;
  onEditDeviceName?: () => void;
}

export function SettingsModal({
  onOpenReceiving,
  onOpenStorage,
  onOpenAbout,
  onOpenLinkDevices,
  onOpenAdvanced,
  onEditDeviceName,
}: SettingsModalProps) {
  const settings = useStore(settingsStore);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const themeOptions = [
    { value: 'system' as const, label: 'System' },
    { value: 'light' as const, label: 'Light' },
    { value: 'dark' as const, label: 'Dark' },
  ];

  const presetSwatches: { name: AccentName; color: string }[] = [
    { name: 'signal', color: accents.signal.dark },
    { name: 'cobalt', color: accents.cobalt.dark },
    { name: 'violet', color: accents.violet.dark },
    { name: 'ember', color: accents.ember.dark },
    { name: 'rose', color: accents.rose.dark },
    { name: 'graphite', color: accents.graphite.dark },
  ];

  const handleConfirmReset = () => {
    resetSettingsToDefault();
    setShowResetConfirm(false);
    setResetMessage('All settings have been restored to defaults');
    setTimeout(() => setResetMessage(null), 3000);
  };

  return (
    <div
      style={{
        padding: '32px 40px',
        maxWidth: '860px',
        margin: '0 auto',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {/* Title */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--fs-text)' }}>
          Settings
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--fs-text-2)', marginTop: '4px' }}>
          Manage this device and app preferences
        </p>
      </div>

      {resetMessage && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--fs-accent-tint)',
            border: '1px solid var(--fs-accent)',
            borderRadius: 'var(--fs-radius-row)',
            color: 'var(--fs-text)',
            fontSize: '0.9rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px',
          }}
        >
          <Icon name="check" size={18} color="var(--fs-accent)" />
          <span>{resetMessage}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
        {/* Left Column: Appearance & Connection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Appearance Section */}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--fs-text)', marginBottom: '12px' }}>
              Appearance
            </h3>
            <Segmented
              options={themeOptions}
              value={settings.theme}
              onChange={(theme) => updateSettings({ theme })}
            />
          </div>

          {/* Colour Section */}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--fs-text)', marginBottom: '12px' }}>
              Colour
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              {presetSwatches.map((swatch) => {
                const isSelected = settings.accent.type === 'preset' && settings.accent.name === swatch.name;
                return (
                  <button
                    key={swatch.name}
                    onClick={() => updateSettings({ accent: { type: 'preset', name: swatch.name } })}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: swatch.color,
                      border: isSelected ? '2px solid #FFFFFF' : '2px solid transparent',
                      boxShadow: isSelected ? '0 0 10px ' + swatch.color : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && <Icon name="check" size={14} color="#FFFFFF" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Colour Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 'var(--fs-radius-row)',
                backgroundColor: 'var(--fs-surface)',
                border: '1px solid var(--fs-separator)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="palette" size={18} color="var(--fs-accent)" />
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--fs-text)' }}>
                  Custom #6C3AED
                </span>
              </div>
              <Switch
                checked={settings.accent.type === 'custom'}
                onChange={(checked) => {
                  if (checked) {
                    updateSettings({ accent: { type: 'custom', hex: '#6C3AED' } });
                  } else {
                    updateSettings({ accent: { type: 'preset', name: 'signal' } });
                  }
                }}
              />
            </div>
          </div>

          {/* Connection Section */}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--fs-text)', marginBottom: '12px' }}>
              Connection
            </h3>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderRadius: 'var(--fs-radius-row)',
                backgroundColor: 'var(--fs-surface)',
                border: '1px solid var(--fs-separator)',
                gap: '16px',
              }}
            >
              <p style={{ fontSize: '0.85rem', color: 'var(--fs-text-2)', lineHeight: '1.4' }}>
                Use the internet when it is available, and nearby sharing when it is not.
              </p>
              <Switch checked={true} onChange={() => {}} />
            </div>
          </div>
        </div>

        {/* Right Column: Device & Navigation Sub-pages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Device Settings */}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--fs-text)', marginBottom: '12px' }}>
              Device
            </h3>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '16px',
                borderRadius: 'var(--fs-radius-card)',
                backgroundColor: 'var(--fs-surface)',
                border: '1px solid var(--fs-separator)',
              }}
            >
              {/* Name */}
              <div
                onClick={onEditDeviceName}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: onEditDeviceName ? 'pointer' : 'default',
                  padding: '4px 0',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--fs-text-3)', display: 'block' }}>
                    Device Name
                  </span>
                  <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--fs-text)' }}>
                    {settings.deviceName}
                  </span>
                </div>
                {onEditDeviceName && <Icon name="edit" size={16} color="var(--fs-text-2)" />}
              </div>

              {/* Type Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--fs-text)' }}>Device Type</span>
                <select
                  value={settings.deviceType}
                  onChange={(e) => updateSettings({ deviceType: (e.target as HTMLSelectElement).value as DeviceType })}
                  style={{
                    backgroundColor: 'var(--fs-bg)',
                    border: '1px solid var(--fs-separator)',
                    color: 'var(--fs-text)',
                    borderRadius: 'var(--fs-radius-control)',
                    padding: '6px 12px',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value="auto">Auto</option>
                  <option value="phone">Phone</option>
                  <option value="desktop">Desktop</option>
                </select>
              </div>

              {/* Visibility Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--fs-text)' }}>Visibility</span>
                <select
                  value={settings.visibility}
                  onChange={(e) => updateSettings({ visibility: (e.target as HTMLSelectElement).value as VisibilityMode })}
                  style={{
                    backgroundColor: 'var(--fs-bg)',
                    border: '1px solid var(--fs-separator)',
                    color: 'var(--fs-text)',
                    borderRadius: 'var(--fs-radius-control)',
                    padding: '6px 12px',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value="everyone">Everyone</option>
                  <option value="paired">Paired only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sub-pages Navigation matching Native App */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={onOpenLinkDevices}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: 'var(--fs-radius-row)',
                backgroundColor: 'var(--fs-surface)',
                border: '1px solid var(--fs-separator)',
                color: 'var(--fs-text)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon name="link" size={18} color="var(--fs-accent)" />
                <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>Link devices</span>
              </div>
              <Icon name="chevron_right" size={16} color="var(--fs-text-3)" />
            </button>

            <button
              onClick={onOpenReceiving}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: 'var(--fs-radius-row)',
                backgroundColor: 'var(--fs-surface)',
                border: '1px solid var(--fs-separator)',
                color: 'var(--fs-text)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon name="download" size={18} color="var(--fs-accent)" />
                <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>Receiving preferences</span>
              </div>
              <Icon name="chevron_right" size={16} color="var(--fs-text-3)" />
            </button>

            <button
              onClick={onOpenStorage}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: 'var(--fs-radius-row)',
                backgroundColor: 'var(--fs-surface)',
                border: '1px solid var(--fs-separator)',
                color: 'var(--fs-text)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon name="shield" size={18} color="var(--fs-accent)" />
                <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>Storage & Cache</span>
              </div>
              <Icon name="chevron_right" size={16} color="var(--fs-text-3)" />
            </button>

            <button
              onClick={onOpenAdvanced}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: 'var(--fs-radius-row)',
                backgroundColor: 'var(--fs-surface)',
                border: '1px solid var(--fs-separator)',
                color: 'var(--fs-text)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon name="tune" size={18} color="var(--fs-accent)" />
                <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>Advanced settings</span>
              </div>
              <Icon name="chevron_right" size={16} color="var(--fs-text-3)" />
            </button>

            <button
              onClick={onOpenAbout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: 'var(--fs-radius-row)',
                backgroundColor: 'var(--fs-surface)',
                border: '1px solid var(--fs-separator)',
                color: 'var(--fs-text)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon name="info" size={18} color="var(--fs-accent)" />
                <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>About FastShare</span>
              </div>
              <Icon name="chevron_right" size={16} color="var(--fs-text-3)" />
            </button>
          </div>

          {/* Reset Settings Section */}
          <div style={{ paddingTop: '8px' }}>
            <button
              onClick={() => setShowResetConfirm(true)}
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
              <Icon name="restore" size={16} color="var(--fs-danger)" />
              <span>Reset all settings to default</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Reset Settings */}
      {showResetConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--fs-scrim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '16px',
          }}
          onClick={() => setShowResetConfirm(false)}
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
                Reset default settings?
              </h3>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--fs-text-2)', lineHeight: '1.5' }}>
              This will restore your appearance, theme, color accent, device name, receiving preferences, and connection settings to defaults. Your transfer history and paired devices will not be deleted.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button variant="secondary" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmReset}
              >
                Reset to Defaults
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
