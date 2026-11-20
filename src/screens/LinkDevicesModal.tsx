import { useState } from 'preact/hooks';
import { Segmented } from '../ui/Segmented';
import { QrCode } from '../ui/QrCode';
import { TextField } from '../ui/TextField';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { pairDevice, joinRoom, leaveRoom } from '../core/signaling';

interface PairedDevice {
  id: string;
  name: string;
}

export function LinkDevicesModal() {
  const [tab, setTab] = useState<'pair' | 'room'>('pair');

  // Pair tab state
  const [pairKey] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [enteredPairKey, setEnteredPairKey] = useState('');
  const [isPairing, setIsPairing] = useState(false);
  const [pairedDevices, setPairedDevices] = useState<PairedDevice[]>(() => {
    try {
      const stored = localStorage.getItem('fs.pairedDevices');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Room tab state
  const [roomCode, setRoomCode] = useState('');
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [joiningRoom, setJoiningRoom] = useState(false);

  const pairUrl = `https://fastshare.ritikthakur.com.np/?pair_key=${pairKey}`;
  const roomUrl = activeRoom ? `https://fastshare.ritikthakur.com.np/?room_id=${activeRoom}` : '';

  const handlePairSubmit = () => {
    const cleanKey = enteredPairKey.replace(/\D/g, '');
    if (cleanKey.length === 6) {
      setIsPairing(true);
      pairDevice(cleanKey);
      setTimeout(() => {
        setIsPairing(false);
        setEnteredPairKey('');
      }, 1500);
    }
  };

  const handleUnpair = (id: string) => {
    const next = pairedDevices.filter((d) => d.id !== id);
    setPairedDevices(next);
    localStorage.setItem('fs.pairedDevices', JSON.stringify(next));
  };

  const handleCreateRoom = () => {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    setActiveRoom(code);
    joinRoom(code);
  };

  const handleJoinRoom = () => {
    const clean = roomCode.trim().toUpperCase();
    if (clean.length >= 3) {
      setJoiningRoom(true);
      setActiveRoom(clean);
      joinRoom(clean);
      setJoiningRoom(false);
      setRoomCode('');
    }
  };

  const handleLeaveRoom = () => {
    if (activeRoom) {
      leaveRoom(activeRoom);
      setActiveRoom(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Tab Segmented Switcher matching native connect.tsx */}
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

          {/* QR Code */}
          <div
            style={{
              padding: '16px',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--fs-radius-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <QrCode value={pairUrl} size={180} />
          </div>

          {/* This Device's Pair Code */}
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--fs-text-3)', fontWeight: '600', textTransform: 'uppercase' }}>
              Your Pairing Key
            </span>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: '800',
                letterSpacing: '5px',
                color: 'var(--fs-accent)',
                fontFamily: 'var(--fs-font-mono)',
                marginTop: '4px',
              }}
            >
              {pairKey.slice(0, 3)} {pairKey.slice(3)}
            </div>
          </div>

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
                disabled={enteredPairKey.replace(/\D/g, '').length !== 6 || isPairing}
                icon={<Icon name="link" size={16} />}
              >
                {isPairing ? 'Pairing...' : 'Pair'}
              </Button>
            </div>
          </div>

          {/* Paired devices list */}
          {pairedDevices.length > 0 && (
            <div style={{ width: '100%', marginTop: '8px' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--fs-text)', marginBottom: '8px' }}>
                Paired Devices
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon name="link" size={16} color="var(--fs-accent)" />
                      <span style={{ fontSize: '0.9rem', color: 'var(--fs-text)', fontWeight: '600' }}>
                        {d.name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleUnpair(d.id)}
                      style={{ fontSize: '0.8rem', color: 'var(--fs-danger)', fontWeight: '600' }}
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
                    fontSize: '2rem',
                    fontWeight: '800',
                    letterSpacing: '6px',
                    color: 'var(--fs-accent)',
                    fontFamily: 'var(--fs-font-mono)',
                    marginTop: '2px',
                  }}
                >
                  {activeRoom}
                </p>
              </div>
              <Button variant="danger" fullWidth onClick={handleLeaveRoom}>
                Leave room
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Button variant="primary" fullWidth onClick={handleCreateRoom} icon={<Icon name="radar" size={16} />}>
                Create a new room
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
                  value={roomCode}
                  onChange={(val) => setRoomCode(val.toUpperCase())}
                  placeholder="5-letter room code"
                  maxLength={5}
                />
                <Button
                  variant="primary"
                  onClick={handleJoinRoom}
                  disabled={roomCode.trim().length < 3 || joiningRoom}
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
