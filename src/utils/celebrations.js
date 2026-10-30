// Celebrazioni: logica pura (niente grafica), così si può riusare anche nell'app nativa (#24).
// - calcolo dell'avanzamento di un'abilità/caratteristica dopo un guadagno di XP
// - avanzamento di oggi per abitudini e Azioni del Giorno
// - un piccolo "canale" di eventi a cui si abbona il livello grafico (CelebrationLayer)
import { getXpForLevel, calculateLevelFromXp, getCumulativeXpForLevel } from './helpers';
import { LEVEL_CAP, TITLES } from './constants';
import { _t } from '../i18n';

// Applica `amount` XP a un'abilità (livello + XP dentro il livello). Stessa regola di handleRewardXp.
export function applyStatXp(level, xp, amount) {
  let lvl = Number(level) || 1;
  let cur = (Number(xp) || 0) + (Number(amount) || 0);
  let needed = getXpForLevel(lvl + 1);
  while (needed > 0 && cur >= needed && lvl < LEVEL_CAP) {
    cur -= needed;
    lvl += 1;
    needed = getXpForLevel(lvl + 1);
  }
  return { level: lvl, xp: cur };
}

// Percentuale della barra di un'abilità (0-100)
export function statProgress(level, xp) {
  if ((Number(level) || 1) >= LEVEL_CAP) return 100;
  const needed = getXpForLevel((Number(level) || 1) + 1);
  return needed > 0 ? Math.max(0, Math.min(100, ((Number(xp) || 0) / needed) * 100)) : 100;
}

// Livello e percentuale del personaggio dato il totale di XP
export function playerProgress(totalXp) {
  const level = calculateLevelFromXp(totalXp);
  if (level >= LEVEL_CAP) return { level, pct: 100 };
  const base = getCumulativeXpForLevel(level);
  const span = Math.max(1, getCumulativeXpForLevel(level + 1) - base);
  return { level, pct: Math.max(0, Math.min(100, ((totalXp - base) / span) * 100)) };
}

export function titleForLevel(level) {
  let title = TITLES[0].title;
  for (const t of TITLES) if (level >= t.level) title = t.title;
  return _t(title);
}

// Abitudini di oggi: stesse regole della scheda Abitudini (non bloccate, già create a quella data)
export function habitsProgress(habits, completionLog, dateStr) {
  const visible = (habits || []).filter(h => !h.locked && !(h.createdAt && h.createdAt.split('T')[0] > dateStr));
  const doneIds = completionLog?.[dateStr]?.habits || [];
  const done = visible.filter(h => doneIds.includes(h.id)).length;
  return { done, total: visible.length };
}

// Azioni del Giorno: missioni e passi di campagna pianificati per oggi (stesse regole della Home)
export function dailyActionsProgress(oneshots, quests, dateStr) {
  const items = [];
  (oneshots || []).forEach(o => { if (!o.locked && o.fromDailyPlan && o.dailyPlanDate === dateStr) items.push(!!o.completed); });
  (quests || []).forEach(q => (q.subquests || []).forEach(sq => {
    if (sq.fromDailyPlan && sq.dailyPlanDate === dateStr) items.push(!!sq.completed);
  }));
  return { done: items.filter(Boolean).length, total: items.length };
}

// --- Canale eventi ---
// tipi: 'xp' { statId, icon, name, fromLevel, fromXp, toLevel, toXp, amount }
//       'levelup' { kind: 'player'|'stat', icon, name, level, title? }
//       'confetti' { reason: 'habits'|'actions', message }
//       'money' { kind: 'in'|'out', accId, label: '+12,50 €', emoji? } — entrata/uscita nel Tesoro
const listeners = new Set();
export function onCelebration(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function celebrate(type, payload) {
  listeners.forEach(fn => { try { fn(type, payload); } catch (e) { console.error(e); } });
}
