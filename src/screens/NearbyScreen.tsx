import { useState } from 'preact/hooks';
import { Radar } from './Radar';
import { DropZone } from './DropZone';
import { RecentActivityPanel } from './RecentActivityPanel';
import { SendTray } from './SendTray';
import { Icon } from '../ui/Icon';
import { DiscoveredPeer } from '../core/peers';
import { TransferRecord } from '../core/transfers';

interface NearbyScreenProps {
  peers: DiscoveredPeer[];
  history: TransferRecord[];
  stagedFiles: File[];
  onSelectPeerForSend: (peer: DiscoveredPeer) => void;
  onFilesSelected: (files: File[]) => void;
  onClearStaged: () => void;
  onSendStagedToAll: () => void;
  onSendMessageClick: () => void;
  onViewAllActivity: () => void;
  onRefresh: () => void;
  onOpenLinkDevices?: () => void;
}

export function NearbyScreen({
  peers,
  history,
  stagedFiles,
  onSelectPeerForSend,
  onFilesSelected,
  onClearStaged,
  onSendStagedToAll,
  onSendMessageClick,
  onViewAllActivity,
  onRefresh,
  onOpenLinkDevices,
}: NearbyScreenProps) {
  const [isWindowDragOver, setIsWindowDragOver] = useState(false);

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer?.types?.includes('Files')) {
      setIsWindowDragOver(true);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDragLeave = (e: DragEvent) => {
    if (!e.relatedTarget || (e.relatedTarget as HTMLElement).nodeName === 'HTML') {
      setIsWindowDragOver(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsWindowDragOver(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        display: 'flex',
        flex: 1,
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
      className="fs-nearby-container"
    >
      {/* Center Radar Area */}
      <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <Radar
          peers={peers}
          onSelectPeerForSend={onSelectPeerForSend}
          onRefresh={onRefresh}
          onOpenLinkDevices={onOpenLinkDevices}
        />

        {/* Full-screen Drop Overlay when dragging files onto Radar */}
        {isWindowDragOver && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'var(--fs-scrim)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              zIndex: 50,
              border: '2px dashed var(--fs-accent)',
              borderRadius: 'var(--fs-radius-card)',
              margin: '16px',
              pointerEvents: 'none',
              animation: 'fs-toast-slide 180ms ease-out',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--fs-accent-tint)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="download" size={32} color="var(--fs-accent)" />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--fs-text)' }}>
              Drop files anywhere
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--fs-text-2)' }}>
              Release to queue files for sending to nearby devices
            </p>
          </div>
        )}

        {/* Floating Send Tray matching native app SendTray.tsx */}
        {stagedFiles.length > 0 && (
          <SendTray
            title={`${stagedFiles.length} ${stagedFiles.length === 1 ? 'item' : 'items'} ready to send`}
            detail="Tap one or more devices on the radar to send"
            onClear={onClearStaged}
            action={
              peers.length > 1
                ? {
                    label: `Send to all ${peers.length} devices`,
                    onPress: onSendStagedToAll,
                  }
                : undefined
            }
          />
        )}
      </div>

      {/* Right Send & Activity Column in 3-pane desktop layout */}
      <aside
        className="fs-desktop-right-panel"
        style={{
          width: '380px',
          height: '100%',
          backgroundColor: 'var(--fs-bg)',
          borderLeft: '1px solid var(--fs-separator)',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          flexShrink: 0,
        }}
      >
        <DropZone
          onFilesSelected={onFilesSelected}
          onSendMessageClick={onSendMessageClick}
        />

        <RecentActivityPanel
          history={history}
          onViewAll={onViewAllActivity}
        />
      </aside>
    </div>
  );
}
