import React, { useState } from 'react';
import SwipeableCard from '../components/SwipeableCard';
import { CHALLENGE_TEMPLATES } from '../utils/constants';

export default function MissionsTab({
  oneshots,
  onToggleOneshot,
  onDeleteOneshot,
  onEditOneshot,
  quests,
  onToggleSubquest,
  onDeleteQuest,
  onEditQuest,
  onOpenModal,
  stats,
  settings,
  onOpenDailyPlanner,
  onActivateChallenge
}) {
  const [subTab, setSubTab] = useState('oneshot'); // 'oneshot' | 'quest' | 'catalog'
  const [showCompletedOneshots, setShowCompletedOneshots] = useState(false);
  const [expandedQuestId, setExpandedQuestId] = useState(null);

  const toggleQuestExpand = (questId) => {
    setExpandedQuestId(expandedQuestId === questId ? null : questId);
  };

  // Filtered oneshots
  const filteredOneshots = oneshots.filter((o) => {
    if (o.locked) return false;
    return showCompletedOneshots ? o.completed : !o.completed;
  });

  // Active & Completed quests
  const activeQuests = quests.filter(q => !q.completed);
  const completedQuests = quests.filter(q => q.completed);

  return (
    <div className="w-full space-y-4 pb-24 box-border">
      {/* Top Header */}
      <div className="flex justify-between items-center px-1">
        <h2 className="text-base font-bold text-text-main font-cinzel tracking-wide flex items-center gap-2">
          ⚔️ Registro Missioni
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
            onClick={() => onOpenModal(subTab === 'quest' ? 'quest' : 'oneshot')}
            className="w-9 h-9 rounded-full bg-accent-gradient text-white flex items-center justify-center text-xl font-bold shadow-md active:scale-95 transition-transform"
            title="Crea nuova missione"
          >
            +
          </button>
        </div>
      </div>

      {/* Main Sub-Tab Switcher Bar (3 Options) */}
      <div className="flex bg-slate-950/40 p-1 rounded-xl border border-border-color/40">
        <button
          onClick={() => setSubTab('oneshot')}
          className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
            subTab === 'oneshot'
              ? 'bg-accent-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-main'
          }`}
        >
          <span>💥</span>
          <span>Singole</span>
        </button>
        <button
          onClick={() => setSubTab('quest')}
          className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
            subTab === 'quest'
              ? 'bg-accent-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-main'
          }`}
        >
          <span>🏆</span>
          <span>Campagne</span>
        </button>
        <button
          onClick={() => setSubTab('catalog')}
          className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
            subTab === 'catalog'
              ? 'bg-accent-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-main'
          }`}
        >
          <span>⚔️</span>
          <span>Sfide</span>
        </button>
      </div>

      {/* SUB-TAB 1: MISSIONI SINGOLE (ONE-SHOTS) */}
      {subTab === 'oneshot' && (
        <div className="space-y-4 animate-fade-in">
          {/* Active / Completed Filter */}
          <div className="flex justify-start bg-slate-950/20 p-1 rounded-lg border border-border-color/30 max-w-[200px]">
            <button
              onClick={() => setShowCompletedOneshots(false)}
              className={`flex-1 text-center py-1 px-2.5 rounded text-[11px] font-semibold transition-all ${
                !showCompletedOneshots
                  ? 'bg-accent-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-main'
              }`}
            >
              Attive
            </button>
            <button
              onClick={() => setShowCompletedOneshots(true)}
              className={`flex-1 text-center py-1 px-2.5 rounded text-[11px] font-semibold transition-all ${
                showCompletedOneshots
                  ? 'bg-accent-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-main'
              }`}
            >
              Finito
            </button>
          </div>

          {/* Oneshot Cards List */}
          <div className="space-y-3">
            {filteredOneshots.length === 0 ? (
              <div className="glass-panel p-8 text-center text-xs text-text-secondary italic">
                Nessuna missione singola {showCompletedOneshots ? 'completata' : 'attiva'}. Clicca "+" per crearne una!
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
                      className={`p-3.5 min-h-[72px] flex items-center justify-between transition-all duration-300 border-l-4 cursor-pointer ${
                        o.completed
                          ? 'border-l-green-500 opacity-60 bg-green-500/5'
                          : 'border-l-accent-primary hover:border-l-accent-secondary'
                      }`}
                    >
                      {/* Checkbox & Details */}
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleOneshot(o.id);
                          }}
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            o.completed
                              ? 'border-green-500 bg-green-500 text-white shadow-sm'
                              : 'border-border-color hover:border-accent-primary bg-slate-950/20'
                          }`}
                          title={o.completed ? "Segna come incompleta" : "Segna come completata"}
                        >
                          {o.completed && <span className="text-xs font-extrabold">✓</span>}
                        </button>

                        <div onClick={() => onEditOneshot(o)} className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg flex-shrink-0 filter drop-shadow-sm">{o.emoji || '💥'}</span>
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
                    </div>
                  </SwipeableCard>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CAMPAGNE (QUESTS) */}
      {subTab === 'quest' && (
        <div className="space-y-6 animate-fade-in">
          {/* Active Quests */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider pl-1">
              Campagne Attive
            </h3>
            {activeQuests.length === 0 ? (
              <div className="glass-panel p-8 text-center text-xs text-text-secondary italic">
                Nessuna campagna attiva. Scegli una dal catalogo sfide ⚔️ o creane una nuova!
              </div>
            ) : (
              activeQuests.map((q) => {
                const totalSub = q.subquests?.length || 0;
                const completedSub = q.subquests?.filter(sq => sq.completed).length || 0;
                const progressPct = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;
                const primaryStat = stats.find(s => s.id === q.primaryTarget);
                const isExpanded = expandedQuestId === q.id;

                return (
                  <div
                    key={q.id}
                    className={`glass-panel overflow-hidden border transition-all duration-300 ${
                      isExpanded
                        ? 'border-accent-primary shadow-lg ring-1 ring-accent-primary/20 scale-[1.01]'
                        : 'border-border-color hover:border-accent-primary/50'
                    }`}
                  >
                    {/* Quest Header */}
                    <div
                      onClick={() => toggleQuestExpand(q.id)}
                      className="p-4 cursor-pointer flex justify-between items-start gap-3 select-none"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xl flex-shrink-0">{q.emoji || '🏆'}</span>
                          <h4 className="text-xs font-bold text-text-main truncate">{q.name}</h4>
                        </div>
                        {q.description && (
                          <p className="text-[10px] text-text-secondary mt-1 line-clamp-1">{q.description}</p>
                        )}

                        <div className="flex items-center gap-2 mt-2 text-[10px] text-text-secondary flex-wrap">
                          {primaryStat && (
                            <span className="bg-slate-950/30 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              {primaryStat.icon} {primaryStat.name}
                            </span>
                          )}
                          <span className="text-yellow-400">
                            {'★'.repeat(q.difficulty)}
                            <span className="text-slate-600">{'★'.repeat(5 - q.difficulty)}</span>
                          </span>
                          <span className="font-semibold text-text-secondary/70">
                            {completedSub}/{totalSub} obiettivi
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditQuest(q);
                            }}
                            className="text-text-secondary hover:text-accent-primary text-xs"
                            title="Modifica"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteQuest(q.id);
                            }}
                            className="text-text-secondary hover:text-red-500 text-xs"
                            title="Elimina"
                          >
                            🗑️
                          </button>
                        </div>
                        <span className="text-xs text-text-secondary">
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-slate-950/30">
                      <div
                        className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>

                    {/* Subtasks Accordion */}
                    {isExpanded && (
                      <div className="bg-slate-950/15 border-t border-border-color/20 p-4 space-y-2.5 animate-slide-down">
                        {totalSub === 0 ? (
                          <p className="text-[11px] text-text-secondary italic text-center py-2">
                            Nessun sotto-obiettivo definito.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {q.subquests.map((sq) => (
                              <div
                                key={sq.id}
                                onClick={() => onToggleSubquest(q.id, sq.id)}
                                className="flex items-center gap-3 p-2 bg-bg-main/50 hover:bg-bg-main border border-border-color/30 rounded-lg cursor-pointer transition-colors select-none"
                              >
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center text-[9px] flex-shrink-0 font-bold transition-all ${
                                    sq.completed
                                      ? 'border-green-500 bg-green-500 text-white'
                                      : 'border-border-color bg-slate-950/10'
                                  }`}
                                >
                                  {sq.completed && '✓'}
                                </div>
                                <span
                                  className={`text-xs flex-1 truncate ${
                                    sq.completed ? 'line-through text-text-secondary' : 'text-text-main'
                                  }`}
                                >
                                  {sq.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Completed Quests */}
          {completedQuests.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border-color/30">
              <h3 className="text-xs font-bold text-green-500 uppercase tracking-wider pl-1">
                Campagne Completate
              </h3>
              {completedQuests.map((q) => (
                <div key={q.id} className="glass-panel p-4 opacity-60 border-green-500/20 bg-green-500/5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏆</span>
                    <div>
                      <h4 className="text-xs font-bold text-text-main line-through">{q.name}</h4>
                      <span className="text-[10px] text-green-400 font-semibold">Completata!</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: CATALOGO SFIDE PRESET */}
      {subTab === 'catalog' && (
        <div className="space-y-4 animate-scale-up">
          <div className="border-b border-border-color pb-2">
            <h3 className="text-xs font-bold text-accent-primary uppercase tracking-widest">
              ⚔️ Catalogo Sfide Preimpostate
            </h3>
            <p className="text-[10px] text-text-secondary mt-0.5">Scegli una sfida da 30 giorni o 7 giorni per iniziare subito</p>
          </div>

          <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
            {CHALLENGE_TEMPLATES.map((tmpl) => {
              const primaryStat = stats.find(s => s.id === tmpl.primaryStatId);
              return (
                <div
                  key={tmpl.id}
                  className="glass-panel p-4 flex flex-col justify-between border-l-4 hover:scale-[1.01] transition-transform"
                  style={{ borderLeftColor: tmpl.color || 'var(--accent-primary)' }}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{tmpl.icon}</span>
                        <h4 className="text-xs font-bold text-text-main">{tmpl.name}</h4>
                      </div>
                      <span className="text-[10px] text-text-secondary bg-slate-950/30 px-2 py-0.5 rounded-full">
                        {tmpl.duration} Giorni
                      </span>
                    </div>
                    <p className="text-[10px] text-text-secondary mt-1.5 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-border-color/20">
                    <div className="flex items-center gap-2 text-[10px] text-text-secondary">
                      {primaryStat && (
                        <span>
                          {primaryStat.icon} {primaryStat.name}
                        </span>
                      )}
                      <span className="text-yellow-400">{'★'.repeat(tmpl.stars || 3)}</span>
                    </div>
                    <button
                      onClick={() => {
                        onActivateChallenge(tmpl);
                        setSubTab('quest');
                      }}
                      className="bg-accent-primary hover:bg-accent-primary/80 text-white font-bold text-[10px] px-3.5 py-1.5 rounded transition-colors shadow-sm"
                    >
                      Attiva Sfida
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
