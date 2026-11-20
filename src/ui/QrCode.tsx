import { encode } from 'uqr';

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QrCode({ value, size = 180, className = '' }: QrCodeProps) {
  const qr = encode(value);
  const matrix = qr.data;
  const count = matrix.length;
  const padding = 2; // 2 modules quiet zone
  const total = count + padding * 2;

  let path = '';
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (matrix[r][c]) {
        path += `M${c + padding},${r + padding}h1v1h-1z `;
      }
    }
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        padding: '12px',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      }}
      className={className}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${total} ${total}`}
        fill="#000000"
        aria-label="QR Code"
      >
        <path d={path} />
      </svg>
    </div>
  );
}
