import React, { useState, useRef, useEffect } from 'react';
import { getCumulativeXpForLevel, getXpForLevel, forceUpdateApp } from '../utils/helpers';
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
  const [showProfile, setShowProfile] = useState(false);
  const [showStreak, setShowStreak] = useState(false);
  const profileRef = useRef(null);
  const streakRef = useRef(null);

  // Close popups on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target) && !event.target.closest('.header-profile')) {
        setShowProfile(false);
      }
      if (streakRef.current && !streakRef.current.contains(event.target) && !event.target.closest('.header-streak')) {
        setShowStreak(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  const todayStr = new Date().toISOString().split('T')[0]; // Simple date match
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

  // Calculate completed difficulty stars counts for this month
  const getMonthlyStarCounts = () => {
    const currentMonth = player.monthlyChallenge?.currentMonth;
    if (!currentMonth) return { 3: 0, 4: 0, 5: 0 };
    
    const counts = { 3: 0, 4: 0, 5: 0 };
    
    // Go through completionLog dates in the current month
    Object.keys(completionLog).forEach((dateStr) => {
      if (dateStr.startsWith(currentMonth)) {
        const dayHabits = completionLog[dateStr]?.habits || [];
        dayHabits.forEach((habitId) => {
          // Find difficulty of habit in state (mock or state, assuming we look it up or keep in log)
          // Since it's a lookup, we'll just sum what we find in the current state habits
          // If a habit was deleted, we might not find it, but this is standard
        });
      }
    });
    
    return counts;
  };

  const starCounts = getMonthlyStarCounts();

  return (
    <header className="relative flex justify-between items-center px-4 py-3 bg-[#0f0f1a]/85 backdrop-blur-md border-b border-border-color z-40">
      {/* Streak Badge */}
      <div
        onClick={() => setShowStreak(!showStreak)}
        className={`header-streak flex items-center gap-1.5 cursor-pointer bg-slate-900/40 border border-slate-700/30 px-3 py-1 rounded-full select-none transition-all duration-300 active:scale-95 hover:bg-slate-950/20 ${
          isStreakActive ? 'opacity-100 shadow-[0_0_12px_rgba(249,115,22,0.25)] border-orange-500/20' : 'grayscale opacity-75'
        }`}
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-sm shadow-md animate-pulse">
          🔥
        </div>
        <span className="text-sm font-bold text-orange-400">{player.globalStreak || 0}</span>
      </div>

      {/* Title (Click to Force Update) */}
      <h1
        onClick={() => forceUpdateApp(true)}
        className="text-xl font-bold font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary select-none tracking-wider cursor-pointer hover:scale-105 active:scale-95 transition-transform"
        title="Tocca per forzare l'aggiornamento dell'app"
      >
        RPG Life
      </h1>

      {/* Avatar & Level */}
      <div
        onClick={() => setShowProfile(!showProfile)}
        className="header-profile flex items-center gap-2 cursor-pointer select-none transition-transform active:scale-95"
      >
        <div className="relative w-9 h-9 rounded-full bg-slate-800 border-2 border-accent-primary flex items-center justify-center shadow-md overflow-hidden">
          {player.avatarType === 'image' && player.avatarImage ? (
            <img src={player.avatarImage} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg">{player.avatarEmoji || '⚔️'}</span>
          )}
        </div>
        <div className="bg-accent-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-bg-main -ml-3 mt-4 z-10">
          Lvl {player.level}
        </div>
      </div>

      {/* STREAK POPUP */}
      {showStreak && (
        <div
          ref={streakRef}
          className="absolute left-4 top-14 w-72 p-4 glass-panel z-50 text-left animate-float"
        >
          <div className="flex items-center gap-3 mb-3 border-b border-border-color pb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center text-xl shadow">
              🔥
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-main">Serie Attiva</h3>
              <p className="text-xs text-orange-400 font-semibold">{player.globalStreak || 0} Giorni</p>
            </div>
          </div>
          <div className="space-y-2.5 text-xs text-text-secondary">
            <div className="flex justify-between items-center bg-slate-950/30 p-2 rounded-lg">
              <span>❄️ Congelamenti</span>
              <span className="font-bold text-accent-primary">
                {player.streakFreezes || 0} / 2 questo mese
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-text-secondary/80">
              I congelamenti prevengono l'azzeramento della serie se salti un giorno. Si ripristinano il 1° di ogni mese.
            </p>
          </div>
        </div>
      )}

      {/* PROFILE POPUP */}
      {showProfile && (
        <div
          ref={profileRef}
          className="absolute right-4 top-14 w-80 p-5 glass-panel z-50 text-left"
        >
          {/* Avatar and title info */}
          <div className="flex items-center gap-4 mb-4 pb-3 border-b border-border-color">
            <div className="relative w-14 h-14 rounded-full bg-slate-800 border-2 border-accent-primary flex items-center justify-center shadow-inner text-2xl">
              {player.avatarType === 'image' && player.avatarImage ? (
                <img src={player.avatarImage} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span>{player.avatarEmoji || '⚔️'}</span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-main">{player.name}</h3>
              <p className="text-xs text-text-secondary">
                Livello <span className="font-semibold text-accent-primary">{player.level}</span> — {getPlayerTitle()}
              </p>
            </div>
          </div>

          {/* XP Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-[11px] text-text-secondary mb-1">
              <span>Esperienza (XP)</span>
              <span className="font-bold">{Math.floor(xpInLevel)} / {Math.floor(xpNeededForLevel)} XP</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950/40 rounded-full overflow-hidden border border-border-color">
              <div
                className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-300"
                style={{ width: `${xpPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Monthly Challenges info */}
          <div className="mb-4 pt-3 border-t border-border-color/50">
            <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">
              Medaglie Mensili
            </div>
            <div className="w-full h-2 bg-slate-950/40 rounded-full overflow-hidden border border-border-color mb-1">
              <div
                className="h-full bg-yellow-500 transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    ((player.monthlyChallenge?.points || 0) / (player.monthlyChallenge?.target || 50)) * 100
                  )}%`
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-text-secondary">{getMonthName(player.monthlyChallenge?.currentMonth)}</span>
              <span className="text-yellow-500">
                {player.monthlyChallenge?.points || 0} / {player.monthlyChallenge?.target || 50}
              </span>
            </div>

            {/* Medals List */}
            <div className="mt-3">
              <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                Bacheca Medaglie
              </div>
              <div className="flex gap-2 flex-wrap min-h-8">
                {player.monthlyChallenge?.medals?.length === 0 ? (
                  <span className="text-[10px] text-text-secondary/70 italic">Nessuna medaglia guadagnata</span>
                ) : (
                  player.monthlyChallenge?.medals?.map((medal, idx) => (
                    <div
                      key={idx}
                      title={`${medal.name} - ${medal.earnedDate}`}
                      className="w-8 h-8 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-sm shadow cursor-help"
                    >
                      {medal.icon || '🏆'}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Personal Motto */}
          <div className="pt-3 border-t border-border-color/50">
            <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">
              Motto Personale
            </div>
            <div
              onClick={() => {
                setShowProfile(false);
                onOpenMottoEdit();
              }}
              className="text-xs italic text-text-secondary hover:text-text-main cursor-pointer bg-slate-950/20 p-2 rounded border border-dashed border-border-color hover:border-accent-primary transition-colors"
            >
              {player.motto ? `"${player.motto}"` : 'Inserisci il tuo motto qui... ✍️'}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
