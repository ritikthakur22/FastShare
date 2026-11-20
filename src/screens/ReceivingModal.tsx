import { Switch } from '../ui/Switch';
import { Icon } from '../ui/Icon';
import { useStore } from '../core/useStore';
import { settingsStore, updateSettings } from '../core/settings';

export function ReceivingModal() {
  const settings = useStore(settingsStore);

  const items = [
    {
      icon: 'image' as const,
      title: 'Save to gallery',
      desc: 'Photos and videos you receive go to your gallery.',
      checked: settings.saveToGallery,
      onChange: (checked: boolean) => updateSettings({ saveToGallery: checked }),
    },
    {
      icon: 'download' as const,
      title: 'Auto download',
      desc: 'Save files from paired devices without asking first.',
      checked: settings.autoDownload,
      onChange: (checked: boolean) => updateSettings({ autoDownload: checked }),
    },
    {
      icon: 'description' as const,
      title: 'Save several files as one zip',
      desc: 'When more than one file arrives together, save them as a single .zip file.',
      checked: settings.saveAsZip,
      onChange: (checked: boolean) => updateSettings({ saveAsZip: checked }),
    },
    {
      icon: 'info' as const,
      title: 'Notifications',
      desc: 'Tell me when something arrives.',
      checked: settings.notifications,
      onChange: (checked: boolean) => updateSettings({ notifications: checked }),
    },
    {
      icon: 'refresh' as const,
      title: 'Sound',
      desc: 'Play a sound when something arrives.',
      checked: settings.sound,
      onChange: (checked: boolean) => updateSettings({ sound: checked }),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ fontSize: '0.9rem', color: 'var(--fs-text-2)', marginBottom: '8px' }}>
        Choose how you want to receive files
      </p>

      {items.map((item) => (
        <div
          key={item.title}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderRadius: 'var(--fs-radius-row)',
            backgroundColor: 'var(--fs-bg)',
            border: '1px solid var(--fs-separator)',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--fs-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px',
              }}
            >
              <Icon name={item.icon} size={18} color="var(--fs-accent)" />
            </div>
            <div>
              <p style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--fs-text)' }}>
                {item.title}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--fs-text-2)', marginTop: '2px' }}>
                {item.desc}
              </p>
            </div>
          </div>

          <Switch checked={item.checked} onChange={item.onChange} />
        </div>
      ))}
    </div>
  );
}
