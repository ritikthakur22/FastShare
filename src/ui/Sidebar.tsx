import { useState } from 'preact/hooks';
import { BrandMark } from './BrandMark';
import { Icon } from './Icon';

export type ActiveTab = 'nearby' | 'activity' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export function Sidebar({ activeTab, onSelectTab }: SidebarProps) {
  // Sidebar starts compact (72px rail) and smoothly auto-expands on mouse hover
  const [isHovered, setIsHovered] = useState(false);

  const navItems: { id: ActiveTab; label: string; icon: 'radar' | 'history' | 'settings' }[] = [
    { id: 'nearby', label: 'Nearby', icon: 'radar' },
    { id: 'activity', label: 'Transfers / Activity', icon: 'history' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <aside
      className="fs-desktop-sidebar"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: isHovered ? '260px' : '72px',
        height: '100%',
        backgroundColor: 'var(--fs-surface)',
        borderRight: '1px solid var(--fs-separator)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isHovered ? '24px 16px' : '24px 12px',
        transition: 'width 300ms cubic-bezier(0.16, 1, 0.3, 1), padding 300ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 300ms ease',
        flexShrink: 0,
        position: isHovered ? 'absolute' : 'relative',
        zIndex: isHovered ? 40 : 10,
        boxShadow: isHovered ? '0 10px 40px rgba(0, 0, 0, 0.45)' : 'none',
        overflow: 'hidden',
        willChange: 'width',
      }}
    >
      <div>
        {/* Brand Header: Logo is ALWAYS visible, centered when collapsed, with name beside it when expanded */}
        <div
          style={{
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isHovered ? 'flex-start' : 'center',
            padding: isHovered ? '0 8px 16px 8px' : '0 0 16px 0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            transition: 'justify-content 300ms ease, padding 300ms ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
              }}
            >
              <BrandMark size={32} />
            </div>
            {isHovered && (
              <span
                style={{
                  fontSize: '1.25rem',
                  fontWeight: '800',
                  letterSpacing: '-0.02em',
                  color: 'var(--fs-text)',
                  whiteSpace: 'nowrap',
                  animation: 'fadeIn 200ms ease',
                }}
              >
                FastShare
              </span>
            )}
          </div>
        </div>

        {/* Navigation List */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={!isHovered ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isHovered ? 'flex-start' : 'center',
                  gap: '14px',
                  padding: isHovered ? '12px 16px' : '12px 0',
                  borderRadius: 'var(--fs-radius-pill)',
                  backgroundColor: isActive ? 'var(--fs-accent-tint)' : 'transparent',
                  color: isActive ? 'var(--fs-accent)' : 'var(--fs-text-2)',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '0.95rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color var(--fs-transition-fast), color var(--fs-transition-fast)',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px' }}>
                  <Icon name={item.icon} size={22} color={isActive ? 'var(--fs-accent)' : 'var(--fs-text-2)'} />
                </div>
                {isHovered && (
                  <span
                    style={{
                      whiteSpace: 'nowrap',
                      opacity: isHovered ? 1 : 0,
                      transition: 'opacity 200ms ease',
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Card matching Native App */}
      {isHovered && (
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 100%)',
            border: '1px solid var(--fs-separator)',
            borderRadius: 'var(--fs-radius-card)',
            padding: '16px 14px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            animation: 'fadeIn 200ms ease',
          }}
        >
          <p style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--fs-text)', marginBottom: '4px' }}>
            FastShare 2.0
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--fs-text-2)', lineHeight: '1.4' }}>
            Encrypted WebRTC peer-to-peer file transfer. No file touches any server.
          </p>
        </div>
      )}
    </aside>
  );
}
