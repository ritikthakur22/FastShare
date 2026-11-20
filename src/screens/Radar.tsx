import { useState } from 'preact/hooks';
import { Icon } from '../ui/Icon';
import { DiscoveredPeer } from '../core/peers';

interface RadarProps {
  peers: DiscoveredPeer[];
  onSelectPeerForSend: (peer: DiscoveredPeer) => void;
  onRefresh: () => void;
}

// Polar slots matching native app: [radius in px, angle in degrees]
const RADAR_SLOTS = [
  { r: 190, angle: 35 },   // Middle ring (380px / 2 = 190), top-right
  { r: 190, angle: 145 },  // Middle ring, top-left
  { r: 270, angle: 325 },  // Outer ring (540px / 2 = 270), bottom-right
  { r: 270, angle: 215 },  // Outer ring, bottom-left
  { r: 110, angle: 90 },   // Inner ring (220px / 2 = 110), top
  { r: 270, angle: 90 },   // Outer ring, top
];

export function Radar({ peers, onSelectPeerForSend, onRefresh }: RadarProps) {
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);

  // Fallback demo peers if no live peers yet - showing both Wi-Fi and Internet
  const activePeers: DiscoveredPeer[] = peers.length > 0 ? peers : [
    {
      id: 'demo-linux',
      displayName: 'Linux PC',
      deviceName: 'Chrome',
      state: 'connected',
      ipNetwork: true, // Same Wi-Fi
      lastSeen: Date.now(),
    },
    {
      id: 'demo-phone',
      displayName: 'Redmi Note 9',
      deviceName: 'Android',
      state: 'connected',
      ipNetwork: false, // Internet / Room
      lastSeen: Date.now(),
    },
  ];

  return (
    <div
      onClick={() => setSelectedPeerId(null)}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '24px',
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--fs-text)' }}>
            Nearby devices
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--fs-text-2)', marginTop: '4px' }}>
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
            fontSize: '0.85rem',
            fontWeight: '600',
            color: 'var(--fs-text)',
            cursor: 'pointer',
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
        {/* Ring 4 (Outermost Ambient Radar Boundary with Soft Tint) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '700px',
            height: '700px',
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
            width: '540px',
            height: '540px',
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
            width: '380px',
            height: '380px',
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
            width: '220px',
            height: '220px',
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
          <Icon name="radar" size={34} color="var(--fs-on-accent)" />
        </div>

        {/* Discovered Peer Nodes placed along rings - with Wi-Fi / Internet badges and progress ring */}
        {activePeers.map((peer, idx) => {
          const slot = RADAR_SLOTS[idx % RADAR_SLOTS.length];
          const rad = (slot.angle * Math.PI) / 180;
          const offsetX = Math.round(slot.r * Math.cos(rad));
          const offsetY = Math.round(slot.r * Math.sin(rad));

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
                gap: '8px',
                transition: 'transform var(--fs-transition-spring)',
                outline: 'none',
              }}
            >
              {/* Avatar Circle Container with Circular Progress Ring */}
              <div
                style={{
                  position: 'relative',
                  width: '74px',
                  height: '74px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Circular Transfer Progress Ring (SVG) matching PeerAvatar.tsx */}
                <svg
                  width={74}
                  height={74}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    transform: 'rotate(-90deg)',
                    pointerEvents: 'none',
                  }}
                >
                  <circle
                    cx={37}
                    cy={37}
                    r={33}
                    stroke="var(--fs-separator)"
                    strokeWidth={2.5}
                    fill="none"
                    opacity={0.4}
                  />
                  {isTransferring && (
                    <circle
                      cx={37}
                      cy={37}
                      r={33}
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
                    width: '58px',
                    height: '58px',
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
                    size={28}
                    color={isSelected ? 'var(--fs-accent)' : 'var(--fs-text)'}
                  />
                </div>

                {/* Network Link Badge on Avatar (Wi-Fi or Internet) matching Native App */}
                <div
                  title={isWifi ? 'Connected via local Wi-Fi network' : 'Connected via Internet'}
                  style={{
                    position: 'absolute',
                    right: '4px',
                    bottom: '4px',
                    width: '22px',
                    height: '22px',
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
                  <Icon name={isWifi ? 'wifi' : 'public'} size={12} />
                </div>
              </div>

              {/* Device Label under node - Name + Wi-Fi / Internet indicator */}
              <div
                style={{
                  textAlign: 'center',
                  maxWidth: '120px',
                  pointerEvents: 'none',
                }}
              >
                <p
                  style={{
                    fontSize: '0.85rem',
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
                    fontSize: '0.72rem',
                    fontWeight: isWifi ? '600' : '500',
                    color: isWifi ? 'var(--fs-accent)' : 'var(--fs-text-2)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    marginTop: '2px',
                  }}
                >
                  <Icon name={isWifi ? 'wifi' : 'public'} size={10} />
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
  );
}
