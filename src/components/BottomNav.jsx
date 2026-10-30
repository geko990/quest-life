import React, { useRef, useState } from 'react';

import { _t } from '../i18n';
import Emoji from './Emoji';
export default function BottomNav({ activeTab, setActiveTab, avatarEmoji, avatarImage, avatarType, isLandscape = false, onLongPressHome, badges = {}, allowed = null, fresh = {}, hints = {} }) {
  // L'app che cresce (#62): `allowed` dice quali aree si vedono (null = tutte), `fresh` le aree appena aperte
  // (pallino e comparsa animata), `hints` un suggerimento sopra una voce (es. "Tocca due volte" per il Tesoro)
  const can = (f) => !allowed || allowed[f] !== false;
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
    ...(can('quests') ? { missions: 'quests', quests: 'missions' } : {}),
    ...(can('shopping') ? { nutrition: 'shopping', shopping: 'nutrition' } : {}),
    ...(can('finances') ? { settings: 'finances', finances: 'settings' } : {})
  };

  const navItems = [
    { id: 'habits', icon: '📜', label: _t("Abitudini") },
    can('missions') && {
      id: 'missions',
      icon: activeTab === 'quests' ? '🏆' : '⚔️',
      label: activeTab === 'quests' ? _t("Campagne") : _t("Missioni")
    },
    { id: 'home', icon: 'avatar', label: _t("Eroe"), isCenter: true },
    can('nutrition') && {
      id: 'nutrition',
      icon: activeTab === 'shopping' ? '🛒' : '🍎',
      label: activeTab === 'shopping' ? _t("Spesa") : _t("Salute")
    },
    {
      id: 'settings',
      icon: activeTab === 'finances' ? '💰' : '⚙️',
      label: activeTab === 'finances' ? _t("Tesoro") : _t("Opzioni")
    },
  ].filter(Boolean);

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

  // Barra laterale in orizzontale (a destra, a portata di pollice): stessa struttura della barra in basso
  // ruotata di 90° — Abitudini, Missioni, Eroe al centro, Salute, Opzioni dall'alto in basso.
  // La larghezza aggiunge il margine del notch (safe-area) invece di toglierlo allo spazio delle icone.
  if (isLandscape) {
    return (
      <nav className="app-nav-rail">
        {navItems.map((item) => {
          if (item.isCenter) {
            const isCenterActive = activeTab === item.id;
            return (
              <div key={item.id} className="rail-center">
                <button
                  onClick={handleHomeClick}
                  {...homeLongPressHandlers}
                  className="rail-hero"
                  style={{
                    transform: isPressingHome ? 'scale(0.9)' : (isCenterActive ? 'scale(1.1)' : 'scale(1)'),
                    transition: isPressingHome ? 'transform 0.45s ease-out' : 'transform 0.2s'
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
              className={`rail-item${isActive ? ' is-active' : ''}${fresh[item.id] ? ' nav-appear' : ''}`}
              title={_t(item.label)}
            >
              <span
                key={isActive ? `${item.id}-on` : `${item.id}-off`}
                className={isActive ? 'nav-icon-pop' : undefined}
                style={{ fontSize: '18px', lineHeight: 1, position: 'relative' }}
              >
                <span className={`nav-em${isActive ? '' : ' is-off'}`}><Emoji e={item.icon} /></span>
                {badges[item.id] > 0 && <span className="nav-dot">{badges[item.id] > 9 ? '9+' : badges[item.id]}</span>}
                {fresh[item.id] && !(badges[item.id] > 0) && <span className="nav-new-dot" />}
              </span>
              <span className="rail-label">{_t(item.label)}</span>
            </button>
          );
        })}
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
            className={fresh[item.id] ? 'nav-appear' : undefined}
            style={{
              position: 'relative',
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
              {fresh[item.id] && !(badges[item.id] > 0) && <span className="nav-new-dot" />}
            </span>
            {hints[item.id] && <span className="nav-hint">{hints[item.id]}</span>}
            <span style={{ fontSize: '9.5px', lineHeight: 1.1, letterSpacing: '0.1px' }}>{_t(item.label)}</span>
          </button>
        );
      })}
    </nav>
  );
}
