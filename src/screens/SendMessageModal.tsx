import { useState } from 'preact/hooks';
import { Button } from '../ui/Button';

interface SendMessageModalProps {
  onSend: (text: string) => void;
  onCancel: () => void;
}

export function SendMessageModal({ onSend, onCancel }: SendMessageModalProps) {
  const [text, setText] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ fontSize: '0.9rem', color: 'var(--fs-text-2)' }}>
        Type or paste a message, text snippet, or link to send instantly over WebRTC.
      </p>

      <textarea
        value={text}
        onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (text.trim()) {
              onSend(text.trim());
              setText('');
            }
          }
        }}
        placeholder="Type a message or paste a link (Ctrl + Enter to send)..."
        rows={4}
        maxLength={4000}
        style={{
          width: '100%',
          backgroundColor: 'var(--fs-bg)',
          border: '1px solid var(--fs-separator)',
          borderRadius: 'var(--fs-radius-control)',
          padding: '12px',
          color: 'var(--fs-text)',
          fontSize: '0.95rem',
          resize: 'vertical',
          outline: 'none',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--fs-text-3)' }}>
          {text.length} / 4000 characters • Ctrl + Enter to send
        </span>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (text.trim()) {
                onSend(text.trim());
                setText('');
              }
            }}
            disabled={!text.trim()}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
