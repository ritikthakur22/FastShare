import { Icon, IconName } from '../ui/Icon';
import { TransferRecord } from '../core/transfers';
import { formatBytes } from '../protocol/format';

interface RecentActivityPanelProps {
  history: TransferRecord[];
  onViewAll: () => void;
}

export function RecentActivityPanel({ history, onViewAll }: RecentActivityPanelProps) {
  const getFileIcon = (name: string): IconName => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (ext && ['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return 'movie';
    return 'description';
  };

  const getTimeAgo = (timestamp: number): string => {
    const diffMins = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    return `${Math.floor(diffHours / 24)} days ago`;
  };

  const items = history.slice(0, 5);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="history" size={18} color="var(--fs-text-2)" />
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--fs-text)' }}>
            Recent Activity
          </h3>
        </div>

        <button
          onClick={onViewAll}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.85rem',
            fontWeight: '600',
            color: 'var(--fs-accent)',
            cursor: 'pointer',
          }}
        >
          <span>View all</span>
          <Icon name="chevron_right" size={14} color="var(--fs-accent)" />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--fs-text-3)', padding: '16px 0' }}>
            No transfers yet. Drop files to get started.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 'var(--fs-radius-row)',
                backgroundColor: 'var(--fs-surface)',
                border: '1px solid var(--fs-separator)',
                gap: '12px',
              }}
            >
              {/* File Icon */}
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--fs-surface-raised)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name={getFileIcon(item.name)} size={20} color="var(--fs-accent)" />
              </div>

              {/* File Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: 'var(--fs-text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.name}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--fs-text-2)', marginTop: '2px' }}>
                  {item.direction === 'sent' ? 'Sent' : 'Received'} • {formatBytes(item.size)}
                </p>
              </div>

              {/* Time and Status Badge */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--fs-text-3)', display: 'block' }}>
                  {getTimeAgo(item.timestamp)}
                </span>
                <div style={{ marginTop: '2px', display: 'flex', justifyContent: 'flex-end' }}>
                  {item.direction === 'sent' ? (
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: '#10B981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name="check" size={10} color="#FFFFFF" />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--fs-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name="arrow_down" size={10} color="var(--fs-on-accent)" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
