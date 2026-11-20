import { useState } from 'preact/hooks';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { TextField } from '../ui/TextField';
import { useStore } from '../core/useStore';
import { transfersStore, removeTransferRecord, addTransferRecord } from '../core/transfers';

interface ClipboardModalProps {
  onSendText?: (text: string) => void;
  onClose: () => void;
}

export function ClipboardModal({ onSendText, onClose }: ClipboardModalProps) {
  const transfers = useStore(transfersStore);
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [composeText, setComposeText] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  // Filter transfer records that are text clips/messages
  const textClips = transfers.history.filter((item) => {
    // If name doesn't look like a standard file with extension, or has message id
    return item.id.startsWith('msg-') || item.id.startsWith('text-') || !/\.[a-zA-Z0-9]{2,5}$/.test(item.name);
  });

  const filtered = textClips.filter((clip) =>
    clip.name.toLowerCase().includes(query.toLowerCase()) ||
    clip.peerName.toLowerCase().includes(query.toLowerCase())
  );

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleDelete = (id: string) => {
    removeTransferRecord(id);
  };

  const handleSendClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        onSendText?.(text.trim());
        onClose();
      }
    } catch {
      // clipboard access denied
    }
  };

  const handleComposeSubmit = () => {
    if (composeText.trim()) {
      addTransferRecord({
        id: `text-${Date.now()}`,
        peerId: 'self',
        peerName: 'Nearby Device',
        direction: 'sent',
        name: composeText.trim(),
        size: composeText.trim().length,
        timestamp: Date.now(),
        status: 'completed',
      });
      onSendText?.(composeText.trim());
      setComposeText('');
      setIsComposing(false);
      onClose();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header details */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--fs-text-2)' }}>
            {textClips.length === 1 ? '1 clip' : `${textClips.length} clips`} sent and received
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSendClipboard}
            icon={<Icon name="clipboard" size={14} />}
          >
            Send Clipboard
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsComposing(!isComposing)}
            icon={<Icon name="edit" size={14} />}
          >
            Compose
          </Button>
        </div>
      </div>

      {/* Compose Drawer */}
      {isComposing && (
        <div
          style={{
            backgroundColor: 'var(--fs-bg)',
            border: '1px solid var(--fs-separator)',
            borderRadius: 'var(--fs-radius-row)',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <textarea
            placeholder="Type or paste a message to share with nearby devices..."
            value={composeText}
            onInput={(e) => setComposeText((e.target as HTMLTextAreaElement).value)}
            rows={3}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: 'var(--fs-text)',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button size="sm" variant="secondary" onClick={() => setIsComposing(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={composeText.trim().length === 0}
              onClick={handleComposeSubmit}
              icon={<Icon name="send" size={14} />}
            >
              Ready to send
            </Button>
          </div>
        </div>
      )}

      {/* Search Input */}
      {textClips.length > 2 && (
        <TextField
          value={query}
          onChange={setQuery}
          placeholder="Search clips..."
        />
      )}

      {/* Clips List */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxHeight: '340px',
          overflowY: 'auto',
        }}
      >
        {filtered.length === 0 ? (
          <div
            style={{
              padding: '36px 16px',
              textAlign: 'center',
              color: 'var(--fs-text-3)',
              fontSize: '0.9rem',
            }}
          >
            <Icon name="clipboard" size={32} color="var(--fs-separator)" />
            <p style={{ marginTop: '10px', fontWeight: '600' }}>No saved text clips</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--fs-text-2)', marginTop: '4px' }}>
              Text and links received from nearby devices appear here.
            </p>
          </div>
        ) : (
          filtered.map((clip) => {
            const isCopied = copiedId === clip.id;
            const timeStr = new Date(clip.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={clip.id}
                style={{
                  backgroundColor: 'var(--fs-bg)',
                  border: '1px solid var(--fs-separator)',
                  borderRadius: 'var(--fs-radius-row)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--fs-text-2)', fontWeight: '600' }}>
                    {clip.direction === 'sent' ? 'Sent to' : 'From'} {clip.peerName}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--fs-text-3)' }}>
                    {timeStr}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--fs-text)',
                    lineHeight: '1.45',
                    wordBreak: 'break-word',
                    userSelect: 'text',
                  }}
                >
                  {clip.name}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopy(clip.id, clip.name)}
                    icon={<Icon name={isCopied ? 'check' : 'content_copy'} size={13} />}
                  >
                    {isCopied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(clip.id)}
                    icon={<Icon name="delete" size={13} />}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
