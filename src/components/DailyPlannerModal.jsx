import React, { useState, useEffect } from 'react';
import { getGameDate } from '../utils/helpers';

import { _t } from '../i18n';
import EmojiPickerSheet from './EmojiPickerSheet';
export default function DailyPlannerModal({ isOpen, onClose, onSave, stats, oneshots = [], quests = [], targetDate = null, isTomorrow = false, showIntro = false }) {
  const [slots, setSlots] = useState({
    action: { emoji: '🎯', name: '', stars: 3, statId: 'int', secondaryStatId: '', oneshotId: null },
    bonus: { emoji: '⚡', name: '', stars: 2, statId: 'int', secondaryStatId: '', oneshotId: null },
    movement: { emoji: '🚶', name: '', stars: 2, statId: 'str', secondaryStatId: '', oneshotId: null },
    reaction: { emoji: '🛡️', name: '', stars: 2, statId: 'wis', secondaryStatId: '', oneshotId: null }
  });

  const [isRolling, setIsRolling] = useState(false);
  const [diceResult, setDiceResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [emojiFor, setEmojiFor] = useState(null); // slot di cui si sta scegliendo l'emoji

  useEffect(() => {
    if (isOpen) {
      const defaultSlots = {
        action: { emoji: '🎯', name: '', stars: 3, statId: 'int', secondaryStatId: '', oneshotId: null },
        bonus: { emoji: '⚡', name: '', stars: 2, statId: 'int', secondaryStatId: '', oneshotId: null },
        movement: { emoji: '🚶', name: '', stars: 2, statId: 'str', secondaryStatId: '', oneshotId: null },
        reaction: { emoji: '🛡️', name: '', stars: 2, statId: 'wis', secondaryStatId: '', oneshotId: null }
      };

      const effectiveDate = (typeof targetDate === 'string' && targetDate.length === 10) ? targetDate : getGameDate();
      (oneshots || []).forEach(o => {
        if (o.fromDailyPlan && o.dailyPlanDate === effectiveDate && o.slotType && defaultSlots[o.slotType]) {
            defaultSlots[o.slotType] = {
              emoji: o.emoji || defaultSlots[o.slotType].emoji,
              name: o.name || '',
              stars: o.difficulty || o.stars || defaultSlots[o.slotType].stars,
              statId: o.primaryTarget || defaultSlots[o.slotType].statId,
              secondaryStatId: o.secondaryTarget || '',
              oneshotId: o.id
            };
          }
        });
        (quests || []).forEach(q => {
          (q.subquests || []).forEach(sq => {
            if (sq.fromDailyPlan && sq.dailyPlanDate === effectiveDate && sq.slotType && defaultSlots[sq.slotType]) {
              defaultSlots[sq.slotType] = {
                emoji: q.emoji || '🏆',
                name: sq.name || '',
                stars: sq.difficulty || defaultSlots[sq.slotType].stars,
                statId: q.primaryTarget || defaultSlots[sq.slotType].statId,
                secondaryStatId: '',
                questId: q.id,
                subquestId: sq.id
              };
            }
          });
        });

      setSlots(defaultSlots);
      setIsRolling(false);
      setDiceResult(null);
      setShowResult(false);
    }
  }, [isOpen, targetDate]);

  if (!isOpen) return null;

  const uncompletedOneshots = (oneshots || []).filter(o => !o.completed);
  const activeCampaignMilestones = (quests || [])
    .filter(q => !q.completed)
    .map(q => {
      const nextSub = (q.subquests || []).find(s => !s.completed);
      if (!nextSub) return null;
      return {
        id: `quest-${q.id}-${nextSub.id}`,
        questId: q.id,
        subquestId: nextSub.id,
        name: nextSub.name,
        rawName: nextSub.name,
        questName: q.name,
        emoji: q.emoji || '🏆',
        difficulty: nextSub.difficulty || 2,
        statId: q.primaryTarget || 'int'
      };
    })
    .filter(Boolean);

  const handleSlotChange = (slotKey, field, value) => {
    setSlots(prev => ({
      ...prev,
      [slotKey]: { ...prev[slotKey], [field]: value }
    }));
  };

  // Scrivendo a mano un nome, la riga non è più collegata alla missione scelta prima:
  // diventa un'azione nuova (altrimenti due righe finivano sulla stessa missione e se ne perdeva una)
  const handleSlotNameTyped = (slotKey, value) => {
    setSlots(prev => {
      const cur = prev[slotKey];
      const linked = cur.oneshotId || cur.questId;
      return {
        ...prev,
        [slotKey]: linked
          ? { ...cur, name: value, oneshotId: null, questId: null, subquestId: null }
          : { ...cur, name: value }
      };
    });
  };

  // Scegliendo una missione esistente in una riga, la si toglie dalle altre righe (spostamento)
  const releaseFromOtherSlots = (slotKey, match) => {
    setSlots(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (k === slotKey) return;
        const s = next[k];
        const same = (match.oneshotId && s.oneshotId === match.oneshotId) ||
          (match.subquestId && s.questId === match.questId && s.subquestId === match.subquestId);
        if (same) next[k] = { ...s, name: '', oneshotId: null, questId: null, subquestId: null };
      });
      return next;
    });
  };

  const hasAnyContent = Object.values(slots).some(s => s.name.trim() !== '');

  const handleRollDice = () => {
    if (!hasAnyContent) {
      onClose();
      return;
    }

    setIsRolling(true);
    let rollCount = 0;
    const maxRolls = 15;

    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {}

    const interval = setInterval(() => {
      setDiceResult(Math.floor(Math.random() * 10) + 1);
      rollCount++;

      if (rollCount >= maxRolls) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 10) + 1;
        setDiceResult(finalRoll);
        setIsRolling(false);
        setShowResult(true);

        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

        setTimeout(() => {
          const safeTargetDate = (typeof targetDate === 'string' && targetDate.length === 10) ? targetDate : null;
          onSave(slots, finalRoll, safeTargetDate);
          onClose();
        }, 1500);
      }
    }, 100);
  };

  const slotThemes = {
    action: { title: _t("AZIONE"), emoji: '🎯', color: '#ef4444' },
    bonus: { title: _t("AZIONE BONUS"), emoji: '⚡', color: '#f59e0b' },
    movement: { title: _t("MOVIMENTO"), emoji: '🚶', color: '#0ea5e9' },
    reaction: { title: _t("REAZIONE"), emoji: '🛡️', color: '#a855f7' }
  };

  // Scelta di un task o di un passo di campagna già esistente per uno slot
  const handlePickExisting = (key, val) => {
    if (!val) return;
    if (val.startsWith('oneshot-')) {
      const targetId = val.replace('oneshot-', '');
      const found = uncompletedOneshots.find(o => o.id === targetId);
      if (found) {
        releaseFromOtherSlots(key, { oneshotId: found.id });
        handleSlotChange(key, 'name', found.name);
        handleSlotChange(key, 'oneshotId', found.id);
        handleSlotChange(key, 'questId', null);
        handleSlotChange(key, 'subquestId', null);
        if (found.emoji) handleSlotChange(key, 'emoji', found.emoji);
        if (found.difficulty) handleSlotChange(key, 'stars', found.difficulty);
        if (found.primaryTarget) handleSlotChange(key, 'statId', found.primaryTarget);
      }
    } else if (val.startsWith('quest-')) {
      const found = activeCampaignMilestones.find(m => m.id === val);
      if (found) {
        releaseFromOtherSlots(key, { questId: found.questId, subquestId: found.subquestId });
        handleSlotChange(key, 'name', found.name);
        if (found.emoji) handleSlotChange(key, 'emoji', found.emoji);
        handleSlotChange(key, 'oneshotId', null);
        handleSlotChange(key, 'questId', found.questId);
        handleSlotChange(key, 'subquestId', found.subquestId);
        if (found.difficulty) handleSlotChange(key, 'stars', found.difficulty);
        if (found.statId) handleSlotChange(key, 'statId', found.statId);
      }
    }
  };

  const statLabel = (id) => {
    const s = (stats || []).find(x => x.id === id);
    return s ? `${s.icon} ${s.name}` : '';
  };

  const renderSlot = (key, placeholder) => {
    const slot = slots[key];
    const theme = slotThemes[key];
    const canPick = uncompletedOneshots.length > 0 || activeCampaignMilestones.length > 0;

    // Tessera dell'azione: l'unico riquadro è il nome; emoji, stelle e caratteristiche sono "libere"
    return (
      <div className="planner-slot" style={{ '--c': theme.color }}>
        <div className="planner-kind">{_t(theme.title)}</div>

        <div className="planner-row">
          <button
            type="button"
            className="planner-emoji"
            onClick={() => setEmojiFor(key)}
            aria-label={_t("Tocca per scegliere l'emoji")}
          >
            {slot.emoji || theme.emoji}
          </button>

          <input
            type="text"
            className="planner-name"
            value={slot.name}
            onChange={(e) => handleSlotNameTyped(key, e.target.value)}
            placeholder={placeholder}
          />

          {canPick && (
            <span className="planner-pick" title={_t("Scegli da Task esistenti o Campagne")}>
              📋
              <select
                value=""
                onChange={(e) => { const val = e.target.value; if (val) handlePickExisting(key, val); e.target.value = ""; }}
                aria-label={_t("Scegli da Task esistenti o Campagne")}
              >
                <option value="">{_t("📋 Attingi da Task o Campagne...")}</option>
                {uncompletedOneshots.length > 0 && (
                  <optgroup label={_t("💥 Task Singoli in Sospeso")}>
                    {uncompletedOneshots.map(o => (
                      <option key={o.id} value={`oneshot-${o.id}`}>
                        {o.emoji || '💥'} {o.name} {o.scheduledCount ? _t("(programmato {0}x)", o.scheduledCount) : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
                {activeCampaignMilestones.length > 0 && (
                  <optgroup label={_t("🏆 Prossimo Obiettivo Campagne")}>
                    {activeCampaignMilestones.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.emoji || '🏆'} {m.name} {m.questName ? `(${m.questName})` : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </span>
          )}
        </div>

        <div className="planner-meta">
          <div className="planner-stars">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                className={star <= slot.stars ? 'on' : 'qstar-off'}
                onClick={() => handleSlotChange(key, 'stars', star)}
                aria-label={_t("{0} stelle", star)}
              >
                ⭐
              </button>
            ))}
          </div>

          <label className="planner-stat">
            <span>{statLabel(slot.statId)}</span><i>▾</i>
            <select value={slot.statId} onChange={(e) => handleSlotChange(key, 'statId', e.target.value)}>
              {stats.map(s => (
                <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
              ))}
            </select>
          </label>

          <span className="planner-dot">·</span>

          <label className="planner-stat sec">
            <span>{slot.secondaryStatId ? statLabel(slot.secondaryStatId) : _t("+ Secondaria")}</span><i>▾</i>
            <select value={slot.secondaryStatId || ''} onChange={(e) => handleSlotChange(key, 'secondaryStatId', e.target.value)}>
              <option value="">{_t("+ Sec (nessuno)")}</option>
              {stats.map(s => (
                <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
    );
  };

  const isLandscape = typeof window !== 'undefined' && (window.innerWidth > window.innerHeight || window.matchMedia?.('(orientation: landscape)')?.matches);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay active animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99990,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 14px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal w-full rounded-2xl overflow-hidden shadow-2xl animate-scale-up"
        style={{
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
          width: '100%',
          maxWidth: isLandscape ? '560px' : '420px',
          // .modal ha padding 0 forzato: le spaziature stanno nelle tre fasce (intestazione, azioni, barra in fondo)
          aspectRatio: 'auto',
          justifyContent: 'flex-start',
          maxHeight: '96dvh',
          overflowY: 'auto',
          borderRadius: '24px',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', padding: isLandscape ? '14px 16px 10px' : '20px 20px 14px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '0.2px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span>🎲</span> {isTomorrow ? _t("PIANIFICA DOMANI") : _t("È IL TUO TURNO!")}
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', letterSpacing: '0.6px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            {isTomorrow ? _t("Prepara le tue azioni in anticipo per domani") : _t("Pianifica le tue azioni per oggi")}
          </p>
          {/* La prima volta (#58): una riga per capire a cosa serve */}
          {showIntro && (
            <p className="planner-intro">{_t("Ogni giorno scegli 4 azioni, come i turni di un gioco di ruolo. Poi tira il D10 per un bonus di XP.")}</p>
          )}
        </div>

        <div style={{
          display: isLandscape ? 'grid' : 'flex',
          gridTemplateColumns: isLandscape ? '1fr 1fr' : undefined,
          flexDirection: isLandscape ? undefined : 'column',
          gap: '8px',
          padding: isLandscape ? '0 14px 12px' : '0 14px 14px'
        }}>
          {renderSlot('action', _t("Es: Completare il report"))}
          {renderSlot('bonus', _t("Es: Chiamare il medico"))}
          {renderSlot('movement', _t("Es: Passeggiata 30min"))}
          {renderSlot('reaction', _t("Es: Rispondere a 3 email"))}
        </div>

        {/* Barra in fondo come nelle altre finestre: bottone a tutta larghezza, poi risultato del dado */}
        <div className="modal-action-bar" style={{ justifyContent: 'center', minHeight: '78px', paddingTop: '12px', paddingBottom: isLandscape ? '14px' : '20px' }}>
          {showResult ? (
            <div style={{ textAlign: 'center', lineHeight: 1.15 }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-primary)' }}>{diceResult}</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#22c55e' }}>
                {_t("+ {0}% XP Bonus! 🎉", diceResult * 10)}</div>
            </div>
          ) : isRolling ? (
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.15 }}>{diceResult}</div>
          ) : (
            <button type="button" className="modal-action-save" onClick={handleRollDice}>
              {_t("🎲 Lancia un D10!")}</button>
          )}
        </div>
      </div>

      {/* Selettore delle emoji (fuori dalla finestra, sopra a tutto) */}
      <div onClick={(e) => e.stopPropagation()}>
        <EmojiPickerSheet
          open={!!emojiFor}
          emoji={emojiFor ? (slots[emojiFor].emoji || slotThemes[emojiFor].emoji) : ''}
          color={emojiFor ? slotThemes[emojiFor].color : undefined}
          onPick={(e) => { if (emojiFor) handleSlotChange(emojiFor, 'emoji', e); }}
          onClose={() => setEmojiFor(null)}
        />
      </div>
    </div>
  );
}
