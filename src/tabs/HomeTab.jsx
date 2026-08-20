import React, { useState, useEffect, useRef } from 'react';
import { getXpForLevel, getGameDate } from '../utils/helpers';

const SLOT_CATEGORY_INFO = [
  { type: 'action', title: 'Azione', emoji: '🎯', color: '#ef4444' },
  { type: 'bonus', title: 'Azione Bonus', emoji: '⚡', color: '#f59e0b' },
  { type: 'movement', title: 'Movimento', emoji: '🚶', color: '#0ea5e9' },
  { type: 'reaction', title: 'Reazione', emoji: '🛡️', color: '#a855f7' }
];

export default function HomeTab({
  stats,
  setStats,
  xpLog,
  player,
  health,
  setHealth,
  pomodoro,
  setPomodoro,
  onRewardXp,
  oneshots = [],
  onToggleOneshot,
  quests = [],
  onToggleSubquest,
  habits = [],
  onToggleHabit,
  dailyActions = [],
  onToggleDailyAction,
  completionLog = {},
  onOpenModal,
  onOpenPlanner,
  onOpenPomodoro,
  onOpenStatDetail,
  onOpenWorkoutsLog,
  onOpenMealsLog,
  settings = {}
}) {
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [cardMode, setCardMode] = useState('tasks'); // 'tasks' or 'pomodoro'
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [pomoSecs, setPomoSecs] = useState(0);
  const [showPomoWheelModal, setShowPomoWheelModal] = useState(false);

  const pressTimerRef = useRef(null);
  const healthPressTimerRef = useRef(null);
  const isHealthLongPressRef = useRef(false);
  const verticalWheelRef = useRef(null);

  const safePomodoro = pomodoro || { status: 'idle', workDuration: 25, xpPerSession: 25, sessionsToday: 0 };
  const todayStr = getGameDate(settings?.dayStartTime || 0);

  const POMO_MINUTE_PRESETS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 75, 90, 120];

  useEffect(() => {
    if (showPomoWheelModal && verticalWheelRef.current) {
      const activeMins = Math.floor(pomoSecs / 60) || safePomodoro.workDuration || 25;
      const idx = POMO_MINUTE_PRESETS.findIndex(m => m === activeMins);
      if (idx !== -1) {
        verticalWheelRef.current.scrollTop = idx * 40;
      }
    }
  }, [showPomoWheelModal]);

  const handlePomodoroFinish = () => {
    if (onRewardXp && safePomodoro) {
      onRewardXp(safePomodoro.targetStatId || 'int', safePomodoro.xpPerSession || 25, false, 'Timer Pomodoro');
    }
    if (settings?.soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (e) {}
    }

    alert(`🍅 Pomodoro completato! Hai guadagnato +${safePomodoro.xpPerSession || 25} XP!`);

    if (setPomodoro) {
      setPomodoro(prev => ({
        ...(prev || {}),
        status: 'idle',
        targetTime: null,
        remainingTime: null,
        sessionsToday: ((prev && prev.sessionsToday) || 0) + 1,
        lastSessionDate: todayStr
      }));
    }
  };

  const startPomodoro = () => {
    if (!setPomodoro) return;
    const target = new Date(Date.now() + (safePomodoro.workDuration || 25) * 60 * 1000).toISOString();
    setPomodoro(prev => ({
      ...(prev || {}),
      status: 'running',
      targetTime: target,
      remainingTime: null
    }));
  };

  const pausePomodoro = () => {
    if (!setPomodoro) return;
    setPomodoro(prev => ({
      ...(prev || {}),
      status: 'paused',
      remainingTime: pomoSecs
    }));
  };

  const resetPomodoro = () => {
    if (!setPomodoro) return;
    setPomodoro(prev => ({
      ...(prev || {}),
      status: 'idle',
      targetTime: null,
      remainingTime: null
    }));
  };

  const formatPomoTime = (seconds) => {
    const numSecs = Number(seconds) || 0;
    const mins = Math.floor(numSecs / 60);
    const secs = numSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Pomodoro Countdown Timer Tick Effect
  useEffect(() => {
    let interval = null;
    if (safePomodoro.status === 'running' && safePomodoro.targetTime) {
      const target = new Date(safePomodoro.targetTime).getTime();
      if (!isNaN(target) && target > 0) {
        const checkTimer = () => {
          const now = Date.now();
          const diff = Math.max(0, Math.ceil((target - now) / 1000));
          setPomoSecs(diff);

          if (diff <= 0) {
            if (interval) clearInterval(interval);
            handlePomodoroFinish();
          }
        };

        checkTimer();
        interval = setInterval(checkTimer, 1000);
      }
    } else if (safePomodoro.status === 'paused') {
      setPomoSecs(safePomodoro.remainingTime || 0);
    } else {
      setPomoSecs((safePomodoro.workDuration || 25) * 60);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [safePomodoro.status, safePomodoro.targetTime, safePomodoro.workDuration]);

  const handleHealthPressStart = (key) => {
    isHealthLongPressRef.current = false;
    if (healthPressTimerRef.current) clearTimeout(healthPressTimerRef.current);

    healthPressTimerRef.current = setTimeout(() => {
      isHealthLongPressRef.current = true;
      if (key === 'calories') {
        if (onOpenWorkoutsLog) onOpenWorkoutsLog();
      } else if (key === 'consumed') {
        if (onOpenMealsLog) onOpenMealsLog();
      } else {
        setActiveTooltip(key);
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(35); } catch(e){}
      }
    }, 400);
  };

  const handleHealthPressEnd = (action) => {
    const wasLong = isHealthLongPressRef.current;
    if (healthPressTimerRef.current) {
      clearTimeout(healthPressTimerRef.current);
      healthPressTimerRef.current = null;
    }
    if (!wasLong && typeof action === 'function') {
      action();
    }
    setTimeout(() => {
      isHealthLongPressRef.current = false;
    }, 100);
  };

  const handleHealthPressCancel = () => {
    if (healthPressTimerRef.current) {
      clearTimeout(healthPressTimerRef.current);
      healthPressTimerRef.current = null;
    }
    isHealthLongPressRef.current = false;
  };

  // Quick-add handlers for health stats on Home Tab
  const handleAddWater = (amount = 1) => {
    if (!setHealth) return;
    setHealth(prev => ({
      ...prev,
      water: {
        ...prev.water,
        consumed: (Number(prev.water?.consumed) || 0) + amount
      }
    }));
    if (settings.soundEnabled) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } catch (e) {}
    }
  };

  const handleAddSteps = (amount = 1000) => {
    if (!setHealth) return;
    setHealth(prev => ({
      ...prev,
      steps: {
        ...prev.steps,
        current: (Number(prev.steps?.current) || 0) + amount
      }
    }));
    if (settings.soundEnabled) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(500, ctx.currentTime);
        osc.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } catch (e) {}
    }
  };

  const handleAddBurnedCalories = (amount = 100) => {
    if (!setHealth) return;
    setHealth(prev => ({
      ...prev,
      calories: {
        ...prev.calories,
        burned: (Number(prev.calories?.burned) || 0) + amount
      }
    }));
    if (settings.soundEnabled) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } catch (e) {}
    }
  };

  // Calculate rolling 30-day XP per stat
  const getRollingXpByStats = (days = 30) => {
    const now = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - days);

    const xpByStats = {};
    (xpLog || []).forEach(log => {
      const logDate = new Date(log.date);
      if (logDate >= cutoffDate && logDate <= now) {
        xpByStats[log.statId] = (xpByStats[log.statId] || 0) + log.amount;
      }
    });
    Object.keys(xpByStats).forEach(key => {
      xpByStats[key] = Math.max(0, xpByStats[key]);
    });
    return xpByStats;
  };

  const rollingXp = getRollingXpByStats(30);
  const visibleStats = stats.filter(s => s.visible);

  // Long press handler on radar chart card
  const handleTouchStart = () => {
    pressTimerRef.current = setTimeout(() => {
      setShowVisibilityModal(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
  };

  const toggleStatVisibility = (statId) => {
    setStats(prev => prev.map(s => (s.id === statId ? { ...s, visible: !s.visible } : s)));
  };

  // SVG Circular Radar Chart Calculations
  const renderRadarChart = () => {
    if (visibleStats.length === 0) {
      return (
        <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', padding: '36px 0' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎯</div>
          <div>Nessun attributo visibile.</div>
          <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '4px', cursor: 'pointer' }} onClick={() => setShowVisibilityModal(true)}>
            Tieni premuto qui per selezionare cosa mostrare
          </div>
        </div>
      );
    }

    const size = 360;
    const center = size / 2;
    const radius = 115;
    const N = visibleStats.length;

    const rollingData = visibleStats.map(s => rollingXp[s.id] || 0);
    const maxVal = Math.max(50, ...rollingData);

    const getCoordinates = (index, valueFactor) => {
      const angle = (index * 2 * Math.PI) / N - Math.PI / 2;
      const r = valueFactor * radius;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle)
      };
    };

    // 1. Concentric Circles instead of Sharp Polygon Hexagon
    const gridLevels = [0.25, 0.5, 0.75, 1.0];
    const gridCircles = gridLevels.map((level, idx) => (
      <circle
        key={`grid-circle-${idx}`}
        cx={center}
        cy={center}
        r={radius * level}
        fill="none"
        stroke="rgba(124, 58, 237, 0.22)"
        strokeWidth="1.5"
        strokeDasharray={level === 1.0 ? 'none' : '3,3'}
      />
    ));

    const axisLines = [];
    for (let i = 0; i < N; i++) {
      const endCoords = getCoordinates(i, 1.0);
      axisLines.push(
        <line
          key={`axis-${i}`}
          x1={center}
          y1={center}
          x2={endCoords.x}
          y2={endCoords.y}
          stroke="var(--glass-border)"
          strokeWidth="1.5"
          strokeDasharray="3,3"
        />
      );
    }

    const labelItems = visibleStats.map((s, i) => {
      const coords = getCoordinates(i, 1.22);
      return (
        <g key={`label-${s.id}`} style={{ cursor: 'pointer' }} onClick={() => onOpenStatDetail && onOpenStatDetail(s)} title={`${s.name}: ${rollingXp[s.id] || 0} XP`}>
          <text
            x={coords.x}
            y={coords.y + 9}
            textAnchor="middle"
            style={{ fontSize: '26px', userSelect: 'none' }}
          >
            {s.icon}
          </text>
        </g>
      );
    });

    const playerPoints = visibleStats.map((s, i) => {
      const val = rollingXp[s.id] || 0;
      const factor = val / maxVal;
      const coords = getCoordinates(i, factor);
      return `${coords.x},${coords.y}`;
    }).join(' ');

    const playerVertices = visibleStats.map((s, i) => {
      const val = rollingXp[s.id] || 0;
      const factor = val / maxVal;
      const coords = getCoordinates(i, factor);
      return (
        <circle
          key={`vertex-${s.id}`}
          cx={coords.x}
          cy={coords.y}
          r="5.5"
          fill="var(--accent-primary)"
          stroke="var(--bg-primary)"
          strokeWidth="2"
          style={{ cursor: 'pointer' }}
          onClick={() => onOpenStatDetail && onOpenStatDetail(s)}
        />
      );
    });

    return (
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: '100%', maxWidth: '340px', maxHeight: '310px', margin: '0 auto' }}>
        {gridCircles}
        {axisLines}
        {playerPoints && (
          <polygon
            points={playerPoints}
            fill="rgba(124, 58, 237, 0.28)"
            stroke="var(--accent-primary)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        )}
        {playerVertices}
        {labelItems}
      </svg>
    );
  };

  // Calculate actions planned via the Daily Planner for today (Oneshots + Campaign Subquests)
  const todayOneshots = (oneshots || [])
    .filter(o => !o.locked && o.fromDailyPlan && o.dailyPlanDate === todayStr)
    .map(o => ({
      id: o.id,
      name: o.name,
      emoji: o.emoji,
      completed: o.completed,
      slotType: o.slotType,
      isSubquest: false,
      oneshotId: o.id
    }));

  const todaySubquests = [];
  (quests || []).forEach(q => {
    (q.subquests || []).forEach(sq => {
      if (sq.fromDailyPlan && sq.dailyPlanDate === todayStr) {
        todaySubquests.push({
          id: `sq-${q.id}-${sq.id}`,
          questId: q.id,
          subquestId: sq.id,
          name: `${q.emoji || '🏆'} ${sq.name}`,
          completed: sq.completed,
          slotType: sq.slotType,
          isSubquest: true
        });
      }
    });
  });

  const todayActionsList = [...todayOneshots, ...todaySubquests];
  todayActionsList.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));

  const handleChartClick = (e) => {
    const target = e.target;
    if (!target) return;
    const tagName = (target.tagName || '').toLowerCase();
    const isStatClick = tagName === 'text' || tagName === 'circle' || (target.closest && target.closest('g'));
    if (!isStatClick) {
      setShowVisibilityModal(true);
    }
  };

  return (
    <section
      id="section-home"
      className="section active"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        height: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
        touchAction: 'none',
        overscrollBehavior: 'none',
        justifyContent: 'space-between'
      }}
    >
      {/* 1. Radar Chart Card (Enlarged to fill space) */}
      <div
        className="glass-panel"
        onPointerDown={handleTouchStart}
        onPointerUp={handleTouchEnd}
        onPointerCancel={handleTouchEnd}
        onClick={handleChartClick}
        style={{
          padding: '8px 12px',
          flex: '1.4',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          userSelect: 'none',
          cursor: 'pointer'
        }}
        title="Tieni premuto o tocca per gestire visibilità e aggiungere attributi"
      >
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          {renderRadarChart()}
        </div>
      </div>

      {/* 2. Tessera "Azioni del Giorno" (con Switch In-Place Pomodoro Timer) */}
      <div className="glass-panel" style={{ padding: '14px 16px', borderRadius: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>{cardMode === 'pomodoro' ? '🍅' : '⚔️'}</span>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', letterSpacing: '0.2px' }}>
              {cardMode === 'pomodoro' ? 'Timer Pomodoro' : 'Azioni del Giorno'}
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {/* Pomodoro Switch Button */}
            <button
              type="button"
              onClick={() => setCardMode(prev => prev === 'tasks' ? 'pomodoro' : 'tasks')}
              style={{
                padding: (safePomodoro.status === 'running' || safePomodoro.status === 'paused') ? '4px 10px' : '0',
                width: (safePomodoro.status === 'running' || safePomodoro.status === 'paused') ? 'auto' : '30px',
                height: '30px',
                borderRadius: '15px',
                background: cardMode === 'pomodoro' || safePomodoro.status === 'running'
                  ? 'rgba(239, 68, 68, 0.2)'
                  : 'var(--bg-secondary)',
                color: safePomodoro.status === 'running' ? '#ef4444' : 'var(--text-primary)',
                fontWeight: 'bold',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                boxShadow: safePomodoro.status === 'running' ? '0 0 10px rgba(239, 68, 68, 0.4)' : 'none',
                border: cardMode === 'pomodoro' ? '1px solid #ef4444' : '1px solid var(--glass-border)'
              }}
              title={cardMode === 'pomodoro' ? "Passa a Lista Task" : "Passa a Timer Pomodoro"}
            >
              <span>🍅</span>
              {safePomodoro.status === 'running' && (
                <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold' }}>
                  {formatPomoTime(pomoSecs)}
                </span>
              )}
              {safePomodoro.status === 'paused' && (
                <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 'bold' }}>
                  Pausa ({formatPomoTime(pomoSecs)})
                </span>
              )}
            </button>

            {/* Plus Button */}
            <button
              type="button"
              onClick={() => onOpenModal('oneshot')}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                border: 'none',
                background: 'var(--accent-gradient, linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%))',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)',
                transition: 'transform 0.2s ease'
              }}
              className="active:scale-95"
              title="Crea nuova abitudine, task o campagna"
            >
              +
            </button>
          </div>
        </div>

        {/* Content Container (Fixed Height 102px for Exact Dimension Matching) */}
        <div style={{ height: '102px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {cardMode === 'pomodoro' ? (
            /* IN-CARD POMODORO WORKSTATION VIEW */
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 0', boxSizing: 'border-box' }}>
              {/* 1. Top Row: Centered Large Minutes Countdown (Tap opens vertical swipe wheel modal) */}
              <div
                onClick={() => {
                  if (safePomodoro.status !== 'running') {
                    setShowPomoWheelModal(true);
                  }
                }}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '42px',
                  cursor: safePomodoro.status === 'running' ? 'default' : 'pointer'
                }}
                title={safePomodoro.status === 'running' ? '' : 'Tocca per imposta i minuti con la ruota'}
              >
                <span
                  style={{
                    fontSize: '36px',
                    fontWeight: '900',
                    fontFamily: 'monospace',
                    color: safePomodoro.status === 'running' ? '#ef4444' : 'var(--text-primary)',
                    lineHeight: 1,
                    letterSpacing: '1px'
                  }}
                >
                  {formatPomoTime(pomoSecs)}
                </span>
              </div>

              {/* 2. Bottom Row: Left (Stat Selector) & Right (Control Buttons) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
                {/* Left: Stat / Attribute Selector */}
                <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
                  <select
                    value={safePomodoro.targetStatId || 'int'}
                    onChange={(e) => {
                      if (setPomodoro) {
                        setPomodoro(prev => ({
                          ...(prev || {}),
                          targetStatId: e.target.value
                        }));
                      }
                    }}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      borderRadius: '8px',
                      padding: '6px 8px',
                      outline: 'none',
                      cursor: 'pointer',
                      width: '100%',
                      maxWidth: '150px'
                    }}
                  >
                    {(stats || []).filter(s => s.visible !== false).map(s => (
                      <option key={s.id} value={s.id} style={{ background: 'var(--bg-card)' }}>
                        {s.icon || '⭐'} {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Right: Action Buttons */}
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {safePomodoro.status === 'idle' && (
                    <button
                      type="button"
                      onClick={startPomodoro}
                      style={{ padding: '7px 16px', borderRadius: '10px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)' }}
                    >
                      ▶️ Avvia
                    </button>
                  )}
                  {safePomodoro.status === 'running' && (
                    <>
                      <button
                        type="button"
                        onClick={pausePomodoro}
                        style={{ padding: '7px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}
                      >
                        ⏸️ Pausa
                      </button>
                      <button
                        type="button"
                        onClick={resetPomodoro}
                        style={{ padding: '7px 10px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}
                      >
                        ⏹️
                      </button>
                    </>
                  )}
                  {safePomodoro.status === 'paused' && (
                    <>
                      <button
                        type="button"
                        onClick={startPomodoro}
                        style={{ padding: '7px 14px', borderRadius: '10px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}
                      >
                        ▶️ Riprendi
                      </button>
                      <button
                        type="button"
                        onClick={resetPomodoro}
                        style={{ padding: '7px 10px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}
                      >
                        ⏹️
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* STANDARD TASKS LIST VIEW */
            todayActionsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '14px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '24px', marginBottom: '4px', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))' }}>🎲</div>
                <button
                  onClick={onOpenPlanner}
                  className="btn-primary"
                  style={{ padding: '7px 16px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)' }}
                >
                  Pianifica la tua giornata
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', height: '100%' }}>
                {todayActionsList.map((action, index) => {
                  const isCompleted = !!action.completed;
                  const info = SLOT_CATEGORY_INFO.find(s => s.type === action.slotType) || SLOT_CATEGORY_INFO[index] || SLOT_CATEGORY_INFO[0];

                  return (
                    <div
                      key={action.id}
                      onClick={() => {
                        if (action.isSubquest) {
                          if (onToggleSubquest) onToggleSubquest(action.questId, action.subquestId);
                        } else if (onToggleOneshot) {
                          onToggleOneshot(action.oneshotId || action.id);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: isCompleted ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-secondary)',
                        border: isCompleted ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--glass-border)',
                        padding: '8px 10px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        opacity: isCompleted ? 0.65 : 1,
                        transition: 'all 0.2s ease',
                        boxSizing: 'border-box',
                        minWidth: 0,
                        boxShadow: isCompleted ? 'none' : '0 2px 6px rgba(0,0,0,0.03)'
                      }}
                    >
                      {/* Checkbox */}
                      <div
                        className={`card-checkbox ${isCompleted ? 'checked' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (action.isSubquest) {
                            if (onToggleSubquest) onToggleSubquest(action.questId, action.subquestId);
                          } else if (onToggleOneshot) {
                            onToggleOneshot(action.oneshotId || action.id);
                          }
                        }}
                        style={{ width: '18px', height: '18px', flexShrink: 0 }}
                      ></div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '11px' }}>{info.emoji}</span>
                          <span style={{ fontSize: '9px', fontWeight: 'bold', color: info.color, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {info.title}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: 'var(--text-primary)',
                          textDecoration: isCompleted ? 'line-through' : 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {action.name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>

      {/* 3. Sostentamento Summary */}
      {health && (
        <div className="glass-panel" style={{ padding: '10px 12px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              🍎 Sostentamento di oggi
            </h3>
            <span
              onPointerDown={() => handleHealthPressStart('consumed')}
              onPointerUp={() => handleHealthPressEnd(() => {})}
              onPointerCancel={handleHealthPressCancel}
              onContextMenu={(e) => e.preventDefault()}
              style={{
                fontSize: '11px',
                color: 'var(--accent-primary)',
                fontWeight: 'bold',
                cursor: 'pointer',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                touchAction: 'manipulation'
              }}
              title="Tieni premuto per Registro Pasti e Nutrizione"
            >
              {health.calories?.consumed || 0} / {health.calories?.goal || 2000} kcal
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', textAlign: 'center' }}>
            {/* 🔥 Calorie Bruciate */}
            <div
              onPointerDown={() => handleHealthPressStart('calories')}
              onPointerUp={() => handleHealthPressEnd(() => handleAddBurnedCalories(100))}
              onPointerCancel={handleHealthPressCancel}
              onContextMenu={(e) => e.preventDefault()}
              style={{
                background: 'var(--bg-secondary)',
                padding: '6px 4px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                cursor: 'pointer',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                touchAction: 'manipulation'
              }}
              title="Tocca per +100 kcal bruciate • Tieni premuto per Registro Allenamenti"
            >
              <div style={{ fontSize: '14px' }}>🔥</div>
              <div style={{ fontWeight: 'bold', fontSize: '11px', color: 'var(--text-primary)' }}>{health.calories?.burned || 0}</div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Bruciate</div>
            </div>

            {/* 💧 Acqua */}
            <div
              onPointerDown={() => handleHealthPressStart('water')}
              onPointerUp={() => handleHealthPressEnd(() => handleAddWater(1))}
              onPointerCancel={handleHealthPressCancel}
              onContextMenu={(e) => e.preventDefault()}
              style={{
                background: 'var(--bg-secondary)',
                padding: '6px 4px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                cursor: 'pointer',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                touchAction: 'manipulation'
              }}
            >
              <div style={{ fontSize: '14px' }}>💧</div>
              <div style={{ fontWeight: 'bold', fontSize: '11px', color: 'var(--accent-primary)' }}>{health.water?.consumed || 0} / {health.water?.goal || health.waterGoal || 8}</div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Bicchieri</div>
            </div>

            {/* 👟 Passi */}
            <div
              onPointerDown={() => handleHealthPressStart('steps')}
              onPointerUp={() => handleHealthPressEnd(() => handleAddSteps(1000))}
              onPointerCancel={handleHealthPressCancel}
              onContextMenu={(e) => e.preventDefault()}
              style={{
                background: 'var(--bg-secondary)',
                padding: '6px 4px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                cursor: 'pointer',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                touchAction: 'manipulation'
              }}
            >
              <div style={{ fontSize: '14px' }}>👟</div>
              <div style={{ fontWeight: 'bold', fontSize: '11px', color: 'var(--text-primary)' }}>{Number(health.steps?.current) || 0}</div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Passi</div>
            </div>
          </div>

          {/* Longpress Tooltip Popup (Floating foreground, 0px layout shift) */}
          {activeTooltip && (
            <>
              <div
                onClick={() => setActiveTooltip(null)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 9998,
                  background: 'transparent'
                }}
              />
              <div
                onClick={() => setActiveTooltip(null)}
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 8px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 9999,
                  padding: '8px 14px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
              >
                <span>
                  {activeTooltip === 'water' && '💧 Tap rapido: aggiunge +1 bicchiere (200ml)'}
                  {activeTooltip === 'steps' && '👟 Tap rapido: aggiunge +1000 passi'}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '8px' }}>✕</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Stat Visibility & Management Modal */}
      {showVisibilityModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99990, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={() => setShowVisibilityModal(false)}
        >
          <div
            style={{ width: '100%', maxWidth: '380px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '20px', boxShadow: '0 16px 48px rgba(0,0,0,0.4)', boxSizing: 'border-box' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '14px', textAlign: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                📊 Gestisci Visibilità Grafico
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                onClick={() => { setShowVisibilityModal(false); onOpenModal('attribute'); }}
                className="btn-primary"
                style={{ flex: 1, padding: '8px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
              >
                + Attributo
              </button>
              <button
                onClick={() => { setShowVisibilityModal(false); onOpenModal('ability'); }}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                + Abilità
              </button>
            </div>

            <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stats.map((s) => (
                <div
                  key={s.id}
                  onClick={() => toggleStatVisibility(s.id)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '10px', cursor: 'pointer', border: '1px solid var(--glass-border)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{s.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{s.type} • Liv. {s.level}</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={s.visible !== false}
                    onChange={() => {}}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowVisibilityModal(false)}
              className="btn-primary"
              style={{ width: '100%', marginTop: '16px', padding: '10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
            >
              Fatto ✓
            </button>
          </div>
        </div>
      )}
      {/* Ultra-compact Vertical Pomodoro Duration Wheel Modal */}
      {showPomoWheelModal && (
        <div
          className="modal-overlay active"
          onClick={() => setShowPomoWheelModal(false)}
          style={{ zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)' }}
        >
          <div
            className="modal-content glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'auto', minWidth: '180px', maxWidth: '220px', padding: '8px 12px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 12px 36px rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)' }}
          >
            {/* Vertical Swipe Wheel Area */}
            <div style={{ position: 'relative', height: '150px', margin: '0 auto', overflow: 'hidden' }}>
              {/* Highlight selection bar */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '4px',
                  right: '4px',
                  height: '40px',
                  transform: 'translateY(-50%)',
                  background: 'rgba(239, 68, 68, 0.18)',
                  border: '1.5px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '10px',
                  pointerEvents: 'none',
                  zIndex: 1
                }}
              />

              {/* Vertical Scroll Wheel */}
              <div
                ref={verticalWheelRef}
                style={{
                  height: '100%',
                  overflowY: 'auto',
                  scrollSnapType: 'y mandatory',
                  WebkitOverflowScrolling: 'touch',
                  paddingTop: '55px',
                  paddingBottom: '55px',
                  boxSizing: 'border-box',
                  scrollbarWidth: 'none',
                  maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)'
                }}
                className="no-scrollbar"
              >
                {POMO_MINUTE_PRESETS.map((m) => {
                  const activeMins = Math.floor(pomoSecs / 60) || safePomodoro.workDuration || 25;
                  const isSelected = activeMins === m;
                  return (
                    <div
                      key={m}
                      onClick={() => {
                        if (isSelected) {
                          setShowPomoWheelModal(false);
                        } else {
                          setPomoSecs(m * 60);
                          if (setPomodoro) {
                            setPomodoro(prev => ({
                              ...(prev || {}),
                              workDuration: m,
                              remainingTime: m * 60
                            }));
                          }
                          const idx = POMO_MINUTE_PRESETS.findIndex(item => item === m);
                          if (idx !== -1 && verticalWheelRef.current) {
                            verticalWheelRef.current.scrollTo({ top: idx * 40, behavior: 'smooth' });
                          }
                        }
                      }}
                      style={{
                        scrollSnapAlign: 'center',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: isSelected ? '800' : '500',
                        fontFamily: 'monospace',
                        color: isSelected ? '#ef4444' : 'var(--text-secondary)',
                        opacity: isSelected ? 1 : 0.4,
                        transition: 'color 0.15s ease, opacity 0.15s ease',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      {m} Minuti
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
