import React, { useState, useRef } from 'react';
import { getXpForLevel } from '../utils/helpers';

export default function HomeTab({
  stats,
  setStats,
  xpLog,
  player,
  health,
  pomodoro,
  dailyActions = [],
  onToggleDailyAction,
  onOpenModal,
  onOpenPlanner,
  onOpenPomodoro,
  onOpenStatDetail
}) {
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const pressTimerRef = useRef(null);

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

    const size = 340;
    const center = size / 2;
    const radius = 110;
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
      const coords = getCoordinates(i, 1.24);
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
          r="5"
          fill="var(--accent-primary)"
          stroke="var(--bg-primary)"
          strokeWidth="2"
          style={{ cursor: 'pointer' }}
          onClick={() => onOpenStatDetail && onOpenStatDetail(s)}
        />
      );
    });

    return (
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: '100%', maxWidth: '340px', maxHeight: '340px', margin: '0 auto' }}>
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

  // Default 4 D&D Actions of the Day
  const defaultActions = [
    { id: 'act_main', type: 'Azione', emoji: '⚔️', title: 'Azione Principale', desc: 'Task o obiettivo principale del giorno' },
    { id: 'act_bonus', type: 'Azione Bonus', emoji: '⚡', title: 'Azione Bonus', desc: 'Attività rapida o secondaria' },
    { id: 'act_move', type: 'Movimento', emoji: '🏃', title: 'Movimento', desc: 'Attività fisica o passi' },
    { id: 'act_react', type: 'Reazione', emoji: '🛡️', title: 'Reazione', desc: 'Gestione imprevisto o risposta' }
  ];

  return (
    <section id="section-home" className="section active">
      {/* 1. Circular Radar Chart Card with Long Press Gesture */}
      <div
        className="glass-panel"
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          padding: '16px',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          userSelect: 'none',
          cursor: 'pointer'
        }}
        title="Tieni premuto per gestire visibilità attributi"
      >
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
            📊 RADAR ABILITÀ (30GG)
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); setShowVisibilityModal(true); }}
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '4px 10px', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            ⚙️ Gestisci
          </button>
        </div>

        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          {renderRadarChart()}
        </div>

        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>
          💡 Tieni premuto sul grafico per mostrare/nascondere attributi o aggiungerne di nuovi
        </div>
      </div>

      {/* 2. Tessera "Azioni del Giorno" (Azione, Azione Bonus, Movimento, Reazione) */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>⚔️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                Azioni del Giorno
              </h3>
              <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-secondary)' }}>
                I tuoi 4 slot tattici quotidiani (si resettano a fine giornata)
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {defaultActions.map((action) => {
            const isCompleted = (dailyActions || []).includes(action.id);
            return (
              <div
                key={action.id}
                onClick={() => onToggleDailyAction && onToggleDailyAction(action.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'var(--bg-secondary)',
                  border: isCompleted ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  opacity: isCompleted ? 0.75 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Checkbox */}
                <div
                  className={`card-checkbox ${isCompleted ? 'checked' : ''}`}
                  style={{ width: '24px', height: '24px', flexShrink: 0 }}
                ></div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{action.emoji}</span>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                      {action.type}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', textDecoration: isCompleted ? 'line-through' : 'none' }}>
                    {action.title}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                    {action.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. D&D Daily Planner */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🎲</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                Pianificatore D&D
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>Pianifica le azioni di oggi per bonus XP</p>
            </div>
          </div>
          <button
            onClick={onOpenPlanner}
            className="btn-primary"
            style={{ padding: '6px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
          >
            🎲 Lancia D10
          </button>
        </div>
      </div>

      {/* 4. Sostentamento Summary */}
      {health && (
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              🍎 Sostentamento Oggi
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
              {health.calories?.consumed || 0} / {health.calories?.target || 2000} kcal
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: '10px' }}>
              <div style={{ fontSize: '18px' }}>🔥</div>
              <div style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--text-primary)' }}>{health.calories?.consumed || 0}</div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Calorie</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: '10px' }}>
              <div style={{ fontSize: '18px' }}>💧</div>
              <div style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--accent-primary)' }}>{health.water?.consumed || 0} / {health.water?.target || 8}</div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Bicchieri</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: '10px' }}>
              <div style={{ fontSize: '18px' }}>🚶</div>
              <div style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--text-primary)' }}>{health.steps?.current || 0}</div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Passi</div>
            </div>
          </div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                📊 Gestisci Visibilità Grafico
              </h3>
              <button
                onClick={() => setShowVisibilityModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                ✕
              </button>
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
