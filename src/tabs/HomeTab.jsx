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
    // Ensure no stat XP goes below 0
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
        <div className="text-center text-xs text-text-secondary py-6">
          Rendi visibile almeno un attributo per generare il grafico.
        </div>
      );
    }

    const size = 260;
    const center = size / 2;
    const radius = 80;
    const N = visibleStats.length;

    // Data points & Max calculation
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

    // Grid webs
    const gridLevels = [0.25, 0.5, 0.75, 1.0];
    const gridPaths = gridLevels.map(level => {
      const points = [];
      for (let i = 0; i < N; i++) {
        const coords = getCoordinates(i, level);
        points.push(`${coords.x},${coords.y}`);
      }
      return points.join(' ');
    });

    // Axis lines
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
          stroke="var(--border-color)"
          strokeWidth="1.5"
          strokeDasharray="3,3"
        />
      );
    }

    // Emojis labels position
    const labelItems = visibleStats.map((s, i) => {
      const coords = getCoordinates(i, 1.25);
      return (
        <g key={`label-${s.id}`} className="cursor-pointer" onClick={() => onOpenStatDetail && onOpenStatDetail(s)} title={`${s.name}: ${rollingXp[s.id] || 0} XP`}>
          <text
            x={coords.x}
            y={coords.y + 7}
            textAnchor="middle"
            className="text-2xl filter drop-shadow select-none hover:scale-125 transition-transform"
          >
            {s.icon}
          </text>
        </g>
      );
    });

    // Player XP Polygon
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
          r="4"
          className="fill-accent-primary stroke-bg-main cursor-pointer"
          strokeWidth="1.5"
          onClick={() => onOpenStatDetail && onOpenStatDetail(s)}
        />
      );
    });

    return (
      <svg width={size} height={size} className="mx-auto select-none drop-shadow-md">
        {gridPaths.map((path, idx) => (
          <polygon
            key={`grid-${idx}`}
            points={path}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth="1"
          />
        ))}
        {axisLines}
        {playerPoints && (
          <polygon
            points={playerPoints}
            className="fill-accent-primary/25 stroke-accent-primary"
            strokeWidth="2.5"
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
        className={`relative glass-panel p-4 flex flex-col justify-between min-h-[92px] group/card cursor-pointer hover:border-accent-primary/50 transition-all ${
          !stat.visible ? 'opacity-40 hover:opacity-75' : ''
        }`}
      >
        {/* Action Controls */}
        <div className="absolute right-3 top-3 flex gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 bg-bg-card/90 px-1.5 py-0.5 rounded-full border border-border-color shadow-sm z-10" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEditStat(stat)}
            className="text-[10px] text-text-secondary hover:text-accent-primary"
            title="Modifica"
          >
            ✏️
          </button>
          <button
            onClick={() => onDeleteStat(stat.id)}
            className="text-[10px] text-text-secondary hover:text-red-500"
            title="Elimina"
          >
            🗑️
          </button>
        </div>

        {/* Card Header */}
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{stat.icon}</span>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-text-main truncate" title={stat.description}>{stat.name}</h4>
            <span className="text-[10px] text-text-secondary line-clamp-1">{stat.description}</span>
          </div>
          <span className="text-[11px] font-bold text-accent-primary px-1.5 py-0.5 bg-accent-primary/10 rounded">
            LV{stat.level}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[9px] text-text-secondary mb-1">
            <span>XP: {stat.xp} / {xpForNext}</span>
            <span>{Math.round(xpProgress)}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-950/35 rounded-full overflow-hidden border border-border-color/30">
            <div
              className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all"
              style={{ width: `${xpProgress}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  // Recent XP Log items
  const recentXpLogs = (xpLog || []).slice(-5).reverse();

  return (
    <div className="space-y-5 pb-24 p-4 max-w-md mx-auto">
      {/* Tab Header */}
      <div className="flex justify-between items-center px-1">
        <h2 className="text-base font-bold text-text-main font-cinzel tracking-wide flex items-center gap-2">
          🛡️ Scheda Eroe
        </h2>
      </div>

      {/* 1. D&D Daily Recap & Quick Planner Card */}
      <div className="glass-panel p-4 border border-border-color relative overflow-hidden">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎲</span>
            <div>
              <h3 className="text-xs font-bold text-text-main uppercase tracking-wider font-cinzel">
                Pianificatore D&D
              </h3>
              <p className="text-[10px] text-text-secondary">Pianifica le azioni di oggi per bonus XP</p>
            </div>
          </div>
          <button
            onClick={onOpenPlanner}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95 flex items-center gap-1"
          >
            🎲 Lancia D10
          </button>
        </div>

        {/* Quick status preview */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-950/40 p-2 rounded-lg border border-border-color/40 flex items-center gap-2">
            <span>🎯</span>
            <span className="text-[11px] text-text-secondary truncate">Azione: Principale</span>
          </div>
          <div className="bg-slate-950/40 p-2 rounded-lg border border-border-color/40 flex items-center gap-2">
            <span>⚡</span>
            <span className="text-[11px] text-text-secondary truncate">Bonus: Secondaria</span>
          </div>
          <div className="bg-slate-950/40 p-2 rounded-lg border border-border-color/40 flex items-center gap-2">
            <span>🚶</span>
            <span className="text-[11px] text-text-secondary truncate">Movimento: 30m</span>
          </div>
          <div className="bg-slate-950/40 p-2 rounded-lg border border-border-color/40 flex items-center gap-2">
            <span>🛡️</span>
            <span className="text-[11px] text-text-secondary truncate">Reazione: Risposta</span>
          </div>
        </div>
      </div>

      {/* 2. Sostentamento & Health Summary Card */}
      {health && (
        <div className="glass-panel p-4 border border-border-color">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-text-main uppercase tracking-wider font-cinzel flex items-center gap-1.5">
              🍎 Sostentamento Oggi
            </h3>
            <span className="text-[10px] text-accent-primary font-bold">
              {health.calories?.consumed || 0} / {health.calories?.target || 2000} kcal
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-950/30 p-2 rounded-lg border border-border-color/30">
              <div className="text-lg">🔥</div>
              <div className="font-bold text-text-main text-xs">{health.calories?.consumed || 0}</div>
              <div className="text-[9px] text-text-secondary uppercase">Calorie</div>
            </div>
            <div className="bg-slate-950/30 p-2 rounded-lg border border-border-color/30">
              <div className="text-lg">💧</div>
              <div className="font-bold text-accent-primary text-xs">{health.water?.consumed || 0} / {health.water?.target || 8}</div>
              <div className="text-[9px] text-text-secondary uppercase">Bicchieri</div>
            </div>
            <div className="bg-slate-950/30 p-2 rounded-lg border border-border-color/30">
              <div className="text-lg">🚶</div>
              <div className="font-bold text-text-main text-xs">{health.steps?.current || 0}</div>
              <div className="text-[9px] text-text-secondary uppercase">Passi</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Radar Chart section */}
      <div className="glass-panel p-5 max-w-sm mx-auto text-center">
        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4 font-cinzel">
          Statistiche Ultimi 30 Giorni
        </h3>
        <div className="relative flex justify-center items-center h-[260px]">
          {renderRadarChart()}
        </div>
      </div>

      {/* 4. Storico Imprese Recenti */}
      <div className="glass-panel p-4 border border-border-color">
        <h3 className="text-xs font-bold text-text-main uppercase tracking-wider font-cinzel mb-3 flex items-center gap-1.5">
          📜 Storico Imprese Recenti
        </h3>
        <div className="space-y-2">
          {recentXpLogs.length === 0 ? (
            <p className="text-xs text-text-secondary italic text-center py-2">
              Nessuna impresa registrata di recente. Completa abitudini o missioni per guadagnare XP!
            </p>
          ) : (
            recentXpLogs.map((log, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-950/30 p-2 rounded-lg border border-border-color/30 text-xs">
                <div className="flex items-center gap-2">
                  <span>✨</span>
                  <span className="text-text-main font-medium">{log.reason || 'Attività completata'}</span>
                </div>
                <span className="font-bold text-amber-400">+{log.amount} XP</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 5. Attributes Accordion */}
      <div className="glass-panel overflow-hidden border border-border-color">
        <div className="px-4 py-3.5 bg-slate-950/20 border-b border-border-color/40 flex justify-between items-center">
          <h3
            onClick={() => toggleSection('attributes')}
            className="font-bold text-sm text-text-main flex items-center gap-1.5 cursor-pointer font-cinzel select-none"
          >
            ⚔️ Attributi
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenModal('attribute')}
              className="w-6 h-6 rounded-full bg-accent-primary/10 hover:bg-accent-primary text-accent-primary hover:text-white font-bold text-sm flex items-center justify-center transition-all"
            >
              +
            </button>
            <span
              onClick={() => toggleSection('attributes')}
              className="text-xs text-text-secondary cursor-pointer select-none transition-transform duration-200"
              style={{ transform: expanded.attributes ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              ▼
            </span>
          </div>
        </div>
        {expanded.attributes && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
            {attributes.map(renderCard)}
          </div>
        )}
      </div>

      {/* 6. Abilities Accordion */}
      <div className="glass-panel overflow-hidden border border-border-color">
        <div className="px-4 py-3.5 bg-slate-950/20 border-b border-border-color/40 flex justify-between items-center">
          <h3
            onClick={() => toggleSection('abilities')}
            className="font-bold text-sm text-text-main flex items-center gap-1.5 cursor-pointer font-cinzel select-none"
          >
            ✨ Abilità Speciali
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenModal('ability')}
              className="w-6 h-6 rounded-full bg-accent-primary/10 hover:bg-accent-primary text-accent-primary hover:text-white font-bold text-sm flex items-center justify-center transition-all"
            >
              +
            </button>
            <span
              onClick={() => toggleSection('abilities')}
              className="text-xs text-text-secondary cursor-pointer select-none transition-transform duration-200"
              style={{ transform: expanded.abilities ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              ▼
            </span>
          </div>
        </div>
        {expanded.abilities && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
            {abilities.length === 0 ? (
              <div className="col-span-full py-6 text-center text-xs text-text-secondary italic">
                Nessuna abilità speciale creata. Clicca "+" per crearne una!
              </div>
            ) : (
              abilities.map(renderCard)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
