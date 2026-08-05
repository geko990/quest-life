import React, { useState, useEffect } from 'react';

export default function DailyPlannerModal({ isOpen, onClose, onSave, stats }) {
  const [slots, setSlots] = useState({
    action: { name: '', stars: 3, statId: 'int' },
    bonus: { name: '', stars: 2, statId: 'int' },
    movement: { name: '', stars: 2, statId: 'str' },
    reaction: { name: '', stars: 2, statId: 'wis' }
  });

  const [isRolling, setIsRolling] = useState(false);
  const [diceResult, setDiceResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setSlots({
        action: { name: '', stars: 3, statId: 'int' },
        bonus: { name: '', stars: 2, statId: 'int' },
        movement: { name: '', stars: 2, statId: 'str' },
        reaction: { name: '', stars: 2, statId: 'wis' }
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
    
    // Play sound if possible
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch(e){}

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

  const renderSlot = (key, title, placeholder, icon) => {
    const slot = slots[key];
    return (
      <div className="bg-slate-900/40 dark:bg-slate-900/60 border border-border-color/40 p-3.5 rounded-2xl shadow-sm flex flex-col gap-2 transition-all">
        <div className="flex items-center text-xs font-extrabold text-accent-primary uppercase tracking-wider">
          <span className="mr-1.5 text-sm">{icon}</span> {title}
        </div>
        <div className="relative">
          <input
            type="text"
            value={slot.name}
            onChange={(e) => handleSlotChange(key, 'name', e.target.value)}
            placeholder={placeholder}
            className="w-full bg-slate-950/60 border border-border-color/60 rounded-xl px-3 py-2 text-xs font-medium text-text-main placeholder:text-text-secondary/40 focus:outline-none focus:border-accent-primary transition-colors"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 cursor-pointer hover:opacity-100 transition-opacity text-xs">
            💥
          </div>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex gap-1 text-base">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => handleSlotChange(key, 'stars', star)}
                className={`transition-all active:scale-125 focus:outline-none ${star <= slot.stars ? 'text-amber-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.6)]' : 'text-slate-700'}`}
              >
                ★
              </button>
            ))}
          </div>
          <select
            value={slot.statId}
            onChange={(e) => handleSlotChange(key, 'statId', e.target.value)}
            className="bg-slate-950/80 border border-border-color/60 rounded-lg px-2 py-1 text-[11px] font-semibold text-text-secondary focus:outline-none focus:border-accent-primary"
          >
            {stats.filter(s => s.type === 'attribute').map(s => (
              <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-5 animate-fade-in overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[350px] mx-auto bg-bg-main border border-border-color/60 rounded-3xl shadow-2xl p-6 my-auto animate-scale-up"
      >
        <div className="text-center mb-5">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-2xl animate-bounce">🎲</span>
            <h2 className="text-lg font-bold font-cinzel text-text-main tracking-wider">È IL TUO TURNO!</h2>
          </div>
          <p className="text-[10px] text-text-secondary uppercase tracking-widest font-extrabold opacity-75">
            Pianifica le tue azioni per oggi
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {renderSlot('action', 'Azione', 'Es: Completare il report', '🎯')}
          {renderSlot('bonus', 'Azione Bonus', 'Es: Chiamare il medico', '⚡')}
          {renderSlot('movement', 'Movimento', 'Es: Passeggiata 30min', '🚶')}
          {renderSlot('reaction', 'Reazione', 'Es: Rispondere a 3 email', '🛡️')}
        </div>

        {showResult ? (
          <div className="text-center animate-scale-up space-y-2 py-3">
            <div className="text-5xl font-bold text-accent-primary drop-shadow-[0_0_12px_rgba(255,107,0,0.6)]">
              {diceResult}
            </div>
            <div className="text-sm font-bold text-green-400">
              + {diceResult * 10}% XP Bonus! 🎉
            </div>
          </div>
        ) : isRolling ? (
          <div className="text-center py-4">
            <div className="text-5xl font-bold text-text-main animate-pulse">
              {diceResult}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all text-center"
            >
              Salta
            </button>
            <button
              type="button"
              onClick={handleRollDice}
              className="flex-[1.8] py-3 px-4 bg-gradient-to-r from-accent-primary via-purple-600 to-accent-secondary hover:brightness-110 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-purple-900/30 active:scale-95 transition-all flex items-center justify-center gap-2 text-center"
            >
              <span>🎲</span> Lancia un D10!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
