import { Icon } from './Icon';
import { ActiveTab } from './Sidebar';

interface FloatingTabBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export function FloatingTabBar({ activeTab, onSelectTab }: FloatingTabBarProps) {
  const tabs: { id: ActiveTab; label: string; icon: 'radar' | 'history' | 'settings' }[] = [
    { id: 'nearby', label: 'Nearby', icon: 'radar' },
    { id: 'activity', label: 'Activity', icon: 'history' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <nav
      className="fs-floating-tabbar"
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'var(--fs-surface)',
        borderRadius: 'var(--fs-radius-tabbar)',
        padding: '6px',
        display: 'none', // Controlled by CSS media queries
        alignItems: 'center',
        gap: '4px',
        boxShadow: 'var(--fs-shadow)',
        border: '1px solid var(--fs-separator)',
        zIndex: 50,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className="fs-tab-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              minHeight: '44px',
              borderRadius: 'var(--fs-radius-pill)',
              backgroundColor: isActive ? 'var(--fs-accent-tint)' : 'transparent',
              color: isActive ? 'var(--fs-accent)' : 'var(--fs-text-2)',
              fontWeight: isActive ? '600' : '500',
              fontSize: '0.9rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'all var(--fs-transition-fast)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Icon name={tab.icon} size={20} color={isActive ? 'var(--fs-accent)' : 'var(--fs-text-2)'} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
