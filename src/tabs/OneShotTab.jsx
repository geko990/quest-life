import React, { useState } from 'react';
import SwipeableCard from '../components/SwipeableCard';

export default function OneShotTab({
  oneshots,
  onToggleOneshot,
  onOpenModal,
  onDeleteOneshot,
  onEditOneshot,
  stats,
  settings,
  onOpenDailyPlanner
}) {
  const [showCompleted, setShowCompleted] = useState(false);

  const filteredOneshots = oneshots.filter((o) => {
    if (o.locked) return false;
    return showCompleted ? o.completed : !o.completed;
  });

  return (
    <div className="space-y-6 pb-20 p-4">
      {/* Tab Header */}
      <div className="flex justify-between items-center px-1">
        <h2 className="text-base font-bold text-text-main font-cinzel flex items-center gap-1.5">
          💥 Missioni Singole
        </h2>
        <div className="flex gap-2">
          {settings.showDiceButton !== false && (
            <button
              onClick={onOpenDailyPlanner}
              className="w-9 h-9 rounded-full glass-panel flex items-center justify-center text-lg active:scale-95 transition-transform"
              title="È il tuo turno! (Daily Planner)"
            >
              🎲
            </button>
          )}
          <button
            onClick={() => onOpenModal('oneshot')}
            className="w-9 h-9 rounded-full bg-accent-gradient text-white flex items-center justify-center text-xl font-bold shadow-md active:scale-95 transition-transform"
          >
            +
          </button>
        </div>
      </div>

      {/* Filter Switches */}
      <div className="flex justify-start bg-slate-950/20 p-1 rounded-lg border border-border-color/30 max-w-xs">
        <button
          onClick={() => setShowCompleted(false)}
          className={`flex-1 text-center py-1.5 px-3 rounded text-xs font-semibold transition-all ${
            !showCompleted
              ? 'bg-accent-primary text-white shadow-sm'
              : 'text-text-secondary hover:text-text-main'
          }`}
        >
          Attive
        </button>
        <button
          onClick={() => setShowCompleted(true)}
          className={`flex-1 text-center py-1.5 px-3 rounded text-xs font-semibold transition-all ${
            showCompleted
              ? 'bg-accent-primary text-white shadow-sm'
              : 'text-text-secondary hover:text-text-main'
          }`}
        >
          Completate
        </button>
      </div>

      {/* Oneshot List */}
      <div className="space-y-3">
        {filteredOneshots.length === 0 ? (
          <div className="glass-panel p-8 text-center text-xs text-text-secondary italic">
            Nessuna missione {showCompleted ? 'completata' : 'attiva'}. Clicca "+" per crearne una!
          </div>
        ) : (
          filteredOneshots.map((o) => {
            const primaryStat = stats.find(s => s.id === o.primaryTarget);
            return (
              <SwipeableCard
                key={o.id}
                onSwipeRight={() => onToggleOneshot(o.id)}
                onSwipeLeft={() => onEditOneshot(o)}
              >
                <div
                  className={`p-4 flex items-center justify-between group relative transition-all duration-300 border-l-4 ${
                    o.completed
                      ? 'border-l-green-500 opacity-60 bg-green-500/5'
                      : 'border-l-accent-primary hover:border-l-accent-secondary'
                  }`}
                >
                  {/* Left: Checkbox + Info */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-4">
                    <button
                      onClick={() => onToggleOneshot(o.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        o.completed
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-border-color hover:border-accent-primary bg-slate-950/20'
                      }`}
                    >
                      {o.completed && <span className="text-[11px] font-bold">✓</span>}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg flex-shrink-0">{o.emoji || '💥'}</span>
                        <h4 className={`text-xs font-bold text-text-main truncate ${o.completed ? 'line-through text-text-secondary' : ''}`}>
                          {o.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[10px] text-text-secondary">
                        {primaryStat && (
                          <span className="bg-slate-950/30 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            {primaryStat.icon} {primaryStat.name}
                          </span>
                        )}
                        <span className="text-yellow-400">
                          {'★'.repeat(o.difficulty)}
                          <span className="text-slate-600">{'★'.repeat(5 - o.difficulty)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => onEditOneshot(o)}
                      className="text-text-secondary hover:text-accent-primary text-xs"
                      title="Modifica"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDeleteOneshot(o.id)}
                      className="text-text-secondary hover:text-red-500 text-xs"
                      title="Elimina"
                    >
                      🗑️
                    </button>
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
