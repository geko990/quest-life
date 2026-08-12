import React, { useState, useEffect } from 'react';

export default function DailyPlannerModal({ isOpen, onClose, onSave, stats }) {
  const [slots, setSlots] = useState({
    action: { name: '', stars: 3, statId: 'int', secondaryStatId: '' },
    bonus: { name: '', stars: 2, statId: 'int', secondaryStatId: '' },
    movement: { name: '', stars: 2, statId: 'str', secondaryStatId: '' },
    reaction: { name: '', stars: 2, statId: 'wis', secondaryStatId: '' }
  });

  const [isRolling, setIsRolling] = useState(false);
  const [diceResult, setDiceResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSlots({
        action: { name: '', stars: 3, statId: 'int', secondaryStatId: '' },
        bonus: { name: '', stars: 2, statId: 'int', secondaryStatId: '' },
        movement: { name: '', stars: 2, statId: 'str', secondaryStatId: '' },
        reaction: { name: '', stars: 2, statId: 'wis', secondaryStatId: '' }
      });
      setIsRolling(false);
      setDiceResult(null);
      setShowResult(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
    action: { title: '🎯 AZIONE', color: '#ef4444' },
    bonus: { title: '⚡ AZIONE BONUS', color: '#f59e0b' },
    movement: { title: '🚶 MOVIMENTO', color: '#0ea5e9' },
    reaction: { title: '🛡️ REAZIONE', color: '#a855f7' }
  };

  const renderSlot = (key, placeholder) => {
    const slot = slots[key];
    const theme = slotThemes[key];

    return (
      <div
        style={{
          padding: '10px 12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 'bold', color: theme.color, textTransform: 'uppercase' }}>
          {theme.title}
        </div>

        <input
          type="text"
          value={slot.name}
          onChange={(e) => handleSlotChange(key, 'name', e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            background: 'var(--bg-primary)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            padding: '8px 10px',
            fontSize: '12px',
            color: 'var(--text-primary)',
            boxSizing: 'border-box'
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          {/* Stars */}
          <div style={{ display: 'flex', gap: '2px', fontSize: '16px' }}>
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

          {/* Stat Selectors */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <select
              value={slot.statId}
              onChange={(e) => handleSlotChange(key, 'statId', e.target.value)}
              style={{
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--glass-border)',
                borderRadius: '6px',
                padding: '4px 6px',
                fontSize: '10px',
                fontWeight: 'bold'
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
                padding: '4px 6px',
                fontSize: '10px'
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
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 16px'
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
          maxWidth: '400px',
          padding: '24px',
          maxHeight: '96dvh',
          overflowY: 'auto',
          borderRadius: '24px',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '28px', marginBottom: '4px' }}>🎲</div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            È IL TUO TURNO!
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Pianifica le tue azioni per oggi
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {renderSlot('action', 'Es: Completare il report')}
          {renderSlot('bonus', 'Es: Chiamare il medico')}
          {renderSlot('movement', 'Es: Passeggiata 30min')}
          {renderSlot('reaction', 'Es: Rispondere a 3 email')}
        </div>

        {showResult ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
              {diceResult}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#22c55e' }}>
              + {diceResult * 10}% XP Bonus! 🎉
            </div>
          </div>
        ) : isRolling ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {diceResult}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                fontWeight: 'bold',
                fontSize: '12px',
                borderRadius: '10px',
                cursor: 'pointer'
              }}
            >
              Salta
            </button>
            <button
              type="button"
              onClick={handleRollDice}
              className="btn-primary"
              style={{
                flex: 1.8,
                padding: '12px',
                fontWeight: 'bold',
                fontSize: '12px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              🎲 Lancia un D10!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
