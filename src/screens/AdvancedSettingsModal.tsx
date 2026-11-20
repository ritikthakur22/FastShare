import { useState } from 'preact/hooks';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { TextField } from '../ui/TextField';
import { useStore } from '../core/useStore';
import { settingsStore, updateSettings, DEFAULT_SERVER_URL, DEFAULT_ICE_SERVERS } from '../core/settings';
import { signalingStore, refreshConnection } from '../core/signaling';

export function AdvancedSettingsModal() {
  const settings = useStore(settingsStore);
  const signaling = useStore(signalingStore);

  const [serverUrlInput, setServerUrlInput] = useState(settings.serverUrl);
  const [newIceInput, setNewIceInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedDebug, setCopiedDebug] = useState(false);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSaveServer = () => {
    const trimmed = serverUrlInput.trim();
    if (!trimmed) return;
    updateSettings({ serverUrl: trimmed });
    refreshConnection();
    showStatus('Signaling server updated & reconnected');
  };

  const handleResetServer = () => {
    setServerUrlInput(DEFAULT_SERVER_URL);
    updateSettings({ serverUrl: DEFAULT_SERVER_URL });
    refreshConnection();
    showStatus('Reset to default signaling server');
  };

  const handleAddIceServer = () => {
    const trimmed = newIceInput.trim();
    if (!trimmed) return;
    if (settings.iceServers.includes(trimmed)) {
      setNewIceInput('');
      return;
    }
    const updated = [...settings.iceServers, trimmed];
    updateSettings({ iceServers: updated });
    setNewIceInput('');
    showStatus('Added custom ICE server');
  };

  const handleRemoveIceServer = (serverToRemove: string) => {
    const updated = settings.iceServers.filter((s) => s !== serverToRemove);
    updateSettings({ iceServers: updated });
    showStatus('Removed ICE server');
  };

  const handleResetIceServers = () => {
    updateSettings({ iceServers: [...DEFAULT_ICE_SERVERS] });
    showStatus('Reset to default ICE servers');
  };

  const handleCopyDebugInfo = async () => {
    const info = {
      app: 'FastShare Web',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      language: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
      platform: typeof navigator !== 'undefined' ? (navigator as any).userAgentData?.platform || navigator.platform : 'unknown',
      screen: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight} (dpr: ${window.devicePixelRatio})` : 'unknown',
      signaling: {
        serverUrl: settings.serverUrl,
        connected: signaling.connected,
        connecting: signaling.connecting,
        peerId: signaling.peerId ? `${signaling.peerId.slice(0, 4)}...` : null,
      },
      iceServersCount: settings.iceServers.length,
      webrtcSupported: typeof RTCPeerConnection !== 'undefined',
      serviceWorkerSupported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
      localStorageAvailable: typeof localStorage !== 'undefined',
      autoRetry: settings.autoRetry,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(info, null, 2));
      setCopiedDebug(true);
      setTimeout(() => setCopiedDebug(false), 2500);
    } catch {
      showStatus('Unable to access clipboard');
    }
  };

  const isConnected = signaling.connected;
  const isConnecting = signaling.connecting;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '16px' }}>
      {/* Intro */}
      <div>
        <p style={{ fontSize: '0.9rem', color: 'var(--fs-text-2)' }}>
          Configure signaling server endpoints, WebRTC ICE candidates, and transfer parameters.
        </p>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--fs-accent-tint)',
            border: '1px solid var(--fs-accent)',
            borderRadius: 'var(--fs-radius-control)',
            color: 'var(--fs-text)',
            fontSize: '0.85rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Icon name="check" size={16} color="var(--fs-accent)" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Signaling Server Section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          padding: '16px',
          borderRadius: 'var(--fs-radius-card)',
          backgroundColor: 'var(--fs-bg)',
          border: '1px solid var(--fs-separator)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="public" size={18} color="var(--fs-accent)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--fs-text)' }}>
              Signaling Server
            </h3>
          </div>

          {/* Connection Status Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--fs-radius-pill)',
              backgroundColor: isConnected
                ? 'var(--fs-accent-tint)'
                : isConnecting
                ? 'rgba(251, 191, 36, 0.15)'
                : 'rgba(248, 113, 113, 0.15)',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: isConnected
                ? 'var(--fs-accent)'
                : isConnecting
                ? 'var(--fs-warning)'
                : 'var(--fs-danger)',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: isConnected
                  ? 'var(--fs-accent)'
                  : isConnecting
                  ? 'var(--fs-warning)'
                  : 'var(--fs-danger)',
              }}
            />
            {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
          </div>
        </div>

        <TextField
          label="Server WebSocket URL"
          value={serverUrlInput}
          onChange={setServerUrlInput}
          placeholder="wss://..."
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleResetServer}
            disabled={serverUrlInput === DEFAULT_SERVER_URL && settings.serverUrl === DEFAULT_SERVER_URL}
          >
            Reset to default
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handleSaveServer}
            disabled={serverUrlInput === settings.serverUrl && isConnected}
          >
            Save & Reconnect
          </Button>
        </div>
      </div>

      {/* WebRTC & ICE Servers Section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          padding: '16px',
          borderRadius: 'var(--fs-radius-card)',
          backgroundColor: 'var(--fs-bg)',
          border: '1px solid var(--fs-separator)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="tune" size={18} color="var(--fs-accent)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--fs-text)' }}>
              WebRTC ICE & STUN Servers
            </h3>
          </div>
          <Button size="sm" variant="secondary" onClick={handleResetIceServers}>
            Reset defaults
          </Button>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--fs-text-2)', lineHeight: '1.4' }}>
          STUN servers discover public IPs across NAT routers for direct peer-to-peer data channels.
        </p>

        {/* Existing ICE Server list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {settings.iceServers.map((server) => (
            <div
              key={server}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 'var(--fs-radius-control)',
                backgroundColor: 'var(--fs-surface)',
                border: '1px solid var(--fs-separator)',
                fontSize: '0.82rem',
                fontFamily: 'var(--fs-font-mono)',
                color: 'var(--fs-text)',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {server}
              </span>
              <button
                onClick={() => handleRemoveIceServer(server)}
                style={{
                  color: 'var(--fs-text-3)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Remove server"
                aria-label={`Remove ${server}`}
              >
                <Icon name="close" size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Add custom ICE server */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="stun:stun.example.com:3478"
            value={newIceInput}
            onInput={(e) => setNewIceInput((e.target as HTMLInputElement).value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: 'var(--fs-surface)',
              border: '1px solid var(--fs-separator)',
              borderRadius: 'var(--fs-radius-control)',
              color: 'var(--fs-text)',
              fontSize: '0.85rem',
            }}
          />
          <Button size="sm" variant="secondary" onClick={handleAddIceServer} disabled={!newIceInput.trim()}>
            Add
          </Button>
        </div>
      </div>

      {/* Transfer Tuning Section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '16px',
          borderRadius: 'var(--fs-radius-card)',
          backgroundColor: 'var(--fs-bg)',
          border: '1px solid var(--fs-separator)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="send" size={18} color="var(--fs-accent)" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--fs-text)' }}>
            Transfer Parameters
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--fs-text)' }}>
              Auto-retry failed transfers
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--fs-text-2)', marginTop: '2px' }}>
              Automatically re-attempt dropped packets on WebRTC data channel hiccup.
            </p>
          </div>
          <Switch
            checked={settings.autoRetry}
            onChange={(checked) => updateSettings({ autoRetry: checked })}
          />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '8px',
            borderTop: '1px solid var(--fs-separator)',
          }}
        >
          <div>
            <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--fs-text)' }}>
              Chunk size
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--fs-text-2)', marginTop: '2px' }}>
              Optimized 64 KB binary streaming buffer.
            </p>
          </div>
          <span
            style={{
              padding: '4px 8px',
              borderRadius: 'var(--fs-radius-control)',
              backgroundColor: 'var(--fs-surface)',
              border: '1px solid var(--fs-separator)',
              fontSize: '0.8rem',
              fontWeight: '600',
              fontFamily: 'var(--fs-font-mono)',
              color: 'var(--fs-accent)',
            }}
          >
            64 KB
          </span>
        </div>
      </div>

      {/* Diagnostics / Copy Debug Info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderRadius: 'var(--fs-radius-card)',
          backgroundColor: 'var(--fs-bg)',
          border: '1px solid var(--fs-separator)',
        }}
      >
        <div>
          <p style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--fs-text)' }}>
            Diagnostics
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--fs-text-2)', marginTop: '2px' }}>
            Copy redacted system report for troubleshooting.
          </p>
        </div>

        <Button
          size="sm"
          variant={copiedDebug ? 'primary' : 'secondary'}
          onClick={handleCopyDebugInfo}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon name={copiedDebug ? 'check' : 'code'} size={16} />
            <span>{copiedDebug ? 'Copied' : 'Copy Debug Info'}</span>
          </div>
        </Button>
      </div>
    </div>
  );
}
