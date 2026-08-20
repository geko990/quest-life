import React, { useState } from 'react';
import SwipeableCard from '../components/SwipeableCard';
import { CHALLENGE_TEMPLATES } from '../utils/constants';
import { useTouchReorder } from '../utils/useTouchReorder';

export default function MissionsTab({
  oneshots = [],
  setOneshots,
  onToggleOneshot,
  onDeleteOneshot,
  onEditOneshot,
  quests = [],
  setQuests,
  onToggleSubquest,
  onDeleteQuest,
  onEditQuest,
  onOpenModal,
  completionLog = {},
  stats,
  settings,
  onOpenDailyPlanner,
  onActivateChallenge
}) {
  const { getDragProps: getOneshotDragProps } = useTouchReorder(oneshots, setOneshots);
  const { getDragProps: getQuestDragProps } = useTouchReorder(quests, setQuests);
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
          <button
            className="add-btn-circle"
            onClick={() => setShowCompletedOneshots(!showCompletedOneshots)}
            title={showCompletedOneshots ? "Mostra missioni da completare" : "Mostra missioni completate"}
            style={{
              background: showCompletedOneshots ? 'var(--accent-gradient, #7c3aed)' : 'var(--bg-secondary)',
              color: showCompletedOneshots ? '#ffffff' : 'var(--text-primary)',
              border: showCompletedOneshots ? '1px solid rgba(255,255,255,0.3)' : '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '15px'
            }}
          >
            ☑️
          </button>
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

          {/* Oneshot Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredOneshots.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💥</div>
                <div className="empty-state-text">Nessuna missione {showCompletedOneshots ? 'completata' : 'attiva'}</div>
                <div className="empty-state-hint">Clicca "+" per crearne una</div>
              </div>
            ) : (
              filteredOneshots.map((o, idx) => {
                const primaryStat = stats.find(s => s.id === o.primaryTarget);
                const secondaryStat = stats.find(s => s.id === o.secondaryTarget);
                const starsCount = o.difficulty !== undefined ? o.difficulty : (o.stars || 1);
                const dragProps = getOneshotDragProps(o, idx);

                return (
                  <div
                    key={o.id}
                    className={`task-card ${o.completed ? 'completed' : ''}`}
                    data-type="oneshot"
                    data-id={o.id}
                    {...dragProps}
                  >
                    <div className="swipe-content" onClick={() => onOpenModal('oneshot_detail', o)}>
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
                          {primaryStat && <span className="card-stat" title={primaryStat.name}>{primaryStat.icon}</span>}
                          {secondaryStat && <span className="card-stat" style={{ opacity: 0.6 }} title={secondaryStat.name}>{secondaryStat.icon}</span>}
                          {o.dueDate && (
                            <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 'bold', background: 'rgba(245, 158, 11, 0.1)', padding: '1px 6px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                              📅 {new Date(o.dueDate + 'T00:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </div>

                      {o.scheduledCount > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '32px', flexShrink: 0 }}>
                          <span style={{ fontSize: '10px', color: '#8b5cf6', fontWeight: 'bold', background: 'rgba(139, 92, 246, 0.12)', padding: '2px 7px', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
                            📌 {o.scheduledCount}x
                          </span>
                        </div>
                      )}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!showCompletedOneshots ? (
            /* Active Quests */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeQuests.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🏆</div>
                  <div className="empty-state-text">Nessuna campagna attiva</div>
                  <div className="empty-state-hint">Attiva una sfida dal catalogo o creane una nuova</div>
                </div>
              ) : (
                activeQuests.map((q, idx) => {
                  const totalSub = q.subquests?.length || 0;
                  const completedSub = q.subquests?.filter(sq => sq.completed).length || 0;
                  const progressPct = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;
                  const primaryStat = stats.find(s => s.id === q.primaryTarget);
                  const isExpanded = expandedQuestId === q.id;
                  const nextSubquest = q.subquests?.find(sq => !sq.completed);
                  const dragProps = getQuestDragProps(q, idx);

                  return (
                    <div
                      key={q.id}
                      className="glass-panel"
                      {...dragProps}
                      style={{
                        padding: 0,
                        overflow: 'hidden',
                        borderLeft: `4px solid ${q.color || 'var(--accent-primary)'}`,
                        border: isExpanded ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        ...dragProps.style
                      }}
                    >
                      {/* Header Section */}
                      <div
                        onClick={() => onOpenModal('quest_detail', q)}
                        style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}
                        title="Clicca per aprire la finestra dettagli della campagna"
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {q.emoji && q.emoji !== '🏆' && (
                              <span style={{ fontSize: '20px', flexShrink: 0 }}>{q.emoji}</span>
                            )}
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.name}</h4>
                          </div>

                          {q.description && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                              {q.description}
                            </p>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '10px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                            {primaryStat && (
                              <span style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '6px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                {primaryStat.icon} {primaryStat.name}
                              </span>
                            )}
                            {q.dueDate && (
                              <span style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 6px', borderRadius: '6px', fontWeight: 'bold', color: '#f59e0b' }}>
                                📅 {new Date(q.dueDate + 'T00:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                            <span style={{ color: '#f59e0b' }}>{'★'.repeat(q.difficulty || 1)}</span>
                            <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>{completedSub}/{totalSub} sotto-obiettivi</span>
                          </div>

                          {/* Reward Badge */}
                          {q.reward && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '11px', color: '#f59e0b', fontWeight: 'bold', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                              🎁 Premio: {q.reward}
                            </div>
                          )}
                        </div>

                        {/* Top-Right Card Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleQuestExpand(q.id);
                            }}
                            title="Espandi elenco sottotask"
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer', padding: '4px' }}
                          >
                            {isExpanded ? '▲' : '▼'}
                          </button>
                        </div>
                      </div>

                      {/* Next Subtask Direct Action Tile on Card */}
                      {nextSubquest ? (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSubquest(q.id, nextSubquest.id);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '9px 12px',
                            background: 'var(--bg-secondary)',
                            borderRadius: '12px',
                            border: '1.5px solid var(--accent-primary)',
                            margin: '0 12px 12px 12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(124, 58, 237, 0.12)'
                          }}
                          title="Clicca per spuntare direttamente il prossimo sotto-obiettivo!"
                        >
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '6px',
                              border: '2px solid var(--accent-primary)',
                              background: 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              color: '#ffffff',
                              flexShrink: 0
                            }}
                          >
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--accent-primary)', textTransform: 'uppercase', display: 'block', letterSpacing: '0.5px' }}>
                              ⚡ PROSSIMO SOTTO-OBIETTIVO
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                              {nextSubquest.name}
                            </span>
                          </div>
                        </div>
                      ) : totalSub > 0 && completedSub === totalSub ? (
                        <div
                          style={{
                            margin: '0 12px 12px 12px',
                            padding: '8px 12px',
                            background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(16,185,129,0.25) 100%)',
                            border: '1px solid rgba(34,197,94,0.4)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#22c55e' }}>
                            🏆 Tutti i sotto-obiettivi completati!
                          </span>
                        </div>
                      ) : (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditQuest(q);
                          }}
                          style={{
                            margin: '0 12px 12px 12px',
                            padding: '8px 12px',
                            background: 'var(--bg-secondary)',
                            border: '1px border-dashed var(--glass-border)',
                            borderRadius: '12px',
                            textAlign: 'center',
                            fontSize: '11px',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          + Aggiungi milestones / sotto-obiettivi
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div style={{ width: '100%', height: '4px', background: 'var(--bg-secondary)' }}>
                        <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--accent-gradient, #7c3aed)', transition: 'width 0.3s' }}></div>
                      </div>

                      {/* Accordion list of all subquests */}
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
          ) : (
            /* Completed Quests */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {completedQuests.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🏆</div>
                  <div className="empty-state-text">Nessuna campagna completata</div>
                </div>
              ) : (
                completedQuests.map((q) => (
                  <div
                    key={q.id}
                    className="glass-panel"
                    style={{ padding: '12px 16px', opacity: 0.85, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onClick={() => onOpenModal('quest_detail', q)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '22px' }}>{q.emoji || '🏆'}</span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', textDecoration: 'line-through' }}>{q.name}</h4>
                        <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: 'bold' }}>Completata!</span>
                        {q.reward && (
                          <div style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 'bold' }}>🎁 Premio sbloccato: {q.reward}</div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenModal('quest_detail', q);
                      }}
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      🔍 Dettagli
                    </button>
                  </div>
                ))
              )}
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
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>Scegli una sfida per iniziare subito</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {CHALLENGE_TEMPLATES.map((tmpl) => {
              const primaryStat = stats.find(s => s.id === tmpl.primaryStatId);
              const cleanName = tmpl.name ? tmpl.name.replace(/^[\p{Emoji}\s]+/u, '').trim() : '';

              return (
                <div
                  key={tmpl.id}
                  className="glass-panel"
                  onClick={() => onOpenModal('challenge_preview', tmpl)}
                  style={{ padding: '14px', borderLeft: `4px solid ${tmpl.color || 'var(--accent-primary)'}`, display: 'flex', flexDirection: 'column', gap: '10px', cursor: 'pointer' }}
                  title="Clicca per visualizzare l'anteprima completa delle milestones e i dettagli della sfida"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--glass-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          flexShrink: 0
                        }}
                      >
                        {tmpl.icon}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {cleanName || tmpl.name}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                          <span style={{ background: 'var(--bg-secondary)', padding: '1px 6px', borderRadius: '6px', fontWeight: 'bold' }}>{tmpl.duration} GG</span>
                          {primaryStat && <span>• {primaryStat.icon} {primaryStat.name}</span>}
                          <span>• {'⭐'.repeat(tmpl.stars || 3)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onActivateChallenge(tmpl);
                        setSubTab('quest');
                      }}
                      style={{
                        padding: '8px 14px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        borderRadius: '10px',
                        border: 'none',
                        cursor: 'pointer',
                        background: 'var(--accent-gradient, #7c3aed)',
                        color: '#ffffff',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)'
                      }}
                    >
                      Attiva Sfida
                    </button>
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {tmpl.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
