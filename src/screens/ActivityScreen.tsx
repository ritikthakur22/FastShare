import { useState } from 'preact/hooks';
import { Icon, IconName } from '../ui/Icon';
import { Chip } from '../ui/Chip';
import { Button } from '../ui/Button';
import { TransferRecord, clearHistory } from '../core/transfers';
import { formatBytes } from '../protocol/format';

interface ActivityScreenProps {
  history: TransferRecord[];
  onClearHistory?: () => void;
  onSelectTransfer?: (item: TransferRecord) => void;
}

export function ActivityScreen({ history, onSelectTransfer }: ActivityScreenProps) {
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');
  const [timeframe, setTimeframe] = useState<'30' | '7' | 'all'>('30');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredItems = history.filter((item) => {
    if (filter === 'sent' && item.direction !== 'sent') return false;
    if (filter === 'received' && item.direction !== 'received') return false;
    return true;
  });

  const getFileIcon = (item: TransferRecord): IconName => {
    if (item.textPayload || item.id.startsWith('msg-') || item.id.startsWith('sent-')) {
      return 'description';
    }
    const ext = item.name.split('.').pop()?.toLowerCase();
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

  const handleCopy = async (e: MouseEvent, item: TransferRecord) => {
    e.stopPropagation();
    const content = item.textPayload || item.name;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
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
      {/* Header matching Showcase */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--fs-text)' }}>
            Transfers / Activity
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--fs-text-2)', marginTop: '4px' }}>
            Your file transfers and messages
          </p>
        </div>

        {history.length > 0 && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowClearConfirm(true)}
            icon={<Icon name="delete" size={16} />}
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Filter Chips & Timeframe Filter */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
            All
          </Chip>
          <Chip active={filter === 'sent'} onClick={() => setFilter('sent')}>
            Sent
          </Chip>
          <Chip active={filter === 'received'} onClick={() => setFilter('received')}>
            Received
          </Chip>
        </div>

        {/* Dropdown for timeframe */}
        <select
          value={timeframe}
          onChange={(e) => setTimeframe((e.target as HTMLSelectElement).value as '30' | '7' | 'all')}
          style={{
            backgroundColor: 'var(--fs-surface)',
            border: '1px solid var(--fs-separator)',
            color: 'var(--fs-text)',
            borderRadius: 'var(--fs-radius-pill)',
            padding: '6px 14px',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Activity List matching Showcase */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredItems.length === 0 ? (
          <div
            style={{
              padding: '48px',
              textAlign: 'center',
              backgroundColor: 'var(--fs-surface)',
              borderRadius: 'var(--fs-radius-card)',
              border: '1px solid var(--fs-separator)',
              color: 'var(--fs-text-2)',
            }}
          >
            No transfer history matching your filters.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isText = Boolean(item.textPayload) || item.id.startsWith('msg-') || item.id.startsWith('sent-');

            return (
              <div
                key={item.id}
                onClick={() => onSelectTransfer?.(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: 'var(--fs-radius-card)',
                  backgroundColor: 'var(--fs-surface)',
                  border: '1px solid var(--fs-separator)',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'background-color var(--fs-transition-fast)',
                }}
                className="fs-hover-dim"
                title="Tap to view note or transfer details"
              >
                {/* File Icon */}
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--fs-surface-raised)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon name={getFileIcon(item)} size={24} color="var(--fs-accent)" />
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--fs-text)' }}>
                    {item.name}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--fs-text-2)', marginTop: '2px' }}>
                    {item.direction === 'sent' ? `Sent to ${item.peerName}` : `Received from ${item.peerName}`}
                  </p>
                </div>

                {/* 1-Tap Copy Button for Clipboard & Text Notes */}
                {isText && (
                  <button
                    onClick={(e) => handleCopy(e, item)}
                    title="Copy note to clipboard"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: copiedId === item.id ? 'var(--fs-accent)' : 'var(--fs-bg)',
                      border: '1px solid var(--fs-separator)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: copiedId === item.id ? 'var(--fs-on-accent)' : 'var(--fs-text-2)',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all var(--fs-transition-fast)',
                    }}
                  >
                    <Icon name={copiedId === item.id ? 'check' : 'content_copy'} size={17} />
                  </button>
                )}

                {/* Size & Time */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--fs-text)' }}>
                    {formatBytes(item.size)}
                  </p>
                  <span style={{ fontSize: '0.8rem', color: 'var(--fs-text-3)', marginTop: '2px', display: 'block' }}>
                    {getTimeAgo(item.timestamp)}
                  </span>
                </div>

                {/* Status Circle Badge matching Showcase */}
                <div style={{ flexShrink: 0 }}>
                  {item.direction === 'sent' ? (
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#10B981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name="check" size={14} color="#FFFFFF" />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--fs-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name="arrow_down" size={14} color="var(--fs-on-accent)" />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Dialog for Clearing History */}
      {showClearConfirm && (
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
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--fs-surface)',
              border: '1px solid var(--fs-separator)',
              borderRadius: 'var(--fs-radius-card)',
              padding: '24px',
              maxWidth: '400px',
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
                <Icon name="delete" size={18} color="var(--fs-danger)" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--fs-text)' }}>
                Clear transfer history?
              </h3>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--fs-text-2)', lineHeight: '1.5' }}>
              This will remove all records from your activity list. This cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button variant="secondary" onClick={() => setShowClearConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  clearHistory();
                  setShowClearConfirm(false);
                }}
              >
                Clear History
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
