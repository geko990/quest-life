// Riepilogo delle medaglie mensili (#51).
// Il riepilogo (attributo più sviluppato, abitudine più rispettata, XP del mese, top 10 task) si
// calcola dai dati vivi, ma ogni medaglia ne conserva una copia "stampata" (medal.snapshot) con nomi
// ed emoji. Se un'abitudine, un task o un attributo vengono cancellati, la medaglia mostra la copia
// invece di restare vuota. La copia si aggiorna: alla consegna della medaglia, prima di ogni
// cancellazione (App.jsx) e al caricamento dei dati (sanitizeState).

import { _t, monthLong } from '../i18n';

export const MEDAL_SNAPSHOT_VERSION = 1;

export function medalMonthPrefix(medal) {
  if (medal?.id && /^\d{4}-\d{2}$/.test(medal.id)) return medal.id;
  if (medal?.earnedDate && medal.earnedDate.length >= 7) return medal.earnedDate.substring(0, 7);
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const taskStars = (t) => (t.difficulty !== undefined ? t.difficulty : (t.stars || 1));

function topByCount(map) {
  let bestKey = null;
  let best = 0;
  Object.entries(map).forEach(([k, v]) => { if (v > best) { best = v; bestKey = k; } });
  return [bestKey, best];
}

// Abitudine più rispettata ricavata dal registro XP (nome salvato a ogni spunta): serve per le
// medaglie la cui abitudine è stata cancellata prima che esistesse la copia stampata.
function topHabitFromXpLog(xpLog, monthPrefix) {
  const daysByTitle = {};
  (xpLog || []).forEach((l) => {
    if (l && l.itemType === 'habit' && l.title && l.date && l.date.startsWith(monthPrefix)) {
      (daysByTitle[l.title] = daysByTitle[l.title] || new Set()).add(l.date);
    }
  });
  const counts = {};
  Object.entries(daysByTitle).forEach(([t, set]) => { counts[t] = set.size; });
  const [title, count] = topByCount(counts);
  return title ? { name: title, count } : null;
}

/**
 * Riepilogo di una medaglia. Restituisce solo dati semplici (nomi, emoji, numeri), così si può salvare.
 * data = { xpLog, completionLog, habits, oneshots, stats }
 */
export function computeMedalSummary(medal, data = {}) {
  if (!medal) return null;
  const { xpLog = [], completionLog = {}, habits = [], oneshots = [], stats = [] } = data;
  const snap = medal.snapshot || null;
  const monthPrefix = medalMonthPrefix(medal);

  // 1. XP del mese e attributo più sviluppato
  const monthLogs = (xpLog || []).filter((l) => l && l.date && l.date.startsWith(monthPrefix) && l.amount > 0);
  const totalMonthXp = monthLogs.reduce((acc, l) => acc + (l.amount || 0), 0);
  const statXp = {};
  monthLogs.forEach((l) => { if (l.statId) statXp[l.statId] = (statXp[l.statId] || 0) + l.amount; });
  const [topStatId, maxStatXp] = topByCount(statXp);
  let topStat = null;
  if (topStatId) {
    const live = (stats || []).find((s) => s.id === topStatId);
    if (live) topStat = { id: live.id, name: live.name, icon: live.icon };
    else if (snap?.topStat && snap.topStat.id === topStatId) topStat = snap.topStat;
    else if (medal.topStatName) topStat = { id: topStatId, name: medal.topStatName, icon: medal.topStatIcon || medal.icon };
  }

  // 2. Abitudine più rispettata
  const habitDays = {};
  Object.keys(completionLog || {}).forEach((dateStr) => {
    if (!dateStr.startsWith(monthPrefix)) return;
    (completionLog[dateStr]?.habits || []).forEach((hId) => { habitDays[hId] = (habitDays[hId] || 0) + 1; });
  });
  const [topHabitId, maxHabitCount] = topByCount(habitDays);
  let topHabit = null;
  if (topHabitId) {
    const live = (habits || []).find((h) => h.id === topHabitId);
    if (live) topHabit = { id: live.id, name: live.name, emoji: live.emoji };
    else if (snap?.topHabit && snap.topHabit.id === topHabitId) topHabit = snap.topHabit;
    else {
      const fromLog = topHabitFromXpLog(xpLog, monthPrefix);
      if (fromLog) topHabit = { id: topHabitId, name: fromLog.name, emoji: '📜' };
    }
  }

  // 3. Top 10 task completati (stelle più alte)
  const doneIds = new Set();
  Object.keys(completionLog || {}).forEach((dateStr) => {
    if (dateStr.startsWith(monthPrefix)) (completionLog[dateStr]?.oneshots || []).forEach((id) => doneIds.add(id));
  });
  const liveTasks = (oneshots || []).filter((o) => {
    if (!o || !o.completed) return false;
    if (doneIds.has(o.id)) return true;
    if (o.dailyPlanDate && o.dailyPlanDate.startsWith(monthPrefix)) return true;
    if (o.createdAt && o.createdAt.startsWith(monthPrefix)) return true;
    return false;
  }).map((o) => {
    const st = (stats || []).find((s) => s.id === o.primaryTarget);
    return { id: o.id, name: o.name, emoji: o.emoji, stars: taskStars(o), statIcon: st?.icon || null, statName: st?.name || null };
  });
  const allTaskIds = new Set((oneshots || []).map((o) => o && o.id));
  // dalla copia stampata: i task che non esistono più
  const keptTasks = (snap?.top10 || []).filter((t) => t && !allTaskIds.has(t.id));
  const tasks = [...liveTasks, ...keptTasks];
  tasks.sort((a, b) => (b.stars - a.stars) || String(a.name || '').localeCompare(String(b.name || '')));

  return {
    monthPrefix,
    totalMonthXp,
    topStat,
    maxStatXp,
    topHabit,
    maxHabitCount,
    top10: tasks.slice(0, 10)
  };
}

// Copia stampata da salvare nella medaglia
export function buildMedalSnapshot(medal, data) {
  const s = computeMedalSummary(medal, data);
  if (!s) return medal.snapshot || null;
  return {
    v: MEDAL_SNAPSHOT_VERSION,
    topStat: s.topStat,
    maxStatXp: s.maxStatXp,
    topHabit: s.topHabit,
    maxHabitCount: s.maxHabitCount,
    totalMonthXp: s.totalMonthXp,
    top10: s.top10
  };
}

export function snapshotMedals(medals, data) {
  if (!Array.isArray(medals) || medals.length === 0) return medals;
  return medals.map((m) => (m ? { ...m, snapshot: buildMedalSnapshot(m, data) } : m));
}

// Nome della medaglia nella lingua scelta (il nome salvato era scritto in italiano al momento della consegna)
export function medalDisplayName(medal) {
  const [yr, mo] = medalMonthPrefix(medal).split('-');
  const month = monthLong(parseInt(mo, 10) - 1) || '';
  return _t('Medaglia di {0}', `${month} ${yr || ''}`.trim());
}

export function medalMonthYear(medal) {
  const [yr, mo] = medalMonthPrefix(medal).split('-');
  return `${monthLong(parseInt(mo, 10) - 1) || ''} ${yr || ''}`.trim();
}
