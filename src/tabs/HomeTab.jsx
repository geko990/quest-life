import React, { useState, useRef } from 'react';
import { getXpForLevel, getGameDate } from '../utils/helpers';

export default function HomeTab({
  stats,
  setStats,
  xpLog,
  player,
  health,
  setHealth,
  pomodoro,
  oneshots = [],
  onToggleOneshot,
  habits = [],
  onToggleHabit,
  dailyActions = [],
  onToggleDailyAction,
  onOpenModal,
  onOpenPlanner,
  onOpenPomodoro,
  onOpenStatDetail,
  settings = {}
}) {
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const pressTimerRef = useRef(null);
  const healthPressTimerRef = useRef(null);
  const isHealthLongPressRef = useRef(false);

  const handleHealthPressStart = (key) => {
    isHealthLongPressRef.current = false;
    if (healthPressTimerRef.current) clearTimeout(healthPressTimerRef.current);
    healthPressTimerRef.current = setTimeout(() => {
      isHealthLongPressRef.current = true;
      setActiveTooltip(key);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(35); } catch(e){}
      }
    }, 450);
  };

  const handleHealthPressEnd = (action) => {
    if (healthPressTimerRef.current) clearTimeout(healthPressTimerRef.current);
    if (!isHealthLongPressRef.current) {
      action();
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
        consumed: (prev.water?.consumed || 0) + amount
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
        current: (prev.steps?.current || 0) + amount
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

  const handleAddCalories = (amount = 100) => {
    if (!setHealth) return;
    setHealth(prev => ({
      ...prev,
      calories: {
        ...prev.calories,
        consumed: (prev.calories?.consumed || 0) + amount
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

  // ONLY calculate actions planned via the Daily Planner for today
  const todayStr = getGameDate(settings?.dayStartTime || 0);

  const todayActionsList = (oneshots || []).filter(
    o => !o.locked && o.fromDailyPlan && o.dailyPlanDate === todayStr
  );

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
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
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

      {/* 2. Tessera "Azioni del Giorno" (Griglia 2x2) */}
      <div className="glass-panel" style={{ padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '16px' }}>⚔️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                Azioni del Giorno
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={onOpenPlanner}
              className="btn-primary"
              style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
              title="Pianifica azioni con il dado D10"
            >
              🎲 Pianifica
            </button>
            <button
              onClick={() => onOpenModal('oneshot')}
              style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}
              title="Aggiungi nuova missione"
            >
              + Nuova
            </button>
          </div>
        </div>

        {todayActionsList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '12px 8px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>🎯</div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '2px' }}>
              Nessuna azione creata per oggi
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Definisci le 4 azioni quotidiane con il D10 per XP bonus!
            </div>
            <button
              onClick={onOpenPlanner}
              className="btn-primary"
              style={{ padding: '6px 14px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
            >
              🎲 Pianifica Azioni con D10
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {todayActionsList.map((action) => {
              const primaryStat = stats.find(s => s.id === action.primaryTarget);
              const isCompleted = !!action.completed;

              return (
                <div
                  key={action.id}
                  onClick={() => onToggleOneshot && onToggleOneshot(action.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'var(--bg-secondary)',
                    border: isCompleted ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    opacity: isCompleted ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                    minWidth: 0
                  }}
                >
                  {/* Checkbox */}
                  <div
                    className={`card-checkbox ${isCompleted ? 'checked' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleOneshot) onToggleOneshot(action.id);
                    }}
                    style={{ width: '18px', height: '18px', flexShrink: 0 }}
                  ></div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '11px' }}>{action.emoji || '🎯'}</span>
                      {primaryStat && (
                        <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--accent-primary)', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {primaryStat.name}
                        </span>
                      )}
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
        )}
      </div>

      {/* 3. Sostentamento Summary */}
      {health && (
        <div className="glass-panel" style={{ padding: '10px 12px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              🍎 Sostentamento Oggi
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
              {health.calories?.consumed || 0} / {health.calories?.target || 2000} kcal
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', textAlign: 'center' }}>
            {/* 🔥 Calorie */}
            <div
              onMouseDown={() => handleHealthPressStart('calories')}
              onMouseUp={() => handleHealthPressEnd(() => handleAddCalories(100))}
              onTouchStart={() => handleHealthPressStart('calories')}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleHealthPressEnd(() => handleAddCalories(100));
              }}
              style={{
                background: 'var(--bg-secondary)',
                padding: '6px 4px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                cursor: 'pointer',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            >
              <div style={{ fontSize: '14px' }}>🔥</div>
              <div style={{ fontWeight: 'bold', fontSize: '11px', color: 'var(--text-primary)' }}>{health.calories?.consumed || 0}</div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Calorie</div>
            </div>

            {/* 💧 Acqua */}
            <div
              onMouseDown={() => handleHealthPressStart('water')}
              onMouseUp={() => handleHealthPressEnd(() => handleAddWater(1))}
              onTouchStart={() => handleHealthPressStart('water')}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleHealthPressEnd(() => handleAddWater(1));
              }}
              style={{
                background: 'var(--bg-secondary)',
                padding: '6px 4px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                cursor: 'pointer',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            >
              <div style={{ fontSize: '14px' }}>💧</div>
              <div style={{ fontWeight: 'bold', fontSize: '11px', color: 'var(--accent-primary)' }}>{health.water?.consumed || 0} / {health.water?.target || 8}</div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Bicchieri</div>
            </div>

            {/* 🚶 Passi */}
            <div
              onMouseDown={() => handleHealthPressStart('steps')}
              onMouseUp={() => handleHealthPressEnd(() => handleAddSteps(1000))}
              onTouchStart={() => handleHealthPressStart('steps')}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleHealthPressEnd(() => handleAddSteps(1000));
              }}
              style={{
                background: 'var(--bg-secondary)',
                padding: '6px 4px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                cursor: 'pointer',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            >
              <div style={{ fontSize: '14px' }}>🚶</div>
              <div style={{ fontWeight: 'bold', fontSize: '11px', color: 'var(--text-primary)' }}>{health.steps?.current || 0}</div>
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
                  {activeTooltip === 'calories' && '🔥 Tap rapido: aggiunge +100 kcal consumate'}
                  {activeTooltip === 'water' && '💧 Tap rapido: aggiunge +1 bicchiere (200ml)'}
                  {activeTooltip === 'steps' && '🚶 Tap rapido: aggiunge +1000 passi'}
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
    </section>
  );
}
