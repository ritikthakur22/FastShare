import { useState, useEffect } from 'preact/hooks';
import { Segmented } from '../ui/Segmented';
import { QrCode } from '../ui/QrCode';
import { TextField } from '../ui/TextField';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { useStore } from '../core/useStore';
import {
  pairStore,
  roomStore,
  pairedDevicesStore,
  startPairing,
  joinPairing,
  unpairDevice,
  createPublicRoom,
  joinPublicRoom,
  leavePublicRoom,
} from '../core/rooms';

export function LinkDevicesModal() {
  const [tab, setTab] = useState<'pair' | 'room'>('pair');
  const [enteredPairKey, setEnteredPairKey] = useState('');
  const [enteredRoomCode, setEnteredRoomCode] = useState('');

  const pairState = useStore(pairStore);
  const roomState = useStore(roomStore);
  const pairedDevices = useStore(pairedDevicesStore);

  // Automatically request pair code from signaling server when opening pair tab
  useEffect(() => {
    if (tab === 'pair' && (pairState.phase === 'idle' || pairState.phase === 'error')) {
      startPairing();
    }
  }, [tab, pairState.phase]);

  const pairKey = pairState.phase === 'showing' ? pairState.pairKey : null;
  const pairUrl = pairKey ? `https://fastshare.ritikthakur.com.np/?pair_key=${pairKey}` : '';

  const activeRoom = roomState.phase === 'in' ? roomState.code : null;
  const roomUrl = activeRoom ? `https://fastshare.ritikthakur.com.np/?room_id=${activeRoom}` : '';

  const handlePairSubmit = () => {
    const clean = enteredPairKey.replace(/\D/g, '');
    if (clean.length === 6) {
      joinPairing(clean);
      setEnteredPairKey('');
    }
  };

  const handleJoinRoom = () => {
    const clean = enteredRoomCode.trim().toLowerCase();
    if (clean.length >= 3) {
      joinPublicRoom(clean);
      setEnteredRoomCode('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Tab Segmented Switcher */}
      <Segmented
        value={tab}
        options={[
          { value: 'pair', label: '6-digit Pair' },
          { value: 'room', label: 'Public Room' },
        ]}
        onChange={(v) => setTab(v as 'pair' | 'room')}
      />

      {tab === 'pair' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--fs-text-2)', textAlign: 'center' }}>
            Pairing lets devices remember each other. They connect automatically over the internet without needing the same Wi-Fi.
          </p>

          {/* QR Code and Code Display */}
          {pairState.phase === 'waiting' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                padding: '40px 20px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '3px solid var(--fs-accent)',
                  borderTopColor: 'transparent',
                  animation: 'fs-radar-sweep 1s linear infinite',
                }}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--fs-text-2)' }}>
                Connecting to server for code...
              </span>
            </div>
          )}

          {pairState.phase === 'showing' && (
            <>
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--fs-radius-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                }}
              >
                <QrCode value={pairUrl} size={180} />
              </div>

              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--fs-text-3)', fontWeight: '600', textTransform: 'uppercase' }}>
                  Your Pairing Key
                </span>
                <div
                  style={{
                    fontSize: '2.2rem',
                    fontWeight: '800',
                    letterSpacing: '6px',
                    color: 'var(--fs-accent)',
                    fontFamily: 'var(--fs-font-mono)',
                    marginTop: '4px',
                  }}
                >
                  {pairKey ? `${pairKey.slice(0, 3)} ${pairKey.slice(3)}` : '------'}
                </div>
              </div>
            </>
          )}

          {pairState.phase === 'paired' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
                padding: '28px 20px',
                backgroundColor: 'var(--fs-accent-tint)',
                borderRadius: 'var(--fs-radius-card)',
                width: '100%',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--fs-accent)',
                  color: 'var(--fs-on-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="check" size={26} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--fs-text)' }}>
                  Device Paired!
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--fs-text-2)', marginTop: '4px' }}>
                  Connected with {pairState.alias}. You can now send files anytime across any network or Wi-Fi.
                </p>
              </div>
              <Button variant="secondary" onClick={() => startPairing()}>
                Pair another device
              </Button>
            </div>
          )}

          {pairState.phase === 'error' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                padding: '24px 16px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 'var(--fs-radius-card)',
                width: '100%',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.9rem', color: 'var(--fs-danger)', fontWeight: '600' }}>
                {pairState.reason === 'rate_limit'
                  ? 'Too many attempts. Wait 10 seconds.'
                  : pairState.reason === 'offline'
                  ? 'Offline. Check internet connection.'
                  : 'Invalid or expired pair code.'}
              </span>
              <Button variant="secondary" onClick={() => startPairing()}>
                Try again
              </Button>
            </div>
          )}

          {/* Enter code from other device */}
          <div style={{ width: '100%', borderTop: '1px solid var(--fs-separator)', paddingTop: '16px' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--fs-text)', marginBottom: '8px' }}>
              Or enter code from other device:
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <TextField
                value={enteredPairKey}
                onChange={(val) => setEnteredPairKey(val.replace(/\D/g, ''))}
                placeholder="6-digit code"
                maxLength={6}
              />
              <Button
                variant="primary"
                onClick={handlePairSubmit}
                disabled={enteredPairKey.replace(/\D/g, '').length !== 6 || pairState.phase === 'waiting'}
                icon={<Icon name="link" size={16} />}
              >
                Pair
              </Button>
            </div>
          </div>

          {/* Paired devices list */}
          {pairedDevices.length > 0 && (
            <div style={{ width: '100%', marginTop: '8px' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--fs-text)', marginBottom: '8px' }}>
                Paired Devices ({pairedDevices.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {pairedDevices.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: 'var(--fs-bg)',
                      border: '1px solid var(--fs-separator)',
                      borderRadius: 'var(--fs-radius-row)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--fs-accent-tint)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--fs-accent)',
                        }}
                      >
                        <Icon name="link" size={16} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.9rem', color: 'var(--fs-text)', fontWeight: '600' }}>
                          {d.alias}
                        </span>
                        <p style={{ fontSize: '0.72rem', color: 'var(--fs-accent)', fontWeight: '500' }}>
                          Connected over Internet
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => unpairDevice(d.id)}
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--fs-danger)',
                        fontWeight: '600',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '6px 10px',
                      }}
                    >
                      Unpair
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--fs-text-2)' }}>
            Anyone with the room code can discover this device and send files while you are in the room. Leave when done.
          </p>

          {activeRoom ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                padding: '20px',
                backgroundColor: 'var(--fs-bg)',
                border: '1px solid var(--fs-separator)',
                borderRadius: 'var(--fs-radius-card)',
              }}
            >
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                }}
              >
                <QrCode value={roomUrl} size={160} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--fs-text-3)', fontWeight: '600', textTransform: 'uppercase' }}>
                  Current Public Room
                </span>
                <p
                  style={{
                    fontSize: '2.2rem',
                    fontWeight: '800',
                    letterSpacing: '6px',
                    color: 'var(--fs-accent)',
                    fontFamily: 'var(--fs-font-mono)',
                    marginTop: '2px',
                  }}
                >
                  {activeRoom.toUpperCase()}
                </p>
              </div>
              <Button variant="danger" fullWidth onClick={() => leavePublicRoom()}>
                Leave room
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Button
                variant="primary"
                fullWidth
                onClick={() => createPublicRoom()}
                disabled={roomState.phase === 'joining'}
                icon={<Icon name="radar" size={16} />}
              >
                {roomState.phase === 'joining' ? 'Creating Room...' : 'Create a new room'}
              </Button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--fs-separator)' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--fs-text-3)', textTransform: 'uppercase' }}>
                  or join with code
                </span>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--fs-separator)' }} />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <TextField
                  value={enteredRoomCode}
                  onChange={(val) => setEnteredRoomCode(val.toUpperCase())}
                  placeholder="5-letter room code"
                  maxLength={10}
                />
                <Button
                  variant="primary"
                  onClick={handleJoinRoom}
                  disabled={enteredRoomCode.trim().length < 3 || roomState.phase === 'joining'}
                >
                  Join
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
