import { useRef, useState } from 'preact/hooks';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  onSendMessageClick: () => void;
}

export function DropZone({ onFilesSelected, onSendMessageClick }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--fs-text)', marginBottom: '12px' }}>
        Send files
      </h3>

      {/* Hidden file input */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={(e) => {
          const files = (e.target as HTMLInputElement).files;
          if (files && files.length > 0) {
            onFilesSelected(Array.from(files));
          }
        }}
        style={{ display: 'none' }}
      />

      {/* Drag & Drop Card */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: isDragOver ? '2px dashed var(--fs-accent)' : '2px dashed var(--fs-separator)',
          borderRadius: 'var(--fs-radius-card)',
          backgroundColor: isDragOver ? 'var(--fs-accent-tint)' : 'var(--fs-surface)',
          padding: '32px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'all var(--fs-transition-fast)',
          marginBottom: '16px',
        }}
      >
        <div style={{ marginBottom: '8px' }}>
          <Icon name="download" size={32} color="var(--fs-accent)" />
        </div>
        <p style={{ fontWeight: '600', color: 'var(--fs-text)', fontSize: '0.95rem' }}>
          Drag and drop files here
        </p>
        <span style={{ fontSize: '0.8rem', color: 'var(--fs-text-2)', marginTop: '2px' }}>
          or choose files
        </span>
      </div>

      {/* Action Buttons matching Showcase */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <Button
          variant="primary"
          onClick={() => fileInputRef.current?.click()}
          icon={<Icon name="send" size={16} />}
        >
          Send files
        </Button>

        <Button
          variant="secondary"
          onClick={onSendMessageClick}
          icon={<Icon name="message" size={16} />}
        >
          Send message
        </Button>
      </div>
    </div>
  );
}
