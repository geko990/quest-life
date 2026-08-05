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
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-2xl border-b border-white/10 shadow-lg pt-[env(safe-area-inset-top)]">
      <div className="w-full max-w-md mx-auto flex items-center justify-between px-4 py-4 min-h-[80px] relative">
        
        {/* LEFT: Streak Flame Badge */}
        <div
          onClick={() => setShowStreak(!showStreak)}
          className={`header-streak ml-2 flex items-center gap-1.5 cursor-pointer bg-slate-900/80 border border-orange-500/50 px-3 py-1.5 rounded-full select-none transition-all duration-300 active:scale-95 hover:bg-orange-500/20 shadow-md ${
            isStreakActive ? 'opacity-100 shadow-[0_0_12px_rgba(249,115,22,0.35)] border-orange-500/60' : 'grayscale opacity-75'
          }`}
          title="Visualizza la tua serie attiva"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-xs shadow-md animate-pulse flex-shrink-0">
            🔥
          </div>
          <span className="text-xs font-extrabold text-orange-400 font-sans tracking-tight">
            {player.globalStreak || 0}
          </span>
        </div>

        {/* CENTER: Grand App Title (RPG Life) */}
        <div className="flex flex-col items-center justify-center px-2">
          <h1
            onClick={() => forceUpdateApp(true)}
            className="text-xl font-bold font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-accent-primary to-accent-secondary select-none tracking-widest cursor-pointer hover:scale-105 active:scale-95 transition-transform text-center filter drop-shadow-[0_2px_8px_rgba(168,85,247,0.4)]"
            title="Tocca per forzare l'aggiornamento dell'app"
          >
            RPG Life
          </h1>
          <span className="text-[8px] font-bold uppercase tracking-widest text-text-secondary/70 -mt-0.5 text-center">
            Habit Tracker RPG
          </span>
        </div>

        {/* RIGHT: Avatar Photo/Emoji + Level Badge */}
        <div
          onClick={() => setShowProfile(!showProfile)}
          className="header-profile mr-2 relative cursor-pointer select-none transition-transform active:scale-95 flex-shrink-0"
          title="Visualizza profilo e medaglie"
        >
          <div className="relative w-9 h-9 rounded-full bg-slate-900 border-2 border-accent-primary flex items-center justify-center shadow-lg overflow-hidden ring-2 ring-accent-primary/40">
            {player.avatarType === 'image' && player.avatarImage ? (
              <img src={player.avatarImage} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-base">{player.avatarEmoji || '⚔️'}</span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-accent-primary text-white text-[8px] font-extrabold px-1.5 py-0.2 rounded-full border border-slate-950 shadow-md">
            {player.level}
          </div>
        </div>

        {/* STREAK POPUP OVERLAY */}
        {showStreak && (
          <div
            ref={streakRef}
            className="absolute left-4 top-16 w-72 p-4 glass-panel z-50 text-left shadow-2xl animate-float border border-white/10"
          >
            <div className="flex items-center gap-3 mb-3 border-b border-border-color pb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center text-xl shadow">
                🔥
              </div>
              <div>
                <h3 className="font-bold text-xs text-text-main font-cinzel">Serie Attiva</h3>
                <p className="text-xs text-orange-400 font-semibold">{player.globalStreak || 0} Giorni Consecutivi</p>
              </div>
            </div>
            <div className="space-y-2.5 text-xs text-text-secondary">
              <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded-lg border border-border-color/30">
                <span>❄️ Congelamenti Serie</span>
                <span className="font-bold text-accent-primary">
                  {player.streakFreezes || 0} / 2 questo mese
                </span>
              </div>
              <p className="text-[10px] leading-relaxed text-text-secondary/80">
                I congelamenti evitano l'azzeramento della serie se salti un giorno. Si ripristinano il 1° di ogni mese.
              </p>
            </div>
          </div>
        )}

        {/* PROFILE & MEDALS RECAP POPUP OVERLAY */}
        {showProfile && (
          <div
            ref={profileRef}
            className="absolute right-4 top-16 w-80 p-5 glass-panel z-50 text-left shadow-2xl animate-scale-up border border-white/10"
          >
            {/* Avatar & Level title info */}
            <div className="flex items-center gap-3.5 mb-4 pb-3 border-b border-border-color">
              <div className="relative w-12 h-12 rounded-full bg-slate-900 border-2 border-accent-primary flex items-center justify-center shadow-inner text-xl overflow-hidden flex-shrink-0">
                {player.avatarType === 'image' && player.avatarImage ? (
                  <img src={player.avatarImage} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span>{player.avatarEmoji || '⚔️'}</span>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs text-text-main truncate">{player.name}</h3>
                <p className="text-[11px] text-text-secondary">
                  Livello <span className="font-bold text-accent-primary">{player.level}</span> — <span className="font-cinzel font-semibold">{getPlayerTitle()}</span>
                </p>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-[10px] text-text-secondary mb-1">
                <span>Esperienza (XP)</span>
                <span className="font-bold text-text-main">{Math.floor(xpInLevel)} / {Math.floor(xpNeededForLevel)} XP</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950/50 rounded-full overflow-hidden border border-border-color/40">
                <div
                  className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-300"
                  style={{ width: `${xpPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Monthly Medals & Points Recap */}
            <div className="mb-4 pt-3 border-t border-border-color/40">
              <div className="flex justify-between items-center text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                <span>Punti Sfida Mensile</span>
                <span className="text-yellow-400 font-bold">
                  {player.monthlyChallenge?.points || 0} / {player.monthlyChallenge?.target || 50} pts
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950/50 rounded-full overflow-hidden border border-border-color/40 mb-3">
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

              {/* Medals Showcase */}
              <div>
                <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Bacheca Medaglie ({getMonthName(player.monthlyChallenge?.currentMonth)})
                </div>
                <div className="flex gap-2 flex-wrap min-h-8">
                  {!player.monthlyChallenge?.medals || player.monthlyChallenge?.medals?.length === 0 ? (
                    <span className="text-[10px] text-text-secondary/70 italic">Nessuna medaglia sbloccata questo mese</span>
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
            <div className="pt-3 border-t border-border-color/40">
              <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">
                Motto Personale
              </div>
              <div
                onClick={() => {
                  setShowProfile(false);
                  onOpenMottoEdit();
                }}
                className="text-xs italic text-text-secondary hover:text-text-main cursor-pointer bg-slate-950/30 p-2.5 rounded-lg border border-dashed border-border-color hover:border-accent-primary transition-colors text-center"
              >
                {player.motto ? `"${player.motto}"` : 'Inserisci il tuo motto qui... ✍️'}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
