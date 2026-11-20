import { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { IconButton } from './IconButton';
import { Icon } from './Icon';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ComponentChildren;
  maxWidth?: string;
}

export function Sheet({ open, onClose, title, children, maxWidth = '540px' }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  if (!open) return null;

  const titleId = `sheet-title-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="fs-sheet-dialog"
      style={{
        border: 'none',
        borderRadius: 'var(--fs-radius-sheet)',
        backgroundColor: 'var(--fs-surface)',
        color: 'var(--fs-text)',
        padding: '0',
        width: 'calc(100% - 32px)',
        maxWidth,
        margin: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        outline: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Mobile top drag handle */}
      <div className="fs-sheet-drag-handle" />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--fs-separator)',
        }}
      >
        <h2 id={titleId} style={{ fontSize: '1.2rem', fontWeight: '600' }}>{title}</h2>
        <IconButton size={36} onClick={onClose} title="Close">
          <Icon name="close" size={18} />
        </IconButton>
      </div>

      <div
        className="fs-sheet-content"
        style={{
          padding: '20px',
          maxHeight: 'min(78dvh, 600px)',
          overflowY: 'auto',
        }}
      >
        {children}
      </div>
    </dialog>
  );
}
