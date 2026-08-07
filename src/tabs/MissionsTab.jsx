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

  const filteredOneshots = oneshots.filter((o) => {
    if (o.locked) return false;
    return showCompletedOneshots ? o.completed : !o.completed;
  });

  const activeQuests = quests.filter(q => !q.completed);
  const completedQuests = quests.filter(q => q.completed);

  return (
    <section id="section-activities" className="section active">
      {/* Top Header */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', gap: '8px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>⚔️ Registro Missioni</h2>
        <div className="header-actions" style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          {settings.showDiceButton !== false && (
            <button
              className="add-btn-circle"
              onClick={onOpenDailyPlanner}
              title="È il tuo turno! (Daily Planner)"
            >
              🎲
            </button>
          )}
          <button
            className="add-btn-circle"
            onClick={() => onOpenModal(subTab === 'quest' ? 'quest' : 'oneshot')}
            title="Crea nuova missione"
          >
            +
          </button>
        </div>
      </div>

      {/* Main Sub-Tab Switcher Bar (v3.3.0 style) */}
      <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '12px', border: '1px solid var(--glass-border)', marginBottom: '16px', gap: '4px' }}>
        <button
          onClick={() => setSubTab('oneshot')}
          style={{ flex: 1, padding: '8px', border: 'none', background: subTab === 'oneshot' ? 'var(--accent-gradient, #7c3aed)' : 'transparent', color: subTab === 'oneshot' ? '#fff' : 'var(--text-secondary)', fontWeight: 'bold', fontSize: '12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          💥 Singole
        </button>
        <button
          onClick={() => setSubTab('quest')}
          style={{ flex: 1, padding: '8px', border: 'none', background: subTab === 'quest' ? 'var(--accent-gradient, #7c3aed)' : 'transparent', color: subTab === 'quest' ? '#fff' : 'var(--text-secondary)', fontWeight: 'bold', fontSize: '12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          🏆 Campagne
        </button>
        <button
          onClick={() => setSubTab('catalog')}
          style={{ flex: 1, padding: '8px', border: 'none', background: subTab === 'catalog' ? 'var(--accent-gradient, #7c3aed)' : 'transparent', color: subTab === 'catalog' ? '#fff' : 'var(--text-secondary)', fontWeight: 'bold', fontSize: '12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          ⚔️ Sfide
        </button>
      </div>

      {/* SUB-TAB 1: MISSIONI SINGOLE (ONE-SHOTS) */}
      {subTab === 'oneshot' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Active / Completed Filter */}
          <div style={{ display: 'flex', gap: '4px', maxWidth: '200px', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <button
              onClick={() => setShowCompletedOneshots(false)}
              style={{ flex: 1, padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer', background: !showCompletedOneshots ? 'var(--accent-primary)' : 'transparent', color: !showCompletedOneshots ? '#fff' : 'var(--text-secondary)' }}
            >
              Attive
            </button>
            <button
              onClick={() => setShowCompletedOneshots(true)}
              style={{ flex: 1, padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer', background: showCompletedOneshots ? 'var(--accent-primary)' : 'transparent', color: showCompletedOneshots ? '#fff' : 'var(--text-secondary)' }}
            >
              Finito
            </button>
          </div>

          {/* Oneshot Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredOneshots.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💥</div>
                <div className="empty-state-text">Nessuna missione {showCompletedOneshots ? 'completata' : 'attiva'}</div>
                <div className="empty-state-hint">Clicca "+" per crearne una</div>
              </div>
            ) : (
              filteredOneshots.map((o) => {
                const primaryStat = stats.find(s => s.id === o.primaryTarget);
                const starsCount = o.difficulty || 1;

                return (
                  <div
                    key={o.id}
                    className={`task-card ${o.completed ? 'completed' : ''}`}
                    data-type="oneshot"
                    data-id={o.id}
                  >
                    <div className="swipe-content" onClick={() => onEditOneshot(o)}>
                      <div
                        className={`card-checkbox ${o.completed ? 'checked' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleOneshot(o.id);
                        }}
                      ></div>
                      <div className="card-content">
                        <div className={`card-title ${o.completed ? 'line-through opacity-60' : ''}`}>
                          {o.emoji ? `${o.emoji} ` : ''}{o.name}
                        </div>
                        <div className="card-meta">
                          <span className="card-stars">{'⭐'.repeat(starsCount)}</span>
                          {primaryStat && <span className="card-stat" title={primaryStat.name}>{primaryStat.icon} {primaryStat.name}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CAMPAGNE (QUESTS) */}
      {subTab === 'quest' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Campagne Attive
            </h3>
            {activeQuests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🏆</div>
                <div className="empty-state-text">Nessuna campagna attiva</div>
                <div className="empty-state-hint">Attiva una sfida dal catalogo o creane una nuova</div>
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
                    className="glass-panel"
                    style={{ overflow: 'hidden', border: isExpanded ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)' }}
                  >
                    <div
                      onClick={() => toggleQuestExpand(q.id)}
                      style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '18px' }}>{q.emoji || '🏆'}</span>
                          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{q.name}</h4>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                          {primaryStat && <span>{primaryStat.icon} {primaryStat.name}</span>}
                          <span>{'⭐'.repeat(q.difficulty || 1)}</span>
                          <span>{completedSub}/{totalSub} sotto-obiettivi</span>
                        </div>
                      </div>

                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>

                    <div style={{ width: '100%', height: '4px', background: 'var(--bg-secondary)' }}>
                      <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--accent-gradient, #7c3aed)', transition: 'width 0.3s' }}></div>
                    </div>

                    {isExpanded && (
                      <div style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--glass-border)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {totalSub === 0 ? (
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', margin: 0 }}>
                            Nessun sotto-obiettivo definito.
                          </p>
                        ) : (
                          q.subquests.map((sq) => (
                            <div
                              key={sq.id}
                              onClick={() => onToggleSubquest(q.id, sq.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'var(--bg-primary)', borderRadius: '8px', cursor: 'pointer' }}
                            >
                              <div
                                style={{
                                  width: '16px',
                                  height: '16px',
                                  borderRadius: '4px',
                                  border: '1px solid var(--glass-border)',
                                  background: sq.completed ? 'var(--accent-primary)' : 'transparent',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '10px',
                                  fontWeight: 'bold'
                                }}
                              >
                                {sq.completed && '✓'}
                              </div>
                              <span style={{ fontSize: '12px', color: 'var(--text-primary)', textDecoration: sq.completed ? 'line-through' : 'none', opacity: sq.completed ? 0.6 : 1 }}>
                                {sq.name}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {completedQuests.length > 0 && (
            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: '#22c55e', textTransform: 'uppercase' }}>
                Campagne Completate
              </h3>
              {completedQuests.map((q) => (
                <div key={q.id} className="glass-panel" style={{ padding: '12px', opacity: 0.6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>🏆</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', textDecoration: 'line-through' }}>{q.name}</h4>
                      <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: 'bold' }}>Completata!</span>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
              ⚔️ Catalogo Sfide Preimpostate
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>Scegli una sfida da 30 giorni o 7 giorni per iniziare subito</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {CHALLENGE_TEMPLATES.map((tmpl) => {
              const primaryStat = stats.find(s => s.id === tmpl.primaryStatId);
              return (
                <div
                  key={tmpl.id}
                  className="glass-panel"
                  style={{ padding: '14px', borderLeft: `4px solid ${tmpl.color || 'var(--accent-primary)'}` }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>{tmpl.icon}</span>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{tmpl.name}</h4>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '10px' }}>
                      {tmpl.duration} GG
                    </span>
                  </div>
                  <p style={{ margin: '8px 0', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {tmpl.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {primaryStat && <span>{primaryStat.icon} {primaryStat.name}</span>}
                      <span>{'⭐'.repeat(tmpl.stars || 3)}</span>
                    </div>
                    <button
                      onClick={() => {
                        onActivateChallenge(tmpl);
                        setSubTab('quest');
                      }}
                      className="btn-primary"
                      style={{ padding: '4px 12px', fontSize: '11px', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
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
    </section>
  );
}
