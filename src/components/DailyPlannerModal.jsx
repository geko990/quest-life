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

  // Reset state when opened
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

  // Themed Slot Colors
  const slotThemes = {
    action: {
      headerColor: 'text-red-400',
      bgClass: 'bg-red-950/20 border-red-500/30'
    },
    bonus: {
      headerColor: 'text-amber-400',
      bgClass: 'bg-amber-950/20 border-amber-500/30'
    },
    movement: {
      headerColor: 'text-sky-400',
      bgClass: 'bg-sky-950/20 border-sky-500/30'
    },
    reaction: {
      headerColor: 'text-purple-400',
      bgClass: 'bg-purple-950/20 border-purple-500/30'
    }
  };

  const renderSlot = (key, title, placeholder, icon) => {
    const slot = slots[key];
    const theme = slotThemes[key] || { headerColor: 'text-accent-primary', bgClass: 'bg-slate-900/40 border-border-color/40' };

    return (
      <div className={`p-4 rounded-2xl border shadow-md flex flex-col gap-3 transition-all ${theme.bgClass}`}>
        <div className={`flex items-center text-xs font-extrabold uppercase tracking-wider ${theme.headerColor}`}>
          <span className="mr-1.5 text-sm">{icon}</span> {title}
        </div>

        <div className="relative">
          <input
            type="text"
            value={slot.name}
            onChange={(e) => handleSlotChange(key, 'name', e.target.value)}
            placeholder={placeholder}
            className="w-full bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-border-color/60 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-text-main placeholder:text-slate-400 dark:placeholder:text-text-secondary/40 focus:outline-none focus:border-accent-primary transition-colors shadow-sm"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-30 text-xs">
            💥
          </div>
        </div>

        {/* Stars and Stat Selectors (Inset & Inward Offset with Theme Support) */}
        <div className="px-3 py-2 bg-slate-100/90 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-white/5 flex items-center justify-between gap-2 flex-wrap shadow-inner">
          {/* Stars (Left Inset) */}
          <div className="flex gap-1 text-base pl-0.5">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => handleSlotChange(key, 'stars', star)}
                className={`transition-all active:scale-125 focus:outline-none ${star <= slot.stars ? 'text-amber-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.6)]' : 'text-slate-400 dark:text-slate-700'}`}
              >
                ★
              </button>
            ))}
          </div>

          {/* Primary & Secondary Stat Selectors (Right Inset - White in Light Mode) */}
          <div className="flex items-center gap-1.5 pr-0.5">
            {/* Primary Stat */}
            <select
              value={slot.statId}
              onChange={(e) => handleSlotChange(key, 'statId', e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-border-color/60 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-900 dark:text-text-main focus:outline-none focus:border-accent-primary max-w-[98px] truncate shadow-sm"
            >
              {stats.map(s => (
                <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
              ))}
            </select>

            {/* Secondary Stat (Optional) */}
            <select
              value={slot.secondaryStatId || ''}
              onChange={(e) => handleSlotChange(key, 'secondaryStatId', e.target.value)}
              className="bg-white/90 dark:bg-slate-900/80 border border-slate-300 dark:border-border-color/40 rounded-lg px-1.5 py-1 text-[10px] font-medium text-slate-700 dark:text-text-secondary focus:outline-none focus:border-accent-primary max-w-[98px] truncate shadow-sm"
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
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-5 animate-fade-in overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[365px] mx-auto bg-bg-main border border-border-color/60 rounded-3xl shadow-2xl px-6 pt-8 pb-8 my-auto animate-scale-up flex flex-col justify-between min-h-[640px]"
      >
        {/* Header with ample headroom above for bouncing die */}
        <div className="text-center mb-6 pt-3">
          <div className="flex items-center justify-center gap-2 mb-2 pt-2">
            <span className="text-3xl animate-bounce filter drop-shadow-[0_0_8px_rgba(255,180,0,0.5)]">🎲</span>
            <h2 className="text-xl font-bold font-cinzel tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
              È IL TUO TURNO!
            </h2>
          </div>
          <p className="text-[10px] text-text-secondary uppercase tracking-widest font-extrabold opacity-75">
            Pianifica le tue azioni per oggi
          </p>
        </div>

        {/* Slot Cards List with generous 16px vertical gap */}
        <div className="space-y-4 mb-8">
          {renderSlot('action', 'Azione', 'Es: Completare il report', '🎯')}
          {renderSlot('bonus', 'Azione Bonus', 'Es: Chiamare il medico', '⚡')}
          {renderSlot('movement', 'Movimento', 'Es: Passeggiata 30min', '🚶')}
          {renderSlot('reaction', 'Reazione', 'Es: Rispondere a 3 email', '🛡️')}
        </div>

        {/* Bottom Actions Footer with ample bottom clearance */}
        {showResult ? (
          <div className="text-center animate-scale-up space-y-2 py-4 pb-2">
            <div className="text-5xl font-extrabold text-accent-primary drop-shadow-[0_0_14px_rgba(255,107,0,0.7)]">
              {diceResult}
            </div>
            <div className="text-sm font-extrabold text-green-400">
              + {diceResult * 10}% XP Bonus! 🎉
            </div>
          </div>
        ) : isRolling ? (
          <div className="text-center py-5 pb-2">
            <div className="text-5xl font-extrabold text-text-main animate-pulse">
              {diceResult}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 pt-4 pb-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 px-4 min-h-[52px] bg-slate-200 dark:bg-slate-800/90 hover:bg-slate-300 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs rounded-2xl shadow-sm active:scale-95 transition-all text-center flex items-center justify-center"
            >
              Salta
            </button>
            <button
              type="button"
              onClick={handleRollDice}
              className="flex-[1.8] py-4 px-4 min-h-[52px] bg-gradient-to-r from-accent-primary via-purple-600 to-accent-secondary hover:brightness-110 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-purple-900/40 active:scale-95 transition-all flex items-center justify-center gap-2 text-center"
            >
              <span>🎲</span> Lancia un D10!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
