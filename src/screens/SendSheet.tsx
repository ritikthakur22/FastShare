import { useState, useRef } from 'preact/hooks';
import { Sheet } from '../ui/Sheet';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { DiscoveredPeer } from '../core/peers';
import { generateConnectionCode } from '../protocol/connectionCode';

interface SendSheetProps {
  peer: DiscoveredPeer | null;
  open: boolean;
  onClose: () => void;
  onSendFiles: (peer: DiscoveredPeer, files: File[]) => void;
  onSendText: (peer: DiscoveredPeer, text: string) => void;
}

export function SendSheet({
  peer,
  open,
  onClose,
  onSendFiles,
  onSendText,
}: SendSheetProps) {
  const [text, setText] = useState('');
  const [pairingSas, setPairingSas] = useState<string | null>(null);
  const [isPairing, setIsPairing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  if (!peer) return null;

  const isWifi = peer.ipNetwork !== false;
  const isLaptop =
    peer.displayName.toLowerCase().includes('pc') ||
    peer.deviceName.toLowerCase().includes('chrome') ||
    peer.displayName.toLowerCase().includes('laptop');

  const handleMediaPick = () => {
    mediaInputRef.current?.click();
  };

  const handleFilesPick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesChanged = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      onSendFiles(peer, Array.from(target.files));
      target.value = '';
      onClose();
    }
  };

  const handleSendClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText && clipText.trim()) {
        onSendText(peer, clipText.trim());
        onClose();
      }
    } catch {
      // Clipboard access denied or not supported
    }
  };

  const handleSendText = () => {
    if (text.trim()) {
      onSendText(peer, text.trim());
      setText('');
      onClose();
    }
  };

  const handleStartPair = () => {
    setIsPairing(true);
    // Generate a 6-digit SAS pairing code
    const code = generateConnectionCode(Date.now().toString(), peer.id);
    setPairingSas(code);
  };

  return (
    <Sheet open={open} onClose={onClose} title="" maxWidth="480px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Hidden File Inputs */}
        <input
          ref={mediaInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFilesChanged}
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFilesChanged}
        />

        {/* Device Header Row matching native app send/[id].tsx */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              position: 'relative',
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: 'var(--fs-surface-raised)',
              border: '1.5px solid var(--fs-separator)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon
              name={isLaptop ? 'laptop' : 'smartphone'}
              size={26}
              color="var(--fs-accent)"
            />
            {/* Network Badge on Avatar (Wi-Fi or Internet) */}
            <div
              style={{
                position: 'absolute',
                right: '-2px',
                bottom: '-2px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: isWifi ? 'var(--fs-accent)' : 'var(--fs-surface)',
                border: '2px solid var(--fs-surface-raised)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isWifi ? 'var(--fs-on-accent)' : 'var(--fs-text-2)',
              }}
            >
              <Icon name={isWifi ? 'wifi' : 'public'} size={11} />
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                fontSize: '1.2rem',
                fontWeight: '700',
                color: 'var(--fs-text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {peer.displayName}
            </h2>
            <p
              style={{
                fontSize: '0.82rem',
                color: isWifi ? 'var(--fs-accent)' : 'var(--fs-text-2)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '2px',
                fontWeight: isWifi ? '600' : '400',
              }}
            >
              <Icon name={isWifi ? 'wifi' : 'public'} size={14} />
              <span>
                {isWifi
                  ? 'Wi-Fi • Direct local transfer'
                  : 'Internet • WebRTC transfer'}
              </span>
            </p>
          </div>
        </div>

        {/* Pairing Verification SAS View */}
        {isPairing ? (
          <div
            style={{
              backgroundColor: 'var(--fs-bg)',
              border: '1px solid var(--fs-separator)',
              borderRadius: 'var(--fs-radius-row)',
              padding: '20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <p style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--fs-text)' }}>
              Pair with {peer.displayName}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--fs-text-2)' }}>
              Confirm this 6-digit verification code matches on {peer.displayName}:
            </p>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: '800',
                letterSpacing: '6px',
                color: 'var(--fs-accent)',
                fontFamily: 'var(--fs-font-mono)',
                margin: '8px 0',
              }}
            >
              {pairingSas ? `${pairingSas.slice(0, 3)} ${pairingSas.slice(3)}` : '...'}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--fs-text-3)' }}>
              Waiting for other device to confirm...
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setIsPairing(false);
                setPairingSas(null);
              }}
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            {/* Options List matching Native App */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Option 1: Photos & Videos */}
              <button
                onClick={handleMediaPick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  borderRadius: 'var(--fs-radius-row)',
                  backgroundColor: 'var(--fs-bg)',
                  border: '1px solid var(--fs-separator)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color var(--fs-transition-fast)',
                }}
                className="fs-hover-dim"
              >
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
                  <Icon name="image" size={22} color="var(--fs-accent)" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--fs-text)' }}>
                    Photos & Videos
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--fs-text-2)', marginTop: '2px' }}>
                    Images and videos from gallery
                  </p>
                </div>
                <Icon name="chevron_right" size={20} color="var(--fs-text-3)" />
              </button>

              {/* Option 2: Files & Documents */}
              <button
                onClick={handleFilesPick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  borderRadius: 'var(--fs-radius-row)',
                  backgroundColor: 'var(--fs-bg)',
                  border: '1px solid var(--fs-separator)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color var(--fs-transition-fast)',
                }}
                className="fs-hover-dim"
              >
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
                  <Icon name="description" size={22} color="var(--fs-accent)" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--fs-text)' }}>
                    Files & Documents
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--fs-text-2)', marginTop: '2px' }}>
                    PDFs, archives, folders, any file
                  </p>
                </div>
                <Icon name="chevron_right" size={20} color="var(--fs-text-3)" />
              </button>

              {/* Option 3: Send Clipboard */}
              <button
                onClick={handleSendClipboard}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  borderRadius: 'var(--fs-radius-row)',
                  backgroundColor: 'var(--fs-bg)',
                  border: '1px solid var(--fs-separator)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color var(--fs-transition-fast)',
                }}
                className="fs-hover-dim"
              >
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
                  <Icon name="content_copy" size={20} color="var(--fs-accent)" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--fs-text)' }}>
                    Send Clipboard
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--fs-text-2)', marginTop: '2px' }}>
                    Paste and send clipboard text immediately
                  </p>
                </div>
                <Icon name="chevron_right" size={20} color="var(--fs-text-3)" />
              </button>

              {/* Option 4: Pair Device */}
              <button
                onClick={handleStartPair}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  borderRadius: 'var(--fs-radius-row)',
                  backgroundColor: 'var(--fs-bg)',
                  border: '1px solid var(--fs-separator)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color var(--fs-transition-fast)',
                }}
                className="fs-hover-dim"
              >
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
                  <Icon name="link" size={22} color="var(--fs-accent)" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--fs-text)' }}>
                    Pair device
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--fs-text-2)', marginTop: '2px' }}>
                    Compare 6-digit code and trust for auto-transfers
                  </p>
                </div>
                <Icon name="chevron_right" size={20} color="var(--fs-text-3)" />
              </button>
            </div>

            {/* Send Text or Link Area */}
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
                placeholder="Type or paste a text or link"
                value={text}
                onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
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
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  size="sm"
                  disabled={text.trim().length === 0}
                  onClick={handleSendText}
                  icon={<Icon name="send" size={14} />}
                >
                  Send text
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}
