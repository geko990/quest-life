import React, { useState } from 'react';
import { CHALLENGE_TEMPLATES } from '../utils/constants';

export default function QuestsTab({
  quests,
  setQuests,
  onToggleSubquest,
  onOpenModal,
  onDeleteQuest,
  onEditQuest,
  stats,
  onRewardXp,
  onActivateChallenge
}) {
  const [showCatalog, setShowCatalog] = useState(false);
  const [expandedQuestId, setExpandedQuestId] = useState(null);

  // Toggle quest accordion
  const toggleQuestExpand = (questId) => {
    setExpandedQuestId(expandedQuestId === questId ? null : questId);
  };

  const activeQuests = quests.filter(q => !q.completed);
  const completedQuests = quests.filter(q => q.completed);

  const renderQuestCard = (q, isFinishedList = false) => {
    const totalSub = q.subquests?.length || 0;
    const completedSub = q.subquests?.filter(sq => sq.completed).length || 0;
    const progressPct = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;
    const primaryStat = stats.find(s => s.id === q.primaryTarget);
    const isExpanded = expandedQuestId === q.id;

    return (
      <div
        key={q.id}
        className={`glass-panel overflow-hidden border transition-all duration-300 ${
          isFinishedList
            ? 'opacity-60 border-green-500/20 bg-green-500/5'
            : isExpanded
            ? 'border-accent-primary shadow-lg ring-1 ring-accent-primary/20 scale-[1.01]'
            : 'border-border-color hover:border-accent-primary/50'
        }`}
      >
        {/* Header Section */}
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

            {/* Badges / Stats */}
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
            {!isFinishedList && (
              <div className="flex gap-2.5 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity">
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
            )}
            <span className="text-xs text-text-secondary">
              {isExpanded ? '▲' : '▼'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-slate-950/30">
          <div
            className={`h-full transition-all duration-300 ${
              isFinishedList ? 'bg-green-500' : 'bg-gradient-to-r from-accent-primary to-accent-secondary'
            }`}
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>

        {/* Expanded Content: Subtasks Checklist */}
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
  };

  return (
    <div className="space-y-6 pb-20 p-4">
      {/* Header */}
      <div className="flex justify-between items-center px-1">
        <h2 className="text-base font-bold text-text-main font-cinzel flex items-center gap-1.5">
          🏆 Campagne
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCatalog(!showCatalog)}
            className={`w-9 h-9 rounded-full glass-panel flex items-center justify-center text-lg active:scale-95 transition-transform ${
              showCatalog ? 'ring-2 ring-accent-primary/50 text-accent-primary' : ''
            }`}
            title="Catalogo Sfide Preset"
          >
            ⚔️
          </button>
          <button
            onClick={() => onOpenModal('quest')}
            className="w-9 h-9 rounded-full bg-accent-gradient text-white flex items-center justify-center text-xl font-bold shadow-md active:scale-95 transition-transform"
          >
            +
          </button>
        </div>
      </div>

      {/* Challenge Template Catalog View */}
      {showCatalog ? (
        <div className="space-y-4 animate-scale-up">
          <div className="flex justify-between items-center border-b border-border-color pb-2">
            <h3 className="text-xs font-bold text-accent-primary uppercase tracking-widest">
              ⚔️ Catalogo delle Sfide (Preset)
            </h3>
            <button
              onClick={() => setShowCatalog(false)}
              className="text-text-secondary hover:text-text-main text-xs font-bold"
            >
              Chiudi Catalogo
            </button>
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
                        setShowCatalog(false);
                      }}
                      className="bg-accent-primary hover:bg-accent-primary/80 text-white font-bold text-[10px] px-3.5 py-1.5 rounded transition-colors"
                    >
                      Attiva Sfida
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Regular Quests List */
        <div className="space-y-6">
          {/* Active Quests */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider pl-1">
              Campagne Attive
            </h3>
            {activeQuests.length === 0 ? (
              <div className="glass-panel p-8 text-center text-xs text-text-secondary italic">
                Nessuna campagna attiva. Scegli una dal catalogo ⚔️ o creane una nuova!
              </div>
            ) : (
              activeQuests.map(q => renderQuestCard(q, false))
            )}
          </div>

          {/* Completed Quests */}
          {completedQuests.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border-color/30">
              <h3 className="text-xs font-bold text-green-500 uppercase tracking-wider pl-1">
                Campagne Completate
              </h3>
              {completedQuests.map(q => renderQuestCard(q, true))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
