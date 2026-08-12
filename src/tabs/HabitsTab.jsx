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
    onRewardXp(pomodoro.targetStatId, pomodoro.xpPerSession, false, 'Timer Pomodoro');
    if (settings.soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
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

  // Count completions in period
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

  // Helper: get visible habits for date
  const getHabitsForDate = (dateStr) => {
    return habits.filter(h => {
      if (h.locked) return false;

      if (h.createdAt) {
        const createdDate = h.createdAt.split('T')[0];
        if (createdDate > dateStr) return false;
      }

      return true;
    });
  };

  const isHabitCompletedOnDate = (habitId, dateStr) => {
    return completionLog[dateStr]?.habits?.includes(habitId) || false;
  };

  const getCompletionPercentageForDate = (dateStr) => {
    const visibleHabits = getHabitsForDate(dateStr);
    if (visibleHabits.length === 0) return 0;
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

  const visibleHabits = getHabitsForDate(viewedDate);
  const habitsToShow = visibleHabits
    .map(h => ({
      ...h,
      completed: isHabitCompletedOnDate(h.id, viewedDate)
    }))
    .sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return 0;
    });

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // XP calculation from stars/difficulty
  const calculateXp = (stars = 1) => (stars || 1) * 10;

  return (
    <section id="section-habits" className="section active">
      {/* Calendar Header (v3.3.0) */}
      <div className="calendar-container" id="calendarContainer">
        <div className="calendar-scroll" id="calendarScroll" ref={calendarScrollRef}>
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
                className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'active' : ''}`}
              >
                <div className="calendar-day-name">{dayNames[day.getDay()]}</div>
                <div className="calendar-day-number" style={{ position: 'relative' }}>
                  {/* SVG Circular Completion Ring */}
                  <svg
                    viewBox="0 0 44 44"
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      left: '-4px',
                      width: '44px',
                      height: '44px',
                      transform: 'rotate(-90deg)',
                      pointerEvents: 'none'
                    }}
                  >
                    <circle
                      cx="22"
                      cy="22"
                      r="19"
                      fill="none"
                      stroke="var(--glass-border)"
                      strokeWidth="2.5"
                      opacity="0.3"
                    />
                    {completionPct > 0 && (
                      <circle
                        cx="22"
                        cy="22"
                        r="19"
                        fill="none"
                        stroke={completionPct === 100 ? '#10b981' : 'var(--accent-primary)'}
                        strokeWidth="2.5"
                        strokeDasharray={2 * Math.PI * 19}
                        strokeDashoffset={2 * Math.PI * 19 * (1 - completionPct / 100)}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.3s ease' }}
                      />
                    )}
                  </svg>
                  <span style={{ position: 'relative', zIndex: 2 }}>{day.getDate()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Habits Wrapper (v3.3.0) */}
      <div className="habits-wrapper">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            📜 Abitudini <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>({viewedDate === todayStr ? 'Oggi' : viewedDate})</span>
          </h2>
          <div className="header-actions" style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              className="add-btn-circle"
              onClick={() => setShowPomodoro(!showPomodoro)}
              title="Timer Pomodoro"
            >
              🍅
            </button>
            <button
              className="add-btn-circle"
              onClick={() => onOpenModal('habit')}
            >
              +
            </button>
          </div>
        </div>

        {/* Pomodoro Panel (v3.3.0 style) */}
        {showPomodoro && (
          <div className="glass-panel" style={{ padding: '16px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', color: '#ef4444' }}>🍅 Timer Pomodoro</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Sessioni oggi: {pomodoro.sessionsToday || 0}
              </span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', fontWeight: 'bold', fontFamily: 'Orbitron, sans-serif', color: '#ef4444', marginBottom: '10px' }}>
                {formatTime(pomoSecs)}
              </div>

              {pomodoro.status === 'idle' ? (
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>Allena Abilità</label>
                  <select
                    value={pomodoro.targetStatId}
                    onChange={(e) => setPomodoro(prev => ({ ...prev, targetStatId: e.target.value }))}
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}
                  >
                    {stats.filter(s => s.visible).map(s => (
                      <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  Allenando: <b>{stats.find(s => s.id === pomodoro.targetStatId)?.icon} {stats.find(s => s.id === pomodoro.targetStatId)?.name}</b>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {pomodoro.status === 'idle' && (
                  <button onClick={startPomodoro} className="btn-primary" style={{ background: '#ef4444', padding: '6px 16px', borderRadius: '20px', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                    Avvia
                  </button>
                )}
                {pomodoro.status === 'running' && (
                  <button onClick={pausePomodoro} className="btn-primary" style={{ background: '#f59e0b', padding: '6px 16px', borderRadius: '20px', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                    Pausa
                  </button>
                )}
                {pomodoro.status === 'paused' && (
                  <>
                    <button onClick={resumePomodoro} className="btn-primary" style={{ background: '#22c55e', padding: '6px 16px', borderRadius: '20px', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                      Riprendi
                    </button>
                    <button onClick={stopPomodoro} style={{ background: 'var(--bg-secondary)', padding: '6px 16px', borderRadius: '20px', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}>
                      Annulla
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Habits List (v3.3.0 original card structure) */}
        <div className="habits-list" id="habitsList">
          {habitsToShow.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📜</div>
              <div className="empty-state-text">Nessuna abitudine</div>
              <div className="empty-state-hint">Clicca "+" per iniziare</div>
            </div>
          ) : (
            habitsToShow.map((h) => {
              const isCompleted = h.completed;
              const primaryStat = stats.find(s => s.id === (h.primaryStatId || h.primaryTarget));
              const secondaryStat = stats.find(s => s.id === (h.secondaryStatId || h.secondaryTarget));
              const starsCount = h.stars || h.difficulty || 1;

              return (
                <div
                  key={h.id}
                  className={`task-card ${h.locked ? 'locked' : ''} ${isCompleted ? 'completed' : ''}`}
                  data-type="habit"
                  data-id={h.id}
                >
                  <div className="swipe-content" onClick={() => onEditHabit(h)}>
                    {/* Checkbox (v3.3.0 card-checkbox) */}
                    <div
                      className={`card-checkbox ${isCompleted ? 'checked' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleHabit(h.id, viewedDate);
                      }}
                    ></div>

                    {/* Content (v3.3.0 card-content & card-meta) */}
                    <div className="card-content">
                      <div className={`card-title ${isCompleted ? 'line-through opacity-60' : ''}`}>
                        {h.emoji ? `${h.emoji} ` : ''}{h.name}
                      </div>
                      <div className="card-meta">
                        <span className="card-stars">{'⭐'.repeat(starsCount)}</span>
                        {h.streak > 0 && <span className="card-streak">🔥 {h.streak}</span>}
                        <span className="card-xp">+{calculateXp(starsCount)} XP</span>
                        {primaryStat && <span className="card-stat" title={primaryStat.name}>{primaryStat.icon}</span>}
                        {secondaryStat && <span className="card-stat" style={{ opacity: 0.6 }} title={secondaryStat.name}>{secondaryStat.icon}</span>}
                      </div>
                    </div>

                    <div className="drag-handle" title="Trascina per riordinare">⋮⋮</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
