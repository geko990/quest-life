import React, { useState, useRef, useEffect } from 'react';
import { getCumulativeXpForLevel, forceUpdateApp } from '../utils/helpers';
import { TITLES } from '../utils/constants';

export default function Header({
  player,
  setPlayer,
  stats,
  completionLog,
  xpLog,
  settings,
  onOpenMottoEdit
}) {
  const [showProfile, setShowProfile] = useState(true);
  const [showStreak, setShowStreak] = useState(false);
  const profileRef = useRef(null);
  const streakRef = useRef(null);

  // Backdrop overlay handles popup closure on click outside

  // Calculate XP and level info
  const currentLevelTotal = getCumulativeXpForLevel(player.level);
  const nextLevelTotal = getCumulativeXpForLevel(player.level + 1);
  const xpInLevel = Math.max(0, player.totalXp - currentLevelTotal);
  const xpNeededForLevel = nextLevelTotal - currentLevelTotal;
  const xpPercent = Math.min(100, Math.max(0, (xpInLevel / xpNeededForLevel) * 100));

  // Determine Title
  const getPlayerTitle = () => {
    let title = TITLES[0].title;
    for (const t of TITLES) {
      if (player.level >= t.level) title = t.title;
    }
    return title;
  };

  // Check if streak was active today
  const todayStr = new Date().toISOString().split('T')[0];
  const isStreakActive = player.lastActionDate === todayStr;

  // Monthly challenge formatting
  const getMonthName = (monthId) => {
    if (!monthId) return 'Mese';
    const [, month] = monthId.split('-');
    const monthNames = [
      "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
      "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
    ];
    return monthNames[parseInt(month) - 1] || 'Mese';
  };

  return (
    <>
      {/* App Header (Original v3.3.0) */}
      <header className="app-header">
        {/* Streak Icon (Redesigned) */}
        <div
          className={`header-streak ${isStreakActive ? '' : 'grayscale'}`}
          id="headerStreak"
          onClick={() => setShowStreak(!showStreak)}
          title="Visualizza la tua serie attiva"
        >
          <div className="streak-circle">
            <span className="streak-emoji">🔥</span>
          </div>
          <div className="streak-badge-count">
            <span id="globalStreak">{player.globalStreak || 0}</span>
          </div>
        </div>

        <h1
          className="app-title"
          onClick={() => forceUpdateApp(true)}
          style={{ cursor: 'pointer' }}
          title="Tocca per forzare l'aggiornamento dell'app"
        >
          Real Playing Game
        </h1>

        {/* Compact Profile (Avatar + Level) */}
        <div
          className="header-profile"
          onClick={() => setShowProfile(!showProfile)}
          title="Visualizza profilo e medaglie"
        >
          <div className="header-avatar-frame" id="headerAvatarFrame">
            {player.avatarType === 'image' && player.avatarImage ? (
              <img className="header-img" src={player.avatarImage} alt="Avatar" />
            ) : (
              <span className="header-emoji" id="headerEmoji">
                {player.avatarEmoji || '⚔️'}
              </span>
            )}
          </div>
          <div className="header-level-badge">
            <span id="headerLevel">{player.level}</span>
          </div>
        </div>
      </header>

      {/* Profile Popup */}
      {showProfile && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9990, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
          onClick={() => setShowProfile(false)}
        >
          <div
            className="profile-popup popup-right"
            ref={profileRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: '65px',
              right: '16px',
              width: 'calc(100vw - 32px)',
              maxWidth: '340px',
              background: 'var(--bg-card)',
              border: '1px solid var(--glass-border)',
              borderRadius: '20px',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
              padding: '20px',
              zIndex: 9999,
              boxSizing: 'border-box'
            }}
          >
            <div className="popup-header-info">
              <div className="popup-avatar-frame">
                {player.avatarType === 'image' && player.avatarImage ? (
                  <img className="popup-img" src={player.avatarImage} alt="Avatar" />
                ) : (
                  <span className="popup-emoji" id="popupEmoji">
                    {player.avatarEmoji || '⚔️'}
                  </span>
                )}
              </div>
              <div className="popup-details">
                <h3 className="popup-name" id="popupName">{player.name}</h3>
                <div className="popup-level-info">
                  <span className="popup-level">
                    Livello <span id="popupLevel">{player.level}</span>
                  </span>
                  <span className="popup-title" id="popupTitle">{getPlayerTitle()}</span>
                </div>
              </div>
            </div>

            <div className="popup-xp-container">
              <div className="popup-xp-bar">
                <div
                  className="popup-xp-fill"
                  id="popupXpFill"
                  style={{ width: `${xpPercent}%` }}
                ></div>
              </div>
              <div className="popup-xp-text" id="popupXpText">
                {Math.floor(xpInLevel)} / {Math.floor(xpNeededForLevel)} XP
              </div>

              {/* Medal Progress */}
              <div style={{ marginTop: '15px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 'bold' }}>
                  MEDAGLIE MENSILI ({getMonthName(player.monthlyChallenge?.currentMonth)})
                </div>
                <div className="popup-xp-bar">
                  <div
                    className="popup-xp-fill"
                    id="monthlyProgressFill"
                    style={{
                      width: `${Math.min(100, ((player.monthlyChallenge?.points || 0) / (player.monthlyChallenge?.target || 50)) * 100)}%`,
                      background: 'var(--accent-gold, #f59e0b)'
                    }}
                  ></div>
                </div>
                <div className="popup-xp-text" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span id="monthlyLabel">{getMonthName(player.monthlyChallenge?.currentMonth)}</span>
                  <span id="monthlyPoints" style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                    {player.monthlyChallenge?.points || 0}/{player.monthlyChallenge?.target || 50}
                  </span>
                </div>
              </div>
            </div>

            {/* Medals Showcase Grid */}
            <div className="popup-motto-container" style={{ marginTop: '10px' }}>
              <div className="medals-grid" id="medalsGrid">
                {!player.monthlyChallenge?.medals || player.monthlyChallenge?.medals?.length === 0 ? (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Nessuna medaglia sbloccata questo mese
                  </span>
                ) : (
                  player.monthlyChallenge?.medals?.map((medal, idx) => (
                    <div
                      key={idx}
                      title={`${medal.name} - ${medal.earnedDate}`}
                      className="medal-item"
                      style={{ fontSize: '20px', cursor: 'help' }}
                    >
                      {medal.icon || '🏆'}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Personal Motto */}
            <div className="popup-motto-container" style={{ marginTop: '10px' }}>
              <div
                className="motto-display"
                id="popupMottoDisplay"
                onClick={() => {
                  setShowProfile(false);
                  onOpenMottoEdit();
                }}
                style={{ cursor: 'pointer', fontStyle: 'italic' }}
              >
                {player.motto ? `"${player.motto}"` : 'Inserisci il tuo motto qui... ✍️'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Streak Popup */}
      {showStreak && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9990, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
          onClick={() => setShowStreak(false)}
        >
          <div
            className="profile-popup popup-left"
            ref={streakRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: '65px',
              left: '16px',
              width: 'calc(100vw - 32px)',
              maxWidth: '320px',
              background: 'var(--bg-card)',
              border: '1px solid var(--glass-border)',
              borderRadius: '20px',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
              padding: '20px',
              zIndex: 9999,
              boxSizing: 'border-box'
            }}
          >
            <div className="popup-header-info">
              <div className="popup-avatar-frame" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                <span className="popup-emoji">🔥</span>
              </div>
              <div className="popup-details">
                <h3 className="popup-name">Serie Attiva</h3>
                <div className="popup-level-info">
                  <span className="popup-level">
                    <span id="popupStreakCount">{player.globalStreak || 0}</span> Giorni
                  </span>
                </div>
              </div>
            </div>

            <div className="popup-motto-container">
              <div className="freeze-info" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="freeze-icon">❄️</span>
                <span className="freeze-count" id="popupFreezeCount">{player.streakFreezes || 0}</span>
                <span className="freeze-max">/ 2 congelamenti rimanenti</span>
              </div>
              <p className="freeze-desc" style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                I congelamenti salvano la tua serie se salti un giorno. Si ripristinano il 1° giorno del mese.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
