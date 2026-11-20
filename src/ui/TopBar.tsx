import { useState } from 'preact/hooks';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { BrandMark } from './BrandMark';
import { useStore } from '../core/useStore';
import { settingsStore, updateSettings } from '../core/settings';
import { signalingStore } from '../core/signaling';
import { showBrowserNotification, pushToast, playNotificationSound } from '../core/notifications';

interface TopBarProps {
  onEditDeviceName: () => void;
  onOpenLinkDevices: () => void;
  onOpenSettings: () => void;
  onOpenClipboard: () => void;
}

export function TopBar({
  onEditDeviceName,
  onOpenLinkDevices,
  onOpenSettings,
  onOpenClipboard,
}: TopBarProps) {
  const settings = useStore(settingsStore);
  const signaling = useStore(signalingStore);

  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const handleToggleNotification = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (notifPermission === 'default') {
      try {
        const perm = await Notification.requestPermission();
        setNotifPermission(perm);
        if (perm === 'granted') {
          updateSettings({ notifications: true });
          playNotificationSound('sent');
          showBrowserNotification('FastShare Notifications Active', {
            body: 'You will receive desktop alerts when files are sent or received.',
          });
          pushToast({
            type: 'info',
            title: 'Notifications Active',
            message: 'You will receive alerts when files are sent or received.',
          });
        }
      } catch {
        // blocked
      }
    } else if (notifPermission === 'granted') {
      const next = !settings.notifications;
      updateSettings({ notifications: next });
      if (next) playNotificationSound('sent');
      pushToast({
        type: 'info',
        title: next ? 'Notifications Enabled' : 'Notifications Muted',
        message: next
          ? 'Alerts will appear for sent and received files.'
          : 'Transfer alerts are paused.',
      });
    }
  };

  const isNotifActive = notifPermission === 'granted' && settings.notifications;

  return (
    <header
      style={{
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        borderBottom: '1px solid var(--fs-separator)',
        backgroundColor: 'var(--fs-bg)',
        flexShrink: 0,
      }}
    >
      {/* Device Info & Status Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="fs-mobile-brand" style={{ display: 'none', alignItems: 'center', gap: '8px' }}>
          <BrandMark size={26} />
          <span style={{ fontSize: '1.15rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--fs-text)' }}>
            FastShare
          </span>
          <span style={{ color: 'var(--fs-separator)', marginLeft: '4px' }}>|</span>
        </div>

        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: signaling.connected ? '#10B981' : '#F59E0B',
            boxShadow: signaling.connected ? '0 0 8px #10B981' : 'none',
          }}
        />
        <span style={{ fontSize: '0.9rem', color: 'var(--fs-text-2)', fontWeight: '500' }}>
          {signaling.connected ? 'Online' : 'Connecting...'}
        </span>
        <span style={{ color: 'var(--fs-separator)' }}>|</span>
        <div
          onClick={onEditDeviceName}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '6px',
            transition: 'background-color var(--fs-transition-fast)',
          }}
          className="fs-hover-dim"
        >
          <span style={{ fontSize: '0.9rem', color: 'var(--fs-text)', fontWeight: '600' }}>
            Device: {settings.deviceName}
          </span>
          <Icon name="edit" size={14} color="var(--fs-text-2)" />
        </div>
      </div>

      {/* Right Action Icons matching Native App Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Enable Notification Permission Button */}
        <IconButton
          title={
            isNotifActive
              ? 'Notifications enabled'
              : notifPermission === 'denied'
              ? 'Notifications blocked by browser'
              : 'Enable notifications to know when files arrive'
          }
          size={36}
          onClick={handleToggleNotification}
          active={isNotifActive}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon
              name={notifPermission === 'denied' ? 'notifications_off' : 'notifications'}
              size={18}
              color={isNotifActive ? 'var(--fs-accent)' : notifPermission === 'denied' ? 'var(--fs-text-3)' : 'var(--fs-text)'}
            />
            {notifPermission === 'default' && (
              <div
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--fs-warning)',
                }}
              />
            )}
          </div>
        </IconButton>

        {/* Clipboard History Button */}
        <IconButton title="Saved text clips & clipboard" size={36} onClick={onOpenClipboard}>
          <Icon name="clipboard" size={18} />
        </IconButton>

        {/* Link Devices (Pairing & Public Rooms) Button */}
        <IconButton title="Link a device" size={36} onClick={onOpenLinkDevices}>
          <Icon name="link" size={18} />
        </IconButton>

        {/* Settings Button */}
        <IconButton title="Settings" size={36} onClick={onOpenSettings}>
          <Icon name="settings" size={18} />
        </IconButton>
      </div>
    </header>
  );
}
