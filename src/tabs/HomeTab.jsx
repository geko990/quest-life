import React, { useState } from 'react';
import { getXpForLevel } from '../utils/helpers';

export default function HomeTab({
  stats,
  xpLog,
  player,
  health,
  pomodoro,
  onOpenModal,
  onDeleteStat,
  onEditStat,
  onOpenPlanner,
  onOpenPomodoro,
  onOpenStatDetail
}) {
  const [expanded, setExpanded] = useState({ attributes: true, abilities: true });

  const toggleSection = (section) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Calculate rolling 30-day XP per stat
  const getRollingXpByStats = (days = 30) => {
    const now = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - days);

    const xpByStats = {};
    xpLog.forEach(log => {
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

  // SVG Radar Chart Calculations
  const renderRadarChart = () => {
    if (visibleStats.length === 0) {
      return (
        <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', padding: '24px 0' }}>
          Rendi visibile almeno un attributo per generare il grafico.
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

    const gridLevels = [0.25, 0.5, 0.75, 1.0];
    const gridPaths = gridLevels.map(level => {
      const points = [];
      for (let i = 0; i < N; i++) {
        const coords = getCoordinates(i, level);
        points.push(`${coords.x},${coords.y}`);
      }
      return points.join(' ');
    });

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
            style={{ fontSize: '28px', userSelect: 'none' }}
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
        {gridPaths.map((path, idx) => (
          <polygon
            key={`grid-${idx}`}
            points={path}
            fill="none"
            stroke="var(--glass-border)"
            strokeWidth="1"
          />
        ))}
        {axisLines}
        {playerPoints && (
          <polygon
            points={playerPoints}
            fill="rgba(124, 58, 237, 0.25)"
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

  const attributes = stats.filter(s => s.type === 'attribute');
  const abilities = stats.filter(s => s.type === 'ability');

  const renderCard = (stat) => {
    const xpForNext = getXpForLevel(stat.level + 1);
    const xpProgress = Math.min(100, (stat.xp / xpForNext) * 100);

    return (
      <div
        key={stat.id}
        onClick={() => onOpenStatDetail && onOpenStatDetail(stat)}
        className="glass-panel"
        style={{
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '60px',
          cursor: 'pointer',
          opacity: !stat.visible ? 0.4 : 1
        }}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '20px' }}>{stat.icon}</span>
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--accent-primary)', padding: '2px 6px', background: 'rgba(124, 58, 237, 0.15)', borderRadius: '4px' }}>
              Lvl {stat.level}
            </span>
          </div>
          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }} title={stat.name}>{stat.name}</h4>
        </div>

        <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
            <span>{stat.xp}/{xpForNext} XP</span>
            <span style={{ fontWeight: 'bold' }}>{Math.round(xpProgress)}%</span>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{ height: '100%', width: `${xpProgress}%`, background: 'var(--accent-gradient, #7c3aed)', transition: 'width 0.3s' }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  const recentXpLogs = (xpLog || []).slice(-5).reverse();

  return (
    <section id="section-home" className="section active" style={{ paddingBottom: '90px' }}>
      {/* 1. Radar Chart (FIRST THING TO SEE - 1:1 aspect ratio) */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContents: 'center' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          {renderRadarChart()}
        </div>
      </div>

      {/* 2. Section: Attributi */}
      <div className="glass-panel" style={{ overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3
            onClick={() => toggleSection('attributes')}
            style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            ⚔️ Attributi
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => onOpenModal('attribute')}
              className="add-btn-circle"
              style={{ width: '26px', height: '26px', fontSize: '14px' }}
              title="Aggiungi Attributo"
            >
              +
            </button>
            <span
              onClick={() => toggleSection('attributes')}
              style={{ cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)', transform: expanded.attributes ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            >
              ▼
            </span>
          </div>
        </div>
        {expanded.attributes && (
          <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {attributes.map(renderCard)}
          </div>
        )}
      </div>

      {/* 3. Section: Abilità */}
      <div className="glass-panel" style={{ overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3
            onClick={() => toggleSection('abilities')}
            style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            ✨ Abilità
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => onOpenModal('ability')}
              className="add-btn-circle"
              style={{ width: '26px', height: '26px', fontSize: '14px' }}
              title="Aggiungi Abilità"
            >
              +
            </button>
            <span
              onClick={() => toggleSection('abilities')}
              style={{ cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)', transform: expanded.abilities ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            >
              ▼
            </span>
          </div>
        </div>
        {expanded.abilities && (
          <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {abilities.length === 0 ? (
              <div style={{ gridColumn: 'span 2', padding: '16px 0', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Nessuna abilità speciale creata. Clicca "+" per crearne una!
              </div>
            ) : (
              abilities.map(renderCard)
            )}
          </div>
        )}
      </div>

      {/* 4. D&D Daily Recap */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
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

      {/* 5. Sostentamento Summary */}
      {health && (
        <div className="glass-panel" style={{ padding: '16px', marginBottom: '16px' }}>
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

      {/* 6. Storico Imprese Recenti */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          📜 Storico Imprese Recenti
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {recentXpLogs.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', margin: 0 }}>
              Nessuna impresa registrata di recente. Completa abitudini o missioni per guadagnare XP!
            </p>
          ) : (
            recentXpLogs.map((log, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✨</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{log.reason || 'Attività completata'}</span>
                </div>
                <span style={{ fontWeight: 'bold', color: 'var(--accent-gold, #f59e0b)' }}>+{log.amount} XP</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
