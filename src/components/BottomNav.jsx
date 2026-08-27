import React, { useRef } from 'react';
import { t } from '../utils/i18n';

export default function BottomNav({ activeTab, setActiveTab, avatarEmoji, avatarImage, avatarType, settings }) {
  const lang = settings?.language || 'it';
  const lastClicksRef = useRef({});

  const doubleTapTargets = {
    missions: 'quests',
    quests: 'missions',
    nutrition: 'shopping',
    shopping: 'nutrition',
    settings: 'finances',
    finances: 'settings'
  };

  const navItems = [
    { id: 'habits', icon: '📜', label: t('nav.habits', lang) },
    {
      id: 'missions',
      icon: activeTab === 'quests' ? '🏆' : '⚔️',
      label: activeTab === 'quests' ? t('nav.quests', lang) : t('nav.tasks', lang)
    },
    { id: 'home', icon: 'avatar', label: t('nav.home', lang), isCenter: true },
    {
      id: 'nutrition',
      icon: activeTab === 'shopping' ? '🛒' : '🍎',
      label: activeTab === 'shopping' ? (lang === 'it' ? 'Spesa' : lang === 'es' ? 'Compra' : lang === 'ja' ? '買い物' : 'Shopping') : t('nav.nutrition', lang)
    },
    {
      id: 'settings',
      icon: activeTab === 'finances' ? '💰' : '⚙️',
      label: activeTab === 'finances' ? t('nav.finances', lang) : t('nav.settings', lang)
    },
  ];

  const handleItemClick = (itemId) => {
    const targetDoubleTap = doubleTapTargets[itemId];

    if (targetDoubleTap) {
      const now = Date.now();
      const lastClick = lastClicksRef.current[itemId] || 0;
      const delta = now - lastClick;
      lastClicksRef.current[itemId] = now;

      // Instant double-tap detection OR single tap when already on this tab group
      if (delta < 350 || activeTab === itemId || activeTab === targetDoubleTap) {
        const nextTab = activeTab === targetDoubleTap ? itemId : targetDoubleTap;
        setActiveTab(nextTab);
        return;
      }

      // Single tap from a different tab: switch INSTANTLY (0ms delay)
      setActiveTab(itemId);
    } else {
      setActiveTab(itemId);
    }
  };

  return (
    <nav
      style={{
        width: '100%',
        height: '60px',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--glass-border)',
        display: 'flex',
        justify: 'space-around',
        alignItems: 'center',
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.08)',
        position: 'relative',
        zIndex: 50,
        flexShrink: 0
      }}
    >
      {navItems.map((item) => {
        if (item.isCenter) {
          const isCenterActive = activeTab === item.id;
          return (
            <div key={item.id} style={{ position: 'relative', top: '-14px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button
                onClick={() => handleItemClick(item.id)}
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'var(--accent-gradient, linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid var(--bg-secondary)',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)',
                  cursor: 'pointer',
                  transform: isCenterActive ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.2s'
                }}
                title="Scheda Eroe (Home)"
              >
                {avatarType === 'image' && avatarImage ? (
                  <img
                    src={avatarImage}
                    alt="Avatar"
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: '22px' }}>{avatarEmoji || '⚔️'}</span>
                )}
              </button>
            </div>
          );
        }

        const isActive =
          activeTab === item.id ||
          (item.id === 'settings' && activeTab === 'finances') ||
          (item.id === 'missions' && (activeTab === 'quests' || activeTab === 'oneshots')) ||
          (item.id === 'nutrition' && activeTab === 'shopping');
        return (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              height: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: isActive ? 'bold' : 'normal',
              transition: 'color 0.2s'
            }}
          >
            <span style={{ fontSize: '18px', marginBottom: '2px' }}>{item.icon}</span>
            <span style={{ fontSize: '10px' }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
