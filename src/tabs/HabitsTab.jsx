import React, { useState, useEffect, useRef } from 'react';
import { getGameDate, getGameDateObj, formatISO, getWeekIdentifier, getMonthIdentifier, getYearIdentifier } from '../utils/helpers';
import SwipeableCard from '../components/SwipeableCard';

export default function HabitsTab({
  habits,
  completionLog,
  setCompletionLog,
  onToggleHabit,
  onOpenModal,
  onDeleteHabit,
  onEditHabit,
  pomodoro,
  setPomodoro,
  stats,
  onRewardXp,
  settings
}) {
  const todayStr = getGameDate(settings.dayStartTime);
  const [viewedDate, setViewedDate] = useState(todayStr);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const calendarScrollRef = useRef(null);

  // Resume/Run Pomodoro Timer countdown
  const [pomoSecs, setPomoSecs] = useState(0);

  useEffect(() => {
    let interval = null;
    if (pomodoro.status === 'running') {
      const target = new Date(pomodoro.targetTime).getTime();
      const checkTimer = () => {
        const now = Date.now();
        const diff = Math.max(0, Math.ceil((target - now) / 1000));
        setPomoSecs(diff);

        if (diff <= 0) {
          // Timer finished!
          clearInterval(interval);
          handlePomodoroFinish();
        }
      };

      checkTimer();
      interval = setInterval(checkTimer, 1000);
    } else if (pomodoro.status === 'paused') {
      setPomoSecs(pomodoro.remainingTime || 0);
    } else {
      setPomoSecs(pomodoro.workDuration * 60);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pomodoro.status, pomodoro.targetTime, pomodoro.workDuration]);

  // Scroll calendar to end on mount
  useEffect(() => {
    if (calendarScrollRef.current) {
      calendarScrollRef.current.scrollLeft = calendarScrollRef.current.scrollWidth;
    }
  }, []);

  const handlePomodoroFinish = () => {
    // Reward XP
    onRewardXp(pomodoro.targetStatId, pomodoro.xpPerSession);
    
    // Play a basic beep sound if audio is enabled
    if (settings.soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        osc.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (e) {
        console.error(e);
      }
    }

    alert(`🍅 Pomodoro completato! Hai guadagnato +${pomodoro.xpPerSession} XP in ${stats.find(s => s.id === pomodoro.targetStatId)?.name || 'Studio'}!`);

    setPomodoro(prev => ({
      ...prev,
      status: 'idle',
      targetTime: null,
      remainingTime: null,
      sessionsToday: (prev.sessionsToday || 0) + 1,
      lastSessionDate: todayStr
    }));
  };

  const startPomodoro = () => {
    const target = new Date(Date.now() + pomodoro.workDuration * 60 * 1000).toISOString();
    setPomodoro(prev => ({
      ...prev,
      status: 'running',
      targetTime: target,
      remainingTime: null
    }));
  };

  const pausePomodoro = () => {
    setPomodoro(prev => ({
      ...prev,
      status: 'paused',
      remainingTime: pomoSecs
    }));
  };

  const resumePomodoro = () => {
    const target = new Date(Date.now() + pomoSecs * 1000).toISOString();
    setPomodoro(prev => ({
      ...prev,
      status: 'running',
      targetTime: target,
      remainingTime: null
    }));
  };

  const stopPomodoro = () => {
    setPomodoro(prev => ({
      ...prev,
      status: 'idle',
      targetTime: null,
      remainingTime: null
    }));
  };

  // Helper: count how many times a habit was completed in a given period
  const countCompletionsInPeriod = (habitId, frequency, periodId) => {
    let count = 0;
    Object.keys(completionLog).forEach(dateStr => {
      const log = completionLog[dateStr];
      if (log?.habits?.includes(habitId)) {
        const isWeekly = frequency === 'weekly' || frequency === 'times_week';
        const isMonthly = frequency === 'monthly' || frequency === 'times_month';
        const logPeriodId = isWeekly ? getWeekIdentifier(dateStr, settings.weekStart) :
                            isMonthly ? getMonthIdentifier(dateStr) :
                            getYearIdentifier(dateStr);
        if (logPeriodId === periodId) {
          count++;
        }
      }
    });
    return count;
  };

  // Helper: get visible habits for a specific date
  const getHabitsForDate = (dateStr) => {
    const isPast = dateStr < todayStr;
    const isToday = dateStr === todayStr;

    return habits.filter(h => {
      if (h.locked) return false;

      if (h.createdAt) {
        const createdDate = h.createdAt.split('T')[0];
        if (createdDate > dateStr) return false;
      }

      if (h.frequency && h.frequency !== 'daily') {
        const isWeekly = h.frequency === 'weekly' || h.frequency === 'times_week';
        const isMonthly = h.frequency === 'monthly' || h.frequency === 'times_month';
        const periodId = isWeekly ? getWeekIdentifier(dateStr, settings.weekStart) :
                          isMonthly ? getMonthIdentifier(dateStr) :
                          getYearIdentifier(dateStr);

        const completionsThisPeriod = countCompletionsInPeriod(h.id, h.frequency, periodId);
        const targetCompletions = h.freqTimes || 1;
        const isCompletedOnDate = completionLog[dateStr]?.habits?.includes(h.id);

        if (isCompletedOnDate) return true;
        if (completionsThisPeriod >= targetCompletions) return false;
        if (isToday) return true;
        if (dateStr > todayStr) return true;
        if (isPast) return false;
      }

      return true;
    });
  };

  const isHabitCompletedOnDate = (habitId, dateStr) => {
    return completionLog[dateStr]?.habits?.includes(habitId) || false;
  };

  const getCompletionPercentageForDate = (dateStr) => {
    const visibleHabits = getHabitsForDate(dateStr);
    if (visibleHabits.length === 0) {
      // Check if there were any habits created before that date
      const possible = habits.filter(h => {
        if (h.locked) return false;
        if (h.createdAt) {
          const createdDate = h.createdAt.split('T')[0];
          if (createdDate > dateStr) return false;
        }
        return true;
      });
      return possible.length > 0 ? 100 : 0;
    }

    let completed = 0;
    visibleHabits.forEach(h => {
      if (isHabitCompletedOnDate(h.id, dateStr)) completed++;
    });

    return Math.floor((completed / visibleHabits.length) * 100);
  };

  // Generate calendar days
  const calendarDays = [];
  const startDay = getGameDateObj(settings.dayStartTime);
  for (let i = 21; i >= 0; i--) {
    const dateObj = new Date(startDay);
    dateObj.setDate(dateObj.getDate() - i);
    calendarDays.push(dateObj);
  }

  const [timeFilter, setTimeFilter] = useState('all');

  const visibleHabits = getHabitsForDate(viewedDate);
  const filteredHabits = visibleHabits.filter(h => {
    if (timeFilter === 'all') return true;
    return h.timeOfDay === timeFilter;
  });

  const habitsToShow = filteredHabits.map(h => ({
    ...h,
    completed: isHabitCompletedOnDate(h.id, viewedDate)
  })).sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));

  // Format time (MM:SS)
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-5 pb-24 p-4 max-w-md mx-auto">
      {/* Calendar Header */}
      <div className="glass-panel p-3">
        <div
          ref={calendarScrollRef}
          className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth"
        >
          {calendarDays.map((day, idx) => {
            const dateStr = formatISO(day);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === viewedDate;
            const completionPct = getCompletionPercentageForDate(dateStr);
            const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

            return (
              <div
                key={idx}
                onClick={() => setViewedDate(dateStr)}
                className={`flex-shrink-0 w-11 py-2 rounded-xl flex flex-col items-center cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'bg-accent-primary text-white scale-105 shadow-md shadow-accent-primary/20'
                    : isToday
                    ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20'
                    : 'bg-slate-900/20 hover:bg-slate-950/20 text-text-secondary hover:text-text-main'
                }`}
              >
                <span className="text-[9px] uppercase font-bold tracking-wider opacity-75">
                  {dayNames[day.getDay()]}
                </span>
                <span className="text-sm font-bold mt-0.5">{day.getDate()}</span>
                {/* Micro completion dot/ring */}
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 transition-colors" style={{
                  backgroundColor: completionPct === 100 ? '#22c55e' : completionPct > 0 ? 'var(--accent-primary)' : 'transparent',
                  border: completionPct > 0 && completionPct < 100 ? '1px solid currentColor' : 'none'
                }}></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section Header & Time Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-base font-bold text-text-main font-cinzel tracking-wide flex items-center gap-2">
            📜 Abitudini <span className="text-xs text-text-secondary font-sans font-normal ml-2">({viewedDate === todayStr ? 'Oggi' : viewedDate})</span>
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPomodoro(!showPomodoro)}
              className={`w-9 h-9 rounded-full glass-panel flex items-center justify-center text-lg active:scale-95 transition-transform ${
                pomodoro.status !== 'idle' ? 'border-red-500 animate-pulse' : ''
              }`}
              title="Timer Pomodoro"
            >
              🍅
            </button>
            <button
              onClick={() => onOpenModal('habit')}
              className="w-9 h-9 rounded-full bg-accent-gradient text-white flex items-center justify-center text-xl font-bold shadow-md active:scale-95 transition-transform"
            >
              +
            </button>
          </div>
        </div>

        {/* Time of Day Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'all', label: 'Tutte' },
            { id: 'morning', label: '🌅 Mattino' },
            { id: 'afternoon', label: '☀️ Pomeriggio' },
            { id: 'evening', label: '🌙 Sera' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setTimeFilter(f.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                timeFilter === f.id
                  ? 'bg-accent-primary text-white shadow-sm'
                  : 'bg-slate-900/30 text-text-secondary hover:text-text-main border border-border-color/30'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pomodoro Panel */}
      {showPomodoro && (
        <div className="glass-panel p-5 border border-red-500/10 bg-gradient-to-br from-red-500/5 to-transparent animate-scale-up">
          <div className="flex justify-between items-center border-b border-border-color pb-2 mb-4">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
              🍅 Timer Pomodoro
            </h3>
            <span className="text-[10px] text-text-secondary bg-slate-950/30 px-2 py-0.5 rounded-full">
              Sessioni completate: {pomodoro.sessionsToday || 0}
            </span>
          </div>

          <div className="text-center space-y-4">
            {/* Clock */}
            <div className="text-5xl font-bold font-orbitron tracking-wider text-red-500 filter drop-shadow">
              {formatTime(pomoSecs)}
            </div>

            {/* Target stat selection */}
            {pomodoro.status === 'idle' ? (
              <div className="max-w-xs mx-auto space-y-1.5 text-left">
                <label className="text-[10px] uppercase font-bold text-text-secondary">Allena Abilità</label>
                <select
                  value={pomodoro.targetStatId}
                  onChange={(e) => setPomodoro(prev => ({ ...prev, targetStatId: e.target.value }))}
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-xs text-text-main focus:outline-none"
                >
                  {stats.filter(s => s.visible).map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="text-xs text-text-secondary">
                Allenando:{' '}
                <span className="font-bold text-accent-primary">
                  {stats.find(s => s.id === pomodoro.targetStatId)?.icon}{' '}
                  {stats.find(s => s.id === pomodoro.targetStatId)?.name}
                </span>
              </div>
            )}

            {/* Controls */}
            <div className="flex justify-center gap-3 pt-2">
              {pomodoro.status === 'idle' && (
                <button
                  onClick={startPomodoro}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-6 py-2 rounded-full shadow-md active:scale-95 transition-transform"
                >
                  Avvia Sessione
                </button>
              )}
              {pomodoro.status === 'running' && (
                <button
                  onClick={pausePomodoro}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-6 py-2 rounded-full shadow-md active:scale-95 transition-transform"
                >
                  Pausa
                </button>
              )}
              {pomodoro.status === 'paused' && (
                <>
                  <button
                    onClick={resumePomodoro}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold text-xs px-5 py-2 rounded-full shadow-md active:scale-95 transition-transform"
                  >
                    Riprendi
                  </button>
                  <button
                    onClick={stopPomodoro}
                    className="bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2 rounded-full shadow-md active:scale-95 transition-transform"
                  >
                    Annulla
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Habits List */}
      <div className="space-y-3">
        {habitsToShow.length === 0 ? (
          <div className="glass-panel p-8 text-center text-xs text-text-secondary italic">
            Nessuna abitudine per questa data. Clicca "+" per crearne una!
          </div>
        ) : (
          habitsToShow.map((h) => {
            const isCompleted = h.completed;
            const primaryStat = stats.find(s => s.id === h.primaryTarget);
            const secondaryStat = stats.find(s => s.id === h.secondaryTarget);

            return (
              <SwipeableCard
                key={h.id}
                onSwipeRight={() => viewedDate === todayStr && onToggleHabit(h.id, viewedDate)}
                onSwipeLeft={() => onEditHabit(h)}
                disabled={viewedDate !== todayStr}
              >
                {/* Individual Habit Card Frame */}
                <div
                  className={`p-4 rounded-2xl border transition-all duration-300 space-y-2.5 ${
                    isCompleted
                      ? 'border-green-500/40 bg-green-500/10 opacity-75'
                      : 'border-border-color bg-slate-950/30 hover:border-accent-primary/50 hover:bg-slate-950/50 shadow-md'
                  }`}
                >
                  {/* Row 1: Checkbox + Name + Edit/Delete */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Circle Checkbox Button */}
                      <button
                        onClick={() => onToggleHabit(h.id, viewedDate)}
                        disabled={viewedDate !== todayStr}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isCompleted
                            ? 'border-green-500 bg-green-500 text-white shadow-sm'
                            : viewedDate === todayStr
                            ? 'border-border-color hover:border-accent-primary bg-slate-900/40'
                            : 'border-border-color cursor-not-allowed opacity-40 bg-slate-900/20'
                        }`}
                      >
                        {isCompleted && <span className="text-[11px] font-bold">✓</span>}
                      </button>

                      {/* Emoji & Name */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl flex-shrink-0">{h.emoji || '📜'}</span>
                        <h4 className={`text-sm font-bold text-text-main truncate ${isCompleted ? 'line-through text-text-secondary' : ''}`}>
                          {h.name}
                        </h4>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => onEditHabit(h)}
                        className="w-7 h-7 rounded-lg bg-slate-900/40 hover:bg-slate-900/80 border border-border-color/40 flex items-center justify-center text-text-secondary hover:text-accent-primary text-xs transition-all"
                        title="Modifica"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onDeleteHabit(h.id)}
                        className="w-7 h-7 rounded-lg bg-slate-900/40 hover:bg-red-500/20 border border-border-color/40 flex items-center justify-center text-text-secondary hover:text-red-400 text-xs transition-all"
                        title="Elimina"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Badges (Streak + Difficulty Stars + Primary Stat + Secondary Stat) */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border-color/20 flex-wrap text-[10px]">
                    {/* Streak Flame Badge */}
                    {h.streak > 0 && (
                      <span className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        🔥 {h.streak} gg
                      </span>
                    )}

                    {/* Difficulty Stars */}
                    <span className="bg-slate-900/40 border border-border-color/30 px-2 py-0.5 rounded-full flex items-center gap-0.5 text-amber-400 font-bold">
                      {'★'.repeat(h.difficulty)}
                      <span className="text-slate-600">{'★'.repeat(5 - h.difficulty)}</span>
                    </span>

                    {/* Primary Stat Badge */}
                    {primaryStat && (
                      <span className="bg-slate-900/50 border border-border-color/40 px-2 py-0.5 rounded-full text-text-secondary font-medium flex items-center gap-1">
                        <span>{primaryStat.icon}</span>
                        <span>{primaryStat.name}</span>
                      </span>
                    )}

                    {/* Secondary Stat Badge (if present) */}
                    {secondaryStat && (
                      <span className="bg-slate-900/50 border border-border-color/40 px-2 py-0.5 rounded-full text-text-secondary font-medium flex items-center gap-1">
                        <span>{secondaryStat.icon}</span>
                        <span>{secondaryStat.name}</span>
                      </span>
                    )}
                  </div>
                </div>
              </SwipeableCard>
            );
          })
        )}
      </div>
    </div>
  );
}
