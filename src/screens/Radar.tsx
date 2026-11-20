import { useState, useRef, useEffect } from 'preact/hooks';
import { Icon } from '../ui/Icon';
import { DiscoveredPeer } from '../core/peers';

interface RadarProps {
  peers: DiscoveredPeer[];
  onSelectPeerForSend: (peer: DiscoveredPeer) => void;
  onRefresh: () => void;
  onOpenLinkDevices?: () => void;
}

// 8 Polar slots distributed across 3 concentric rings: [radius factor (0..1), angle in degrees]
// Optimized so outer slots are horizontal (East/West), preventing collision with bottom list cards.
const RADAR_SLOTS = [
  // Ring 1 (Inner, 0.31) - 2 slots (Top, Bottom)
  { rFactor: 0.31, angle: 90 },   // Top
  { rFactor: 0.31, angle: 270 },  // Bottom
  // Ring 2 (Middle, 0.54) - 4 slots (4 quadrants)
  { rFactor: 0.54, angle: 35 },   // Top-Right
  { rFactor: 0.54, angle: 145 },  // Top-Left
  { rFactor: 0.54, angle: 215 },  // Bottom-Left
  { rFactor: 0.54, angle: 325 },  // Bottom-Right
  // Ring 3 (Outer, 0.77) - 2 slots (East, West)
  { rFactor: 0.77, angle: 0 },    // East
  { rFactor: 0.77, angle: 180 },  // West
];

export function Radar({ peers, onSelectPeerForSend, onRefresh, onOpenLinkDevices }: RadarProps) {
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'radar' | 'list'>('radar');
  const [listFilter, setListFilter] = useState<'all' | 'wifi' | 'internet'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const activePeers: DiscoveredPeer[] = peers;
  const radarPeers = activePeers.slice(0, RADAR_SLOTS.length);
  const overflowPeers = activePeers.slice(RADAR_SLOTS.length);

  const stageRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return Math.min(680, window.innerWidth - 32, window.innerHeight - 200);
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
  }, [viewMode, overflowPeers.length]);

  const stageRadius = stageSize / 2;

  // Filtered peers for List View
  const filteredListPeers = activePeers.filter((peer) => {
    const isWifi = peer.ipNetwork !== false;
    if (listFilter === 'wifi' && !isWifi) return false;
    if (listFilter === 'internet' && isWifi) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const name = peer.displayName.toLowerCase();
      const dev = (peer.deviceName || '').toLowerCase();
      return name.includes(query) || dev.includes(query);
    }
    return true;
  });

  const wifiCount = activePeers.filter((p) => p.ipNetwork !== false).length;
  const internetCount = activePeers.length - wifiCount;

  return (
    <div
      onClick={() => setSelectedPeerId(null)}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '20px 24px 64px 24px',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--fs-separator) transparent',
        position: 'relative',
      }}
    >
      {/* Title & Controls Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
          zIndex: 10,
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--fs-text)' }}>
            Nearby devices
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--fs-text-2)', marginTop: '2px' }}>
            {activePeers.length === 0
              ? 'Find and share files with devices around you'
              : `${activePeers.length} ${activePeers.length === 1 ? 'device' : 'devices'} available • ${wifiCount} on Wi-Fi, ${internetCount} via Internet`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Dual View Mode Switcher: Radar vs List */}
          {activePeers.length > 0 && (
            <div
              style={{
                display: 'inline-flex',
                backgroundColor: 'var(--fs-surface)',
                border: '1px solid var(--fs-separator)',
                borderRadius: 'var(--fs-radius-pill)',
                padding: '3px',
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setViewMode('radar');
                }}
                aria-label="Radar view"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: 'var(--fs-radius-pill)',
                  backgroundColor: viewMode === 'radar' ? 'var(--fs-accent)' : 'transparent',
                  color: viewMode === 'radar' ? 'var(--fs-on-accent)' : 'var(--fs-text-2)',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all var(--fs-transition-fast)',
                }}
              >
                <Icon name="radar" size={15} />
                <span>Radar</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setViewMode('list');
                }}
                aria-label="List view"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: 'var(--fs-radius-pill)',
                  backgroundColor: viewMode === 'list' ? 'var(--fs-accent)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--fs-on-accent)' : 'var(--fs-text-2)',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all var(--fs-transition-fast)',
                }}
              >
                <Icon name="menu" size={15} />
                <span>List ({activePeers.length})</span>
              </button>
            </div>
          )}

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
              minHeight: '38px',
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
      </div>

      {/* VIEW MODE 1: VISUAL RADAR VIEW */}
      {viewMode === 'radar' && (
        <>
          {/* Expanded Aura Radar Canvas */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 0 20px 0',
              marginBottom: '16px',
              flexShrink: 0,
            }}
          >
            <div
              ref={stageRef}
              className="fs-radar-stage"
            >
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
              {radarPeers.map((peer, idx) => {
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
                const circumference = 2 * Math.PI * 30; // r = 30
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
                      gap: '5px',
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
                        width: '64px',
                        height: '64px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg
                        width={64}
                        height={64}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          transform: 'rotate(-90deg)',
                          pointerEvents: 'none',
                        }}
                      >
                        <circle
                          cx={32}
                          cy={32}
                          r={28}
                          stroke="var(--fs-separator)"
                          strokeWidth={2}
                          fill="none"
                          opacity={0.4}
                        />
                        {isTransferring && (
                          <circle
                            cx={32}
                            cy={32}
                            r={28}
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
                          width: '52px',
                          height: '52px',
                          borderRadius: '50%',
                          backgroundColor: isSelected ? 'var(--fs-surface-raised)' : 'var(--fs-surface)',
                          border: isSelected ? '2px solid var(--fs-accent)' : '1px solid var(--fs-separator)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isSelected
                            ? '0 0 20px var(--fs-accent)'
                            : '0 4px 14px rgba(0, 0, 0, 0.25)',
                          position: 'relative',
                          transition: 'all var(--fs-transition-fast)',
                        }}
                      >
                        <Icon
                          name={isLaptop ? 'laptop' : 'smartphone'}
                          size={22}
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
                          width: '18px',
                          height: '18px',
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
                        <Icon name={isWifi ? 'wifi' : 'public'} size={10} />
                      </div>
                    </div>

                    {/* Device Label under node */}
                    <div
                      className="fs-radar-node-label"
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
                            : `${isWifi ? 'Wi-Fi' : 'Internet'}${peer.deviceName ? `, ${peer.deviceName}` : ''}`}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overflow devices section (matching native app DeviceRow list) */}
          {overflowPeers.length > 0 && (
            <div
              style={{
                width: '100%',
                maxWidth: '720px',
                margin: '16px auto 0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '6px',
                  borderBottom: '1px solid var(--fs-separator)',
                }}
              >
                <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--fs-text)' }}>
                  More Nearby Devices ({overflowPeers.length})
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--fs-text-2)' }}>
                  Tap any device to send
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {overflowPeers.map((peer) => {
                  const isWifi = peer.ipNetwork !== false;
                  const isLaptop =
                    peer.displayName.toLowerCase().includes('pc') ||
                    peer.deviceName.toLowerCase().includes('chrome') ||
                    peer.displayName.toLowerCase().includes('laptop');

                  return (
                    <div
                      key={peer.id}
                      onClick={() => onSelectPeerForSend(peer)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        backgroundColor: 'var(--fs-surface)',
                        border: '1px solid var(--fs-separator)',
                        borderRadius: 'var(--fs-radius-row)',
                        cursor: 'pointer',
                        transition: 'background-color var(--fs-transition-fast)',
                      }}
                      className="fs-hover-dim"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--fs-bg)',
                            border: '1px solid var(--fs-separator)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--fs-text)',
                          }}
                        >
                          <Icon name={isLaptop ? 'laptop' : 'smartphone'} size={20} />
                        </div>
                        <div>
                          <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--fs-text)' }}>
                            {peer.displayName}
                          </span>
                          <p style={{ fontSize: '0.74rem', color: isWifi ? 'var(--fs-accent)' : 'var(--fs-text-2)', marginTop: '2px' }}>
                            {isWifi ? 'Wi-Fi' : 'Internet'} • {peer.deviceName}
                          </p>
                        </div>
                      </div>
                      <button
                        style={{
                          padding: '6px 16px',
                          borderRadius: 'var(--fs-radius-pill)',
                          backgroundColor: 'var(--fs-accent-tint)',
                          color: 'var(--fs-accent)',
                          fontSize: '0.82rem',
                          fontWeight: '700',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Send
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* 8+ Devices High-Density Advisory Solution */}
              {activePeers.length >= 8 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: 'var(--fs-accent-tint)',
                    borderRadius: 'var(--fs-radius-row)',
                    marginTop: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <Icon name="info" size={18} color="var(--fs-accent)" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--fs-text)', lineHeight: 1.4 }}>
                      Crowded network ({activePeers.length} devices detected). Pair directly or create a room for faster dedicated transfers.
                    </span>
                  </div>
                  {onOpenLinkDevices && (
                    <button
                      onClick={onOpenLinkDevices}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--fs-radius-pill)',
                        backgroundColor: 'var(--fs-surface)',
                        border: '1px solid var(--fs-separator)',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        color: 'var(--fs-accent)',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      Link
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* VIEW MODE 2: HIGH-DENSITY SEARCHABLE LIST VIEW */}
      {viewMode === 'list' && (
        <div
          style={{
            width: '100%',
            maxWidth: '720px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            zIndex: 10,
          }}
        >
          {/* Search bar & filter pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '4px' }}>
            {activePeers.length > 4 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  backgroundColor: 'var(--fs-surface)',
                  border: '1px solid var(--fs-separator)',
                  borderRadius: 'var(--fs-radius-control)',
                }}
              >
                <Icon name="refresh" size={16} color="var(--fs-text-3)" />
                <input
                  type="text"
                  placeholder="Search devices by name..."
                  value={searchQuery}
                  onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--fs-text)',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fs-text-3)' }}
                  >
                    <Icon name="close" size={16} />
                  </button>
                )}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {(['all', 'wifi', 'internet'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setListFilter(filter)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--fs-radius-pill)',
                    backgroundColor: listFilter === filter ? 'var(--fs-accent)' : 'var(--fs-surface)',
                    color: listFilter === filter ? 'var(--fs-on-accent)' : 'var(--fs-text-2)',
                    border: '1px solid var(--fs-separator)',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all var(--fs-transition-fast)',
                  }}
                >
                  {filter === 'all'
                    ? `All (${activePeers.length})`
                    : filter === 'wifi'
                    ? `Wi-Fi (${wifiCount})`
                    : `Internet (${internetCount})`}
                </button>
              ))}
            </div>
          </div>

          {/* List items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredListPeers.map((peer) => {
              const isWifi = peer.ipNetwork !== false;
              const isLaptop =
                peer.displayName.toLowerCase().includes('pc') ||
                peer.deviceName.toLowerCase().includes('chrome') ||
                peer.displayName.toLowerCase().includes('laptop');

              return (
                <div
                  key={peer.id}
                  onClick={() => onSelectPeerForSend(peer)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: 'var(--fs-surface)',
                    border: '1px solid var(--fs-separator)',
                    borderRadius: 'var(--fs-radius-row)',
                    cursor: 'pointer',
                    transition: 'background-color var(--fs-transition-fast)',
                  }}
                  className="fs-hover-dim"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        position: 'relative',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--fs-bg)',
                        border: '1px solid var(--fs-separator)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--fs-text)',
                      }}
                    >
                      <Icon name={isLaptop ? 'laptop' : 'smartphone'} size={22} />
                      <div
                        style={{
                          position: 'absolute',
                          right: '-2px',
                          bottom: '-2px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: isWifi ? 'var(--fs-accent)' : 'var(--fs-surface)',
                          border: '2px solid var(--fs-surface)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isWifi ? 'var(--fs-on-accent)' : 'var(--fs-text-2)',
                        }}
                      >
                        <Icon name={isWifi ? 'wifi' : 'public'} size={9} />
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--fs-text)' }}>
                        {peer.displayName}
                      </span>
                      <p style={{ fontSize: '0.76rem', color: isWifi ? 'var(--fs-accent)' : 'var(--fs-text-2)', marginTop: '2px' }}>
                        {isWifi ? 'Wi-Fi' : 'Internet'} • {peer.deviceName}
                      </p>
                    </div>
                  </div>

                  <button
                    style={{
                      padding: '7px 18px',
                      borderRadius: 'var(--fs-radius-pill)',
                      backgroundColor: 'var(--fs-accent-tint)',
                      color: 'var(--fs-accent)',
                      fontSize: '0.84rem',
                      fontWeight: '700',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Send
                  </button>
                </div>
              );
            })}

            {filteredListPeers.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px 16px',
                  backgroundColor: 'var(--fs-surface)',
                  borderRadius: 'var(--fs-radius-card)',
                  border: '1px solid var(--fs-separator)',
                }}
              >
                <p style={{ fontSize: '0.9rem', color: 'var(--fs-text-2)' }}>
                  No devices match your search or filter.
                </p>
              </div>
            )}
          </div>

          {/* Crowded Wi-Fi solution banner in List mode */}
          {activePeers.length >= 8 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '12px 16px',
                backgroundColor: 'var(--fs-accent-tint)',
                borderRadius: 'var(--fs-radius-row)',
                marginTop: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <Icon name="info" size={18} color="var(--fs-accent)" />
                <span style={{ fontSize: '0.8rem', color: 'var(--fs-text)', lineHeight: 1.4 }}>
                  Crowded network ({activePeers.length} devices detected). Pair directly or create a room for faster dedicated transfers.
                </span>
              </div>
              {onOpenLinkDevices && (
                <button
                  onClick={onOpenLinkDevices}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--fs-radius-pill)',
                    backgroundColor: 'var(--fs-surface)',
                    border: '1px solid var(--fs-separator)',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    color: 'var(--fs-accent)',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  Link
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
