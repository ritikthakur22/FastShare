import { useState, useRef, useEffect } from 'preact/hooks';
import { Icon } from '../ui/Icon';
import { DiscoveredPeer } from '../core/peers';

interface RadarProps {
  peers: DiscoveredPeer[];
  onSelectPeerForSend: (peer: DiscoveredPeer) => void;
  onRefresh: () => void;
}

// Polar slots matching native app: [radius factor (0..1), angle in degrees]
const RADAR_SLOTS = [
  { rFactor: 0.54, angle: 35 },   // Middle ring (0.54), top-right
  { rFactor: 0.54, angle: 145 },  // Middle ring (0.54), top-left
  { rFactor: 0.77, angle: 325 },  // Outer ring (0.77), bottom-right
  { rFactor: 0.77, angle: 215 },  // Outer ring (0.77), bottom-left
  { rFactor: 0.31, angle: 90 },   // Inner ring (0.31), top
  { rFactor: 0.77, angle: 90 },   // Outer ring (0.77), top
];

export function Radar({ peers, onSelectPeerForSend, onRefresh }: RadarProps) {
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);
  const activePeers: DiscoveredPeer[] = peers;

  const stageRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return Math.min(700, window.innerWidth - 32, window.innerHeight - 200);
    }
    return 600;
  });

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      const s = Math.min(rect.width, rect.height);
      if (s > 80) setStageSize(s);
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const stageRadius = stageSize / 2;

  return (
    <div
      onClick={() => setSelectedPeerId(null)}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '20px 24px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Title & Refresh header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '8px',
          zIndex: 10,
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--fs-text)' }}>
            Nearby devices
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--fs-text-2)', marginTop: '2px' }}>
            Find and share files with devices around you
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRefresh();
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--fs-surface)',
            border: '1px solid var(--fs-separator)',
            borderRadius: 'var(--fs-radius-pill)',
            padding: '8px 16px',
            minHeight: '40px',
            fontSize: '0.85rem',
            fontWeight: '600',
            color: 'var(--fs-text)',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Icon name="refresh" size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Expanded Aura Radar Canvas */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <div ref={stageRef} className="fs-radar-stage">
          {/* Ring 4 (Outermost Ambient Radar Boundary with Soft Tint) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              backgroundColor: 'rgba(var(--fs-accent-rgb), 0.04)',
              border: '1.5px solid rgba(var(--fs-accent-rgb), 0.16)',
              boxShadow: '0 0 90px rgba(var(--fs-accent-rgb), 0.06)',
              pointerEvents: 'none',
            }}
          />

          {/* Ring 3 (Outer Concentric Ring) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '77%',
              height: '77%',
              borderRadius: '50%',
              border: '1px solid rgba(var(--fs-accent-rgb), 0.22)',
              boxShadow: '0 0 35px rgba(var(--fs-accent-rgb), 0.04)',
              pointerEvents: 'none',
            }}
          />

          {/* Ring 2 (Middle Concentric Ring) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '54%',
              height: '54%',
              borderRadius: '50%',
              border: '1px solid rgba(var(--fs-accent-rgb), 0.22)',
              pointerEvents: 'none',
            }}
          />

          {/* Ring 1 (Inner Concentric Ring) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '31%',
              height: '31%',
              borderRadius: '50%',
              border: '1px solid rgba(var(--fs-accent-rgb), 0.26)',
              pointerEvents: 'none',
            }}
          />

          {/* Outward Radiating Wave Pulses (3 Staggered Waves) */}
          <div className="fs-radar-pulse fs-radar-pulse-1" />
          <div className="fs-radar-pulse fs-radar-pulse-2" />
          <div className="fs-radar-pulse fs-radar-pulse-3" />

          {/* 360-Degree Rotating Radar Sweep Beam with Laser Leading Edge */}
          <div className="fs-radar-sweep" />

          {/* Central Transmitter Breathing Aura Halo */}
          <div className="fs-central-aura" />

          {/* Center Beacon (This Device - Transmitter Origin) */}
          <div className="fs-center-beacon">
            <Icon name="radar" size={32} color="var(--fs-on-accent)" />
          </div>

          {/* Empty state hint matching native app */}
          {activePeers.length === 0 && (
            <div
              style={{
                position: 'absolute',
                bottom: '10%',
                left: '50%',
                transform: 'translateX(-50%)',
                textAlign: 'center',
                pointerEvents: 'none',
                zIndex: 10,
                width: '85%',
                maxWidth: '280px',
              }}
            >
              <p style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--fs-text)' }}>
                Looking for devices
              </p>
              <p style={{ fontSize: '0.76rem', color: 'var(--fs-text-2)', marginTop: '3px' }}>
                Open FastShare on nearby devices on this Wi-Fi, or use Link Devices to pair across networks.
              </p>
            </div>
          )}

          {/* Discovered Peer Nodes placed along rings */}
          {activePeers.map((peer, idx) => {
            const slot = RADAR_SLOTS[idx % RADAR_SLOTS.length];
            const rad = (slot.angle * Math.PI) / 180;
            const slotRadius = slot.rFactor * stageRadius;
            const offsetX = Math.round(slotRadius * Math.cos(rad));
            const offsetY = Math.round(slotRadius * Math.sin(rad));

            const isSelected = selectedPeerId === peer.id;
            const isWifi = peer.ipNetwork !== false;
            const isLaptop =
              peer.displayName.toLowerCase().includes('pc') ||
              peer.deviceName.toLowerCase().includes('chrome') ||
              peer.displayName.toLowerCase().includes('laptop');

            const isTransferring = peer.state === 'transferring';
            const circumference = 2 * Math.PI * 33; // r = 33
            const progressOffset = isTransferring ? circumference * 0.45 : circumference;

            return (
              <div
                key={peer.id}
                role="button"
                tabIndex={0}
                aria-label={`Send files to ${peer.displayName}, ${peer.ipNetwork ? 'Wi-Fi' : 'Internet'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPeerId(peer.id);
                  onSelectPeerForSend(peer);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedPeerId(peer.id);
                    onSelectPeerForSend(peer);
                  }
                }}
                style={{
                  position: 'absolute',
                  top: `calc(50% - ${offsetY}px)`,
                  left: `calc(50% + ${offsetX}px)`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  zIndex: isSelected ? 30 : 15,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'transform var(--fs-transition-spring)',
                  outline: 'none',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Avatar Circle Container with Circular Progress Ring */}
                <div
                  style={{
                    position: 'relative',
                    width: '68px',
                    height: '68px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    width={68}
                    height={68}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      transform: 'rotate(-90deg)',
                      pointerEvents: 'none',
                    }}
                  >
                    <circle
                      cx={34}
                      cy={34}
                      r={30}
                      stroke="var(--fs-separator)"
                      strokeWidth={2.5}
                      fill="none"
                      opacity={0.4}
                    />
                    {isTransferring && (
                      <circle
                        cx={34}
                        cy={34}
                        r={30}
                        stroke="var(--fs-accent)"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={progressOffset}
                        fill="none"
                      />
                    )}
                  </svg>

                  {/* Inner Device Disc */}
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      backgroundColor: isSelected ? 'var(--fs-surface-raised)' : 'var(--fs-surface)',
                      border: isSelected ? '2px solid var(--fs-accent)' : '1px solid var(--fs-separator)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isSelected
                        ? '0 0 24px var(--fs-accent)'
                        : '0 4px 14px rgba(0, 0, 0, 0.25)',
                      position: 'relative',
                      transition: 'all var(--fs-transition-fast)',
                    }}
                  >
                    <Icon
                      name={isLaptop ? 'laptop' : 'smartphone'}
                      size={26}
                      color={isSelected ? 'var(--fs-accent)' : 'var(--fs-text)'}
                    />
                  </div>

                  {/* Network Link Badge on Avatar (Wi-Fi or Internet) */}
                  <div
                    title={isWifi ? 'Connected via local Wi-Fi network' : 'Connected via Internet'}
                    style={{
                      position: 'absolute',
                      right: '2px',
                      bottom: '2px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: isWifi ? 'var(--fs-accent)' : 'var(--fs-surface)',
                      border: '2px solid var(--fs-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isWifi ? 'var(--fs-on-accent)' : 'var(--fs-text-2)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      zIndex: 2,
                    }}
                  >
                    <Icon name={isWifi ? 'wifi' : 'public'} size={11} />
                  </div>
                </div>

                {/* Device Label under node */}
                <div
                  style={{
                    textAlign: 'center',
                    maxWidth: '110px',
                    pointerEvents: 'none',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      color: isSelected ? 'var(--fs-accent)' : 'var(--fs-text)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {peer.displayName}
                  </p>
                  <p
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: isWifi ? '600' : '500',
                      color: isWifi ? 'var(--fs-accent)' : 'var(--fs-text-2)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '3px',
                      marginTop: '1px',
                    }}
                  >
                    <Icon name={isWifi ? 'wifi' : 'public'} size={9} />
                    <span>
                      {isTransferring
                        ? '55%'
                        : peer.state === 'done'
                        ? 'Sent'
                        : isWifi
                        ? 'Wi-Fi'
                        : 'Internet'}
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
