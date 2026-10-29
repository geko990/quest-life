import React, { useRef, useState } from 'react';

import { _t } from '../i18n';
import Emoji from './Emoji';
export default function BottomNav({ activeTab, setActiveTab, avatarEmoji, avatarImage, avatarType, isLandscape = false, onLongPressHome, badges = {} }) {
  const lastClicksRef = useRef({});

  // Pressione prolungata sul pulsante centrale "Eroe": crea subito una nuova missione
  const longPressTimerRef = useRef(null);
  const longPressFiredRef = useRef(false);
  const [isPressingHome, setIsPressingHome] = useState(false);
  const cancelLongPress = () => {
    clearTimeout(longPressTimerRef.current);
    setIsPressingHome(false);
  };
  const homeLongPressHandlers = {
    onPointerDown: () => {
      longPressFiredRef.current = false;
      if (!onLongPressHome) return;
      setIsPressingHome(true);
      longPressTimerRef.current = setTimeout(() => {
        longPressFiredRef.current = true;
        setIsPressingHome(false);
        if (navigator.vibrate) navigator.vibrate(15);
        onLongPressHome();
      }, 450);
    },
    onPointerUp: cancelLongPress,
    onPointerLeave: cancelLongPress,
    onPointerCancel: cancelLongPress,
    onContextMenu: (e) => e.preventDefault()
  };
  const handleHomeClick = () => {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    handleItemClick('home');
  };

  const doubleTapTargets = {
    missions: 'quests',
    quests: 'missions',
    nutrition: 'shopping',
    shopping: 'nutrition',
    settings: 'finances',
    finances: 'settings'
  };

  const navItems = [
    { id: 'habits', icon: '📜', label: _t("Abitudini") },
    {
      id: 'missions',
      icon: activeTab === 'quests' ? '🏆' : '⚔️',
      label: activeTab === 'quests' ? _t("Campagne") : _t("Missioni")
    },
    { id: 'home', icon: 'avatar', label: _t("Eroe"), isCenter: true },
    {
      id: 'nutrition',
      icon: activeTab === 'shopping' ? '🛒' : '🍎',
      label: activeTab === 'shopping' ? _t("Spesa") : _t("Salute")
    },
    {
      id: 'settings',
      icon: activeTab === 'finances' ? '💰' : '⚙️',
      label: activeTab === 'finances' ? _t("Tesoro") : _t("Opzioni")
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

  // Landscape Navigation Rail View
  if (isLandscape) {
    return (
      <nav
        className="app-nav-rail"
        style={{
          width: '68px',
          height: '100%',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 4px',
          boxShadow: '4px 0 16px rgba(0, 0, 0, 0.15)',
          position: 'relative',
          zIndex: 50,
          flexShrink: 0,
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '8px' }}>
          {/* Hero Avatar at top of rail */}
          {(() => {
            const isCenterActive = activeTab === 'home';
            return (
              <button
                onClick={handleHomeClick}
                {...homeLongPressHandlers}
                style={{
                  WebkitTouchCallout: 'none',
                  userSelect: 'none',
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'var(--accent-gradient, linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: isCenterActive ? '3px solid var(--accent-primary)' : '2px solid var(--glass-border)',
                  boxShadow: isCenterActive ? '0 0 14px var(--accent-primary)' : '0 2px 8px rgba(0, 0, 0, 0.2)',
                  cursor: 'pointer',
                  transform: isCenterActive ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                  padding: 0,
                  marginBottom: '4px'
                }}
                title={_t("Scheda Eroe (Home) — tieni premuto per creare una missione")}
              >
                {avatarType === 'image' && avatarImage ? (
                  <img
                    src={avatarImage}
                    alt={_t("Avatar")}
                    draggable={false}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', pointerEvents: 'none', WebkitTouchCallout: 'none' }}
                  />
                ) : (
                  <span style={{ fontSize: '20px' }}><Emoji e={avatarEmoji || '⚔️'} big /></span>
                )}
              </button>
            );
          })()}
        </div>

        {/* Other 4 Nav Items */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '6px', flex: 1, justifyContent: 'space-around', margin: '6px 0' }}>
          {navItems.filter(i => !i.isCenter).map((item) => {
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
                  width: '100%',
                  padding: '6px 2px',
                  background: isActive ? 'rgba(124, 58, 237, 0.12)' : 'none',
                  borderRadius: '12px',
                  border: isActive ? '1px solid rgba(124, 58, 237, 0.25)' : '1px solid transparent',
                  cursor: 'pointer',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 'bold' : 'normal',
                  transition: 'all 0.2s ease'
                }}
                title={_t(item.label)}
              >
                <span style={{ fontSize: '18px', marginBottom: '2px', position: 'relative' }}>
                  <span className={`nav-em${isActive ? '' : ' is-off'}`}><Emoji e={item.icon} /></span>
                  {badges[item.id] > 0 && <span className="nav-dot">{badges[item.id] > 9 ? '9+' : badges[item.id]}</span>}
                </span>
                <span style={{ fontSize: '9px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '58px' }}>
                  {_t(item.label)}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  // Portrait Bottom Navigation Bar
  return (
    <nav
      className="app-bottom-nav"
      style={{
        width: '100%',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--glass-border)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: '4px',
        // Le etichette scendono nello spazio libero sopra la barra Home di iOS: recuperiamo qualche px
        paddingBottom: 'max(6px, calc(env(safe-area-inset-bottom, 0px) - 8px))',
        boxShadow: 'var(--bar-shadow-nav, 0 -4px 16px rgba(0, 0, 0, 0.08))',
        position: 'relative',
        zIndex: 50,
        flexShrink: 0,
        boxSizing: 'border-box'
      }}
    >
      {navItems.map((item) => {
        if (item.isCenter) {
          const isCenterActive = activeTab === item.id;
          return (
            <div key={item.id} style={{ position: 'relative', top: '-14px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button
                onClick={handleHomeClick}
                {...homeLongPressHandlers}
                style={{
                  WebkitTouchCallout: 'none',
                  userSelect: 'none',
                  touchAction: 'manipulation',
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'var(--accent-gradient, linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid var(--bg-secondary)',
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.45)',
                  cursor: 'pointer',
                  transform: isPressingHome ? 'scale(0.9)' : (isCenterActive ? 'scale(1.1)' : 'scale(1)'),
                  transition: isPressingHome ? 'transform 0.45s ease-out' : 'transform 0.2s',
                  WebkitTapHighlightColor: 'transparent'
                }}
                title={_t("Scheda Eroe (Home) — tieni premuto per creare una missione")}
              >
                {avatarType === 'image' && avatarImage ? (
                  <img
                    src={avatarImage}
                    alt={_t("Avatar")}
                    draggable={false}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', pointerEvents: 'none', WebkitTouchCallout: 'none' }}
                  />
                ) : (
                  <span style={{ fontSize: '22px' }}><Emoji e={avatarEmoji || '⚔️'} big /></span>
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
              height: '46px',
              padding: '2px 0 0 0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: isActive ? 'bold' : 'normal',
              transition: 'color 0.2s',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <span
              key={isActive ? `${item.id}-on` : `${item.id}-off`}
              className={isActive ? 'nav-icon-pop' : undefined}
              style={{ fontSize: '18px', marginBottom: '8px', lineHeight: 1, position: 'relative' }}
            >
              <span className={`nav-em${isActive ? '' : ' is-off'}`}><Emoji e={item.icon} /></span>
              {isActive && <span className="nav-active-dot" />}
              {badges[item.id] > 0 && <span className="nav-dot">{badges[item.id] > 9 ? '9+' : badges[item.id]}</span>}
            </span>
            <span style={{ fontSize: '9.5px', lineHeight: 1.1, letterSpacing: '0.1px' }}>{_t(item.label)}</span>
          </button>
        );
      })}
    </nav>
  );
}
