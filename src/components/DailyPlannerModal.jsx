import React, { useState, useEffect } from 'react';

export default function DailyPlannerModal({ isOpen, onClose, onSave, stats, oneshots = [], quests = [] }) {
  const [slots, setSlots] = useState({
    action: { emoji: '🎯', name: '', stars: 3, statId: 'int', secondaryStatId: '', oneshotId: null },
    bonus: { emoji: '⚡', name: '', stars: 2, statId: 'int', secondaryStatId: '', oneshotId: null },
    movement: { emoji: '🚶', name: '', stars: 2, statId: 'str', secondaryStatId: '', oneshotId: null },
    reaction: { emoji: '🛡️', name: '', stars: 2, statId: 'wis', secondaryStatId: '', oneshotId: null }
  });

  const [isRolling, setIsRolling] = useState(false);
  const [diceResult, setDiceResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSlots({
        action: { emoji: '🎯', name: '', stars: 3, statId: 'int', secondaryStatId: '', oneshotId: null },
        bonus: { emoji: '⚡', name: '', stars: 2, statId: 'int', secondaryStatId: '', oneshotId: null },
        movement: { emoji: '🚶', name: '', stars: 2, statId: 'str', secondaryStatId: '', oneshotId: null },
        reaction: { emoji: '🛡️', name: '', stars: 2, statId: 'wis', secondaryStatId: '', oneshotId: null }
      });
      setIsRolling(false);
      setDiceResult(null);
      setShowResult(false);
    }
  }, [isOpen]);

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
        name: `${q.emoji || '🏆'} ${q.title}: ${nextSub.name}`,
        rawName: nextSub.name,
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
          onSave(slots, finalRoll);
          onClose();
        }, 1500);
      }
    }, 100);
  };

  const slotThemes = {
    action: { title: 'AZIONE', emoji: '🎯', color: '#ef4444' },
    bonus: { title: 'AZIONE BONUS', emoji: '⚡', color: '#f59e0b' },
    movement: { title: 'MOVIMENTO', emoji: '🚶', color: '#0ea5e9' },
    reaction: { title: 'REAZIONE', emoji: '🛡️', color: '#a855f7' }
  };

  const renderSlot = (key, placeholder) => {
    const slot = slots[key];
    const theme = slotThemes[key];

    return (
      <div
        style={{
          padding: '6px 8px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px'
        }}
      >
        {/* Rigo 1: Categoria Colore (Senza Emoji duplicata) */}
        <div style={{ fontSize: '10px', fontWeight: 'bold', color: theme.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {theme.title}
        </div>

        {/* Rigo 2: Custom Emoji + Barra Nome + Emoji 📋 */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => {
              const currentVal = slot.emoji || theme.emoji;
              const chosen = window.prompt("Scegli o digita l'emoji per quest'azione:", currentVal);
              if (chosen !== null && chosen.trim() !== '') {
                handleSlotChange(key, 'emoji', chosen.trim());
              }
            }}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--bg-card)',
              border: '1px solid var(--glass-border)',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
            }}
            title="Tocca per scegliere l'emoji"
          >
            {slot.emoji || theme.emoji}
          </button>

          <input
            type="text"
            value={slot.name}
            onChange={(e) => handleSlotChange(key, 'name', e.target.value)}
            placeholder={placeholder}
            style={{
              flex: 1,
              background: 'var(--bg-primary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              padding: '4px 8px',
              fontSize: '11px',
              color: 'var(--text-primary)',
              boxSizing: 'border-box',
              height: '32px'
            }}
          />

          {(uncompletedOneshots.length > 0 || activeCampaignMilestones.length > 0) && (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0, height: '32px' }}>
              <select
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  if (val.startsWith('oneshot-')) {
                    const targetId = val.replace('oneshot-', '');
                    const found = uncompletedOneshots.find(o => o.id === targetId);
                    if (found) {
                      handleSlotChange(key, 'name', found.name);
                      handleSlotChange(key, 'oneshotId', found.id);
                      if (found.emoji) handleSlotChange(key, 'emoji', found.emoji);
                      if (found.difficulty) handleSlotChange(key, 'stars', found.difficulty);
                      if (found.primaryTarget) handleSlotChange(key, 'statId', found.primaryTarget);
                    }
                  } else if (val.startsWith('quest-')) {
                    const found = activeCampaignMilestones.find(m => m.id === val);
                    if (found) {
                      handleSlotChange(key, 'name', found.rawName || found.name);
                      handleSlotChange(key, 'oneshotId', null);
                      if (found.difficulty) handleSlotChange(key, 'stars', found.difficulty);
                      if (found.statId) handleSlotChange(key, 'statId', found.statId);
                    }
                  }
                  e.target.value = "";
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer',
                  width: '100%',
                  height: '100%',
                  zIndex: 2
                }}
              >
                <option value="">📋 Attingi da Task o Campagne...</option>
                {uncompletedOneshots.length > 0 && (
                  <optgroup label="💥 Task Singoli in Sospeso">
                    {uncompletedOneshots.map(o => (
                      <option key={o.id} value={`oneshot-${o.id}`}>
                        {o.emoji || '💥'} {o.name} {o.scheduledCount ? `(programmato ${o.scheduledCount}x)` : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
                {activeCampaignMilestones.length > 0 && (
                  <optgroup label="🏆 Prossimo Obiettivo Campagne">
                    {activeCampaignMilestones.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <button
                type="button"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Scegli da Task esistenti o Campagne"
              >
                📋
              </button>
            </div>
          )}
        </div>

        {/* Rigo 3: Stelline + Caratteristiche */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '1px', fontSize: '14px', lineHeight: 1 }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => handleSlotChange(key, 'stars', star)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: star <= slot.stars ? '#f59e0b' : 'var(--text-muted)'
                }}
              >
                ★
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <select
              value={slot.statId}
              onChange={(e) => handleSlotChange(key, 'statId', e.target.value)}
              style={{
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--glass-border)',
                borderRadius: '6px',
                padding: '2px 4px',
                fontSize: '9px',
                fontWeight: 'bold',
                height: '22px'
              }}
            >
              {stats.map(s => (
                <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
              ))}
            </select>

            <select
              value={slot.secondaryStatId || ''}
              onChange={(e) => handleSlotChange(key, 'secondaryStatId', e.target.value)}
              style={{
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--glass-border)',
                borderRadius: '6px',
                padding: '2px 4px',
                fontSize: '9px',
                height: '22px'
              }}
            >
              <option value="">+ Sec (nessuno)</option>
              {stats.map(s => (
                <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  };

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
        className="modal w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-scale-up"
        style={{
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
          width: '100%',
          maxWidth: '420px',
          padding: '14px 16px',
          maxHeight: '96dvh',
          overflowY: 'auto',
          borderRadius: '24px',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '6px' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span>🎲</span> È IL TUO TURNO!
          </h2>
          <p style={{ margin: '1px 0 0 0', fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Pianifica le tue azioni per oggi
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
          {renderSlot('action', 'Es: Completare il report')}
          {renderSlot('bonus', 'Es: Chiamare il medico')}
          {renderSlot('movement', 'Es: Passeggiata 30min')}
          {renderSlot('reaction', 'Es: Rispondere a 3 email')}
        </div>

        {showResult ? (
          <div style={{ textAlign: 'center', padding: '6px 0' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
              {diceResult}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#22c55e' }}>
              + {diceResult * 10}% XP Bonus! 🎉
            </div>
          </div>
        ) : isRolling ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {diceResult}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleRollDice}
            style={{
              width: '100%',
              padding: '10px',
              fontWeight: 'bold',
              fontSize: '12px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              background: 'var(--accent-gradient, linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%))',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
            }}
          >
            🎲 Lancia un D10!
          </button>
        )}
      </div>
    </div>
  );
}
