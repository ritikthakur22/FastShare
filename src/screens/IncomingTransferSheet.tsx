import { useState } from 'preact/hooks';
import { Sheet } from '../ui/Sheet';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { formatBytes } from '../protocol/format';

export interface IncomingFileItem {
  id: string;
  fileName: string;
  size: number;
  fileType: string;
  preview?: string;
}

export interface IncomingTransferRequest {
  senderId: string;
  alias: string;
  deviceName: string;
  ipNetwork?: boolean;
  files: IncomingFileItem[];
  totalBytes: number;
  sasCode?: string;
}

interface IncomingTransferSheetProps {
  request: IncomingTransferRequest | null;
  open: boolean;
  onAccept: (fileIds: string[]) => void;
  onDecline: () => void;
}

export function IncomingTransferSheet({
  request,
  open,
  onAccept,
  onDecline,
}: IncomingTransferSheetProps) {
  const [skippedIds, setSkippedIds] = useState<string[]>([]);

  if (!request) return null;

  const isWifi = request.ipNetwork !== false;
  const isOne = request.files.length === 1;
  const chosenFiles = request.files.filter((f) => !skippedIds.includes(f.id));

  const toggleSkip = (id: string) => {
    if (skippedIds.includes(id)) {
      setSkippedIds(skippedIds.filter((x) => x !== id));
    } else {
      setSkippedIds([...skippedIds, id]);
    }
  };

  const handleAccept = () => {
    onAccept(chosenFiles.map((f) => f.id));
  };

  return (
    <Sheet open={open} onClose={onDecline} title="" maxWidth="480px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header matching app/incoming.tsx */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--fs-text)' }}>
              {request.alias}
            </h2>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: 'var(--fs-radius-pill)',
                backgroundColor: isWifi ? 'var(--fs-accent-tint)' : 'var(--fs-surface-raised)',
                border: '1px solid var(--fs-separator)',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: isWifi ? 'var(--fs-accent)' : 'var(--fs-text-2)',
              }}
            >
              <Icon name={isWifi ? 'wifi' : 'public'} size={12} />
              <span>{isWifi ? 'Wi-Fi' : 'Internet'}</span>
            </div>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--fs-text-2)' }}>
            wants to send {isOne ? 'a file' : `${request.files.length} files`},{' '}
            {formatBytes(request.totalBytes)}
          </p>
        </div>

        {/* 6-digit SAS Verification Code Banner */}
        {request.sasCode && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              backgroundColor: 'var(--fs-bg)',
              border: '1px solid var(--fs-separator)',
              borderRadius: 'var(--fs-radius-row)',
            }}
          >
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--fs-text-3)', fontWeight: '600', textTransform: 'uppercase' }}>
                Verification Code
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--fs-text-2)', marginTop: '2px' }}>
                Verify this code matches on {request.alias}
              </p>
            </div>
            <span
              style={{
                fontFamily: 'var(--fs-font-mono)',
                fontSize: '1.25rem',
                fontWeight: '800',
                letterSpacing: '2px',
                color: 'var(--fs-accent)',
              }}
            >
              {request.sasCode.slice(0, 3)} {request.sasCode.slice(3)}
            </span>
          </div>
        )}

        {/* File Cards / List */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '260px',
            overflowY: 'auto',
          }}
        >
          {request.files.map((file) => {
            const isSelected = !skippedIds.includes(file.id);
            const isImage = file.fileType.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(file.fileName);

            return (
              <div
                key={file.id}
                onClick={() => !isOne && toggleSkip(file.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  backgroundColor: 'var(--fs-bg)',
                  border: isSelected ? '1px solid var(--fs-separator)' : '1px solid transparent',
                  borderRadius: 'var(--fs-radius-row)',
                  opacity: isSelected ? 1 : 0.45,
                  cursor: isOne ? 'default' : 'pointer',
                  transition: 'opacity var(--fs-transition-fast)',
                }}
              >
                {/* Thumbnail Preview or Kind Icon */}
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--fs-surface-raised)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {file.preview ? (
                    <img
                      src={`data:${file.fileType};base64,${file.preview}`}
                      alt={file.fileName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Icon
                      name={isImage ? 'image' : 'description'}
                      size={22}
                      color="var(--fs-accent)"
                    />
                  )}
                </div>

                {/* File info */}
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
                    {file.fileName}
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--fs-text-2)', marginTop: '2px' }}>
                    {formatBytes(file.size)}
                  </p>
                </div>

                {!isOne && (
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '6px',
                      border: isSelected ? 'none' : '2px solid var(--fs-separator)',
                      backgroundColor: isSelected ? 'var(--fs-accent)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--fs-on-accent)',
                    }}
                  >
                    {isSelected && <Icon name="check" size={14} />}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Buttons matching Native App */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
          <Button variant="secondary" fullWidth onClick={onDecline}>
            Decline
          </Button>
          <Button
            variant="primary"
            fullWidth
            disabled={chosenFiles.length === 0}
            onClick={handleAccept}
          >
            {isOne || chosenFiles.length === request.files.length
              ? 'Accept'
              : `Accept (${chosenFiles.length})`}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
