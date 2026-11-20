import { useState } from 'preact/hooks';
import { Sheet } from '../ui/Sheet';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { TransferRecord } from '../core/transfers';
import { formatBytes } from '../protocol/format';
import { extractSafeLinks } from '../protocol/webText';

interface TransferDetailModalProps {
  transfer: TransferRecord | null;
  open: boolean;
  onClose: () => void;
}

export function TransferDetailModal({ transfer, open, onClose }: TransferDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!transfer) return null;

  const content = transfer.textPayload || transfer.name;
  const isText = Boolean(transfer.textPayload) || transfer.id.startsWith('msg-') || transfer.id.startsWith('sent-') || transfer.id.startsWith('text-');
  const isLegacyTruncated = !transfer.textPayload && transfer.name.endsWith('...') && transfer.size > transfer.name.length;
  const links = extractSafeLinks(content);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // clipboard access denied
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: isText ? 'FastShare Note' : transfer.name,
          text: content,
        });
      } catch {
        // dismissed
      }
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isText ? 'Note Details' : 'Transfer Details'}
      maxWidth="480px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header Metadata Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            backgroundColor: 'var(--fs-surface-raised)',
            borderRadius: 'var(--fs-radius-row)',
            border: '1px solid var(--fs-separator)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: transfer.direction === 'sent' ? '#10B981' : 'var(--fs-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <Icon
                name={transfer.direction === 'sent' ? 'check' : 'arrow_down'}
                size={16}
                color="#FFFFFF"
              />
            </div>
            <div>
              <p style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--fs-text)' }}>
                {transfer.direction === 'sent' ? 'Sent to' : 'Received from'} {transfer.peerName}
              </p>
              <p style={{ fontSize: '0.74rem', color: 'var(--fs-text-2)', marginTop: '1px' }}>
                {formatDate(transfer.timestamp)} • {formatBytes(transfer.size)}
              </p>
            </div>
          </div>

          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              padding: '3px 8px',
              borderRadius: 'var(--fs-radius-pill)',
              backgroundColor: 'var(--fs-bg)',
              color: 'var(--fs-text-2)',
              border: '1px solid var(--fs-separator)',
            }}
          >
            {isText ? 'Text / Note' : 'File'}
          </span>
        </div>

        {/* Full Content View Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--fs-text-2)' }}>
              {isText ? 'Message Content' : 'File Name'}
            </span>
            {isText && (
              <span style={{ fontSize: '0.74rem', color: 'var(--fs-text-3)' }}>
                {content.length} characters
              </span>
            )}
          </div>

          <div
            style={{
              padding: '14px',
              backgroundColor: 'var(--fs-bg)',
              borderRadius: 'var(--fs-radius-control)',
              border: '1px solid var(--fs-separator)',
              maxHeight: '300px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'inherit',
              fontSize: '0.92rem',
              lineHeight: 1.5,
              color: 'var(--fs-text)',
              userSelect: 'text',
            }}
          >
            {content}
          </div>

          {isLegacyTruncated && (
            <p style={{ fontSize: '0.74rem', color: 'var(--fs-text-3)', fontStyle: 'italic', marginTop: '2px' }}>
              * This legacy message was received before the full clipboard update. Any new message or clipboard sent now preserves 100% full content.
            </p>
          )}
        </div>

        {/* Auto-detected Links Section */}
        {links.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--fs-text-2)' }}>
              Detected Links
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {links.map((link, idx) => (
                <a
                  key={idx}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '8px 12px',
                    backgroundColor: 'var(--fs-surface)',
                    border: '1px solid var(--fs-separator)',
                    borderRadius: 'var(--fs-radius-row)',
                    color: 'var(--fs-accent)',
                    fontSize: '0.84rem',
                    textDecoration: 'none',
                  }}
                  className="fs-hover-dim"
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {link}
                  </span>
                  <Icon name="link" size={14} color="var(--fs-accent)" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          <div style={{ flex: 1 }}>
            <Button
              variant="primary"
              onClick={handleCopy}
              icon={<Icon name={copied ? 'check' : 'content_copy'} size={16} />}
              fullWidth
            >
              {copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}
            </Button>
          </div>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button
              variant="secondary"
              onClick={handleShare}
              icon={<Icon name="share" size={16} />}
            >
              Share
            </Button>
          )}
        </div>
      </div>
    </Sheet>
  );
}
