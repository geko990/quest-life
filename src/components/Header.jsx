import React, { useState, useRef, useEffect } from 'react';
import { getCumulativeXpForLevel, forceUpdateApp } from '../utils/helpers';
import { TITLES } from '../utils/constants';

export default function Header({
  player,
  setPlayer,
  stats,
  habits = [],
  oneshots = [],
  completionLog,
  xpLog,
  settings,
  onOpenMottoEdit
}) {
  const [showProfile, setShowProfile] = useState(false);
  const [showStreak, setShowStreak] = useState(false);
  const [selectedMedal, setSelectedMedal] = useState(null);
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

  // Medal summary calculation helper
  const getMedalSummaryData = (medal) => {
    if (!medal) return null;

    let monthPrefix = '';
    if (medal.id && medal.id.includes('-') && medal.id.length === 7) {
      monthPrefix = medal.id;
    } else if (medal.earnedDate && medal.earnedDate.length >= 7) {
      monthPrefix = medal.earnedDate.substring(0, 7);
    } else {
      const d = new Date();
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      monthPrefix = `${yr}-${mo}`;
    }

    const [yearStr, monthNumStr] = monthPrefix.split('-');
    const monthNames = [
      "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
      "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
    ];
    const monthName = monthNames[parseInt(monthNumStr || '1') - 1] || 'Mese';
    const displayMonthYear = `${monthName} ${yearStr || ''}`.trim();

    // 1. Month XP Logs & Total XP
    const monthLogs = (xpLog || []).filter(
      log => log.date && log.date.startsWith(monthPrefix) && log.amount > 0
    );
    const totalMonthXp = monthLogs.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // 2. Most Developed Attribute/Ability (Emoji & Stat Name)
    const statXpMap = {};
    monthLogs.forEach(log => {
      if (log.statId) {
        statXpMap[log.statId] = (statXpMap[log.statId] || 0) + log.amount;
      }
    });

    let topStatId = null;
    let maxStatXp = 0;
    Object.entries(statXpMap).forEach(([sId, xp]) => {
      if (xp > maxStatXp) {
        maxStatXp = xp;
        topStatId = sId;
      }
    });
    const topStatObj = (stats || []).find(s => s.id === topStatId);

    // 3. Most Respected Habit
    const habitCountMap = {};
    Object.keys(completionLog || {}).forEach(dateStr => {
      if (dateStr.startsWith(monthPrefix)) {
        const list = completionLog[dateStr]?.habits || [];
        list.forEach(hId => {
          habitCountMap[hId] = (habitCountMap[hId] || 0) + 1;
        });
      }
    });

    let topHabitId = null;
    let maxHabitCount = 0;
    Object.entries(habitCountMap).forEach(([hId, cnt]) => {
      if (cnt > maxHabitCount) {
        maxHabitCount = cnt;
        topHabitId = hId;
      }
    });
    const topHabitObj = (habits || []).find(h => h.id === topHabitId);

    // 4. Top 10 Most Important Tasks (Highest Stars) Completed during Month
    const completedOneshotIdsInMonth = new Set();
    Object.keys(completionLog || {}).forEach(dateStr => {
      if (dateStr.startsWith(monthPrefix)) {
        const osList = completionLog[dateStr]?.oneshots || [];
        osList.forEach(id => completedOneshotIdsInMonth.add(id));
      }
    });

    const monthOneshots = (oneshots || []).filter(o => {
      if (!o.completed) return false;
      if (completedOneshotIdsInMonth.has(o.id)) return true;
      if (o.dailyPlanDate && o.dailyPlanDate.startsWith(monthPrefix)) return true;
      if (o.createdAt && o.createdAt.startsWith(monthPrefix)) return true;
      return false;
    });

    monthOneshots.sort((a, b) => {
      const starsA = a.difficulty || a.stars || 1;
      const starsB = b.difficulty || b.stars || 1;
      if (starsB !== starsA) return starsB - starsA;
      return (a.name || '').localeCompare(b.name || '');
    });

    const top10Tasks = monthOneshots.slice(0, 10);

    return {
      displayMonthYear,
      totalMonthXp,
      topStatObj,
      maxStatXp,
      topHabitObj,
      maxHabitCount,
      top10Tasks
    };
  };

  // 7-Day Mood & Activity Calculation Helper
  const get7DayActivity = () => {
    const days = [];
    const todayObj = new Date();
    let totalCompleted7Days = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayObj);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
      const dayName = dayNames[d.getDay()];

      const dayLog = completionLog?.[dateStr] || {};
      const habitsCount = (dayLog.habits || []).length;
      const oneshotsCount = (dayLog.oneshots || []).length;
      const questsCount = (dayLog.quests || []).length;
      const count = habitsCount + oneshotsCount + questsCount;

      totalCompleted7Days += count;

      days.push({
        dateStr,
        dayName,
        isToday: i === 0,
        count
      });
    }

    // Determine Mood & Encouragement level based on 7-day total
    let moodEmoji = '🌱';
    let moodTitle = 'Nuovo Inizio!';
    let moodDesc = 'Prenditi il tuo tempo. Ogni giorno offre una nuova opportunità per fare anche solo un piccolo passo, senza alcuna ansia.';
    let moodTag = 'Tranquillo';
    let moodColor = '#a855f7';

    if (totalCompleted7Days >= 21) {
      moodEmoji = '🥳';
      moodTitle = 'Super Inarrestabile!';
      moodDesc = 'Stai completando tantissimi traguardi! La tua energia è straordinaria, continua a festeggiare i tuoi successi!';
      moodTag = 'A Festa';
      moodColor = '#f59e0b';
    } else if (totalCompleted7Days >= 12) {
      moodEmoji = '😄';
      moodTitle = 'In Gran Forma!';
      moodDesc = 'Stai mantenendo un ottimo ritmo di completamento. Ottimo lavoro, stai procedendo alla grande!';
      moodTag = 'Attivo';
      moodColor = '#3b82f6';
    } else if (totalCompleted7Days >= 5) {
      moodEmoji = '🙂';
      moodTitle = 'Buon Ritmo!';
      moodDesc = 'Stai procedendo con i tuoi tempi in modo sereno e costante. Ogni singola azione completata ha un grande valore!';
      moodTag = 'Costante';
      moodColor = '#10b981';
    } else {
      moodEmoji = '🌱';
      moodTitle = 'Nuovo Inizio!';
      moodDesc = 'Zero ansia o pressione! Il bello del gioco è fare un piccolo passo quando ti senti pronto. Sei sulla strada giusta!';
      moodTag = 'Relax';
      moodColor = '#8b5cf6';
    }

    const maxDayCount = Math.max(1, ...days.map(d => d.count));

    return {
      days,
      totalCompleted7Days,
      moodEmoji,
      moodTitle,
      moodDesc,
      moodTag,
      moodColor,
      maxDayCount
    };
  };

  const activity7Days = get7DayActivity();

  return (
    <>
      {/* App Header (Original v3.3.0) */}
      <header className="app-header">
        {/* Engagement Mood Widget (Replaces strict streak) */}
        <div
          className="header-streak"
          id="headerStreak"
          onClick={() => setShowStreak(!showStreak)}
          title="Visualizza il tuo stato di impegno negli ultimi 7 giorni"
          style={{ cursor: 'pointer' }}
        >
          <div className="streak-circle" style={{ background: 'var(--bg-secondary)', border: `1px solid ${activity7Days.moodColor}` }}>
            <span className="streak-emoji" style={{ fontSize: '18px' }}>{activity7Days.moodEmoji}</span>
          </div>
          <div className="streak-badge-count" style={{ background: activity7Days.moodColor }}>
            <span id="globalStreak">{activity7Days.totalCompleted7Days}</span>
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
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px', fontWeight: 'bold' }}>
                  MEDAGLIE MENSILI ({getMonthName(player.monthlyChallenge?.currentMonth)})
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  🎯 Solo Task Singoli, Milestones e Campagne
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
                      title={`${medal.name} - Touch per il riepilogo mensile`}
                      className="medal-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowProfile(false);
                        setSelectedMedal(medal);
                      }}
                      style={{ fontSize: '24px', cursor: 'pointer', transition: 'transform 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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

      {/* Engagement Mood Popup (Replaces old strict streak) */}
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
              maxWidth: '330px',
              background: 'var(--bg-card)',
              border: '1px solid var(--glass-border)',
              borderRadius: '20px',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
              padding: '20px',
              zIndex: 9999,
              boxSizing: 'border-box'
            }}
          >
            {/* Top Info Header */}
            <div className="popup-header-info">
              <div className="popup-avatar-frame" style={{ background: activity7Days.moodColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="popup-emoji" style={{ fontSize: '24px' }}>{activity7Days.moodEmoji}</span>
              </div>
              <div className="popup-details">
                <h3 className="popup-name">{activity7Days.moodTitle}</h3>
                <div className="popup-level-info">
                  <span className="popup-level" style={{ color: activity7Days.moodColor, fontWeight: 'bold' }}>
                    {activity7Days.totalCompleted7Days} azioni negli ultimi 7 giorni
                  </span>
                </div>
              </div>
            </div>

            {/* Encouragement Description */}
            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '12px', margin: '12px 0', border: '1px solid var(--glass-border)' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
                {activity7Days.moodDesc}
              </p>
            </div>

            {/* 7-Day Activity Chart */}
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Andamento 7 Giorni</span>
                <span style={{ color: activity7Days.moodColor, fontWeight: 'bold' }}>Media: {(activity7Days.totalCompleted7Days / 7).toFixed(1)}/gg</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '70px', padding: '0 4px', gap: '6px' }}>
                {activity7Days.days.map((d, idx) => {
                  const heightPct = Math.max(12, Math.min(100, (d.count / activity7Days.maxDayCount) * 100));
                  return (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '9px', fontWeight: 'bold', color: d.count > 0 ? 'var(--text-primary)' : 'var(--text-muted)', marginBottom: '2px' }}>
                        {d.count > 0 ? d.count : ''}
                      </span>
                      <div
                        style={{
                          width: '100%',
                          height: `${heightPct}%`,
                          borderRadius: '6px 6px 4px 4px',
                          background: d.isToday ? activity7Days.moodColor : d.count > 0 ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                          opacity: d.count > 0 ? 1 : 0.4,
                          transition: 'height 0.3s ease'
                        }}
                      ></div>
                      <span style={{ fontSize: '9px', color: d.isToday ? activity7Days.moodColor : 'var(--text-secondary)', marginTop: '4px', fontWeight: d.isToday ? 'bold' : 'normal' }}>
                        {d.dayName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medal Summary Modal */}
      {selectedMedal && (() => {
        const summary = getMedalSummaryData(selectedMedal);
        if (!summary) return null;

        return (
          <div
            onClick={() => setSelectedMedal(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '400px',
                maxHeight: '85vh',
                overflowY: 'auto',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--glass-border)',
                borderRadius: '24px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                padding: '20px',
                boxSizing: 'border-box',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              {/* Header */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '4px' }}>
                  {selectedMedal.icon || '🏅'}
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {selectedMedal.name || `Medaglia di ${summary.displayMonthYear}`}
                </h3>
                <div style={{ fontSize: '11px', color: 'var(--accent-gold, #f59e0b)', fontWeight: 'bold', marginTop: '2px' }}>
                  Sbloccata nel mese di {summary.displayMonthYear}
                </div>
              </div>

              {/* Grid 1: Top Stat & Top Habit */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* 1. Attributo / Abilità maggiormente sviluppato */}
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '14px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    🎯 Top Attributo
                  </div>
                  <div style={{ fontSize: '28px', marginBottom: '2px' }}>
                    {summary.topStatObj?.icon || '⭐'}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {summary.topStatObj?.name || 'Nessuno'}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: 'bold', marginTop: '2px' }}>
                    +{summary.maxStatXp} XP
                  </div>
                </div>

                {/* 2. Abitudine più rispettata */}
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '14px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    📜 Top Abitudine
                  </div>
                  <div style={{ fontSize: '28px', marginBottom: '2px' }}>
                    {summary.topHabitObj?.emoji || '📜'}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {summary.topHabitObj?.name || 'Nessuna'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#22c55e', fontWeight: 'bold', marginTop: '2px' }}>
                    {summary.maxHabitCount > 0 ? `${summary.maxHabitCount} giorni ✓` : '0 giorni'}
                  </div>
                </div>
              </div>

              {/* 3. XP Totali Maturati nel Mese */}
              <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '14px', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>⚡</span>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-primary)' }}>XP Maturati nel Mese</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Esperienza totale accumulata</div>
                  </div>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--accent-gold, #f59e0b)' }}>
                  +{summary.totalMonthXp} XP
                </div>
              </div>

              {/* 4. Top 10 Task Più Importanti (Con più stelle) */}
              <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    ⭐ Top 10 Task Completati
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {summary.top10Tasks.length} completati
                  </span>
                </div>

                {summary.top10Tasks.length === 0 ? (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>
                    Nessuna missione completata registrata per questo mese.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {summary.top10Tasks.map((t, idx) => {
                      const primaryStat = (stats || []).find(s => s.id === t.primaryTarget);
                      const starsCount = t.difficulty || t.stars || 1;

                      return (
                        <div
                          key={t.id || idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'var(--bg-primary)',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: '1px solid var(--glass-border)',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                            <span style={{ fontSize: '14px', flexShrink: 0 }}>{t.emoji || '🎯'}</span>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {t.name}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <span style={{ fontSize: '10px', color: '#f59e0b' }}>
                              {'⭐'.repeat(starsCount)}
                            </span>
                            {primaryStat && (
                              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }} title={primaryStat.name}>
                                {primaryStat.icon}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Close Button */}
              <button
                onClick={() => setSelectedMedal(null)}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: '4px'
                }}
              >
                Chiudi ✓
              </button>
            </div>
          </div>
        );
      })()}
    </>
  );
}
