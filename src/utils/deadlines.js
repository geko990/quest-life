import { _t, getLocale } from '../i18n';
// Scadenze di task e campagne.
// - Promemoria scelti dall'utente (quanti vuole): es. 1 settimana, 1 giorno e 3 ore prima.
// - Stato: 'attention' (arancione) dal primo promemoria, 'due' (rosso) dal giorno prima della scadenza,
//   'overdue' (rosso) dopo la scadenza. Pallino rosso e numero sull'icona seguono lo stesso stato.
// Limite di una PWA: le notifiche partono solo mentre l'app è aperta o in background da poco.

const MINUTE = 60000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const FIRED_KEY = 'questlife_fired_reminders';

export const REMINDER_UNITS = {
  minutes: { ms: MINUTE, it: ['minuto', 'minuti'], en: ['minute', 'minutes'] },
  hours: { ms: HOUR, it: ['ora', 'ore'], en: ['hour', 'hours'] },
  days: { ms: DAY, it: ['giorno', 'giorni'], en: ['day', 'days'] },
  weeks: { ms: 7 * DAY, it: ['settimana', 'settimane'], en: ['week', 'weeks'] }
};

export const DEFAULT_REMINDERS = [{ value: 1, unit: 'days' }];

// Preferenze correnti (impostate da App a ogni render, come la lingua)
let currentPrefs = {};
export function setReminderPrefs(prefs) {
  currentPrefs = prefs || {};
}

// Elenco promemoria: nuovo formato { offsets: [...] }, oppure migrazione dal vecchio (1 giorno / 1 ora)
export function getReminderOffsets(prefs = currentPrefs) {
  if (Array.isArray(prefs?.offsets)) return prefs.offsets.filter(o => REMINDER_UNITS[o.unit] && Number(o.value) > 0);
  const legacy = [];
  if (prefs?.dayBefore !== false) legacy.push({ value: 1, unit: 'days' });
  if (prefs?.hourBefore !== false && prefs?.dayBefore !== undefined) legacy.push({ value: 1, unit: 'hours' });
  return legacy.length ? legacy : DEFAULT_REMINDERS;
}

export const offsetMs = (o) => Number(o.value) * REMINDER_UNITS[o.unit].ms;

// Solo l'unità con "prima": "giorni prima" / "days before"
export function unitLabel(unit, n = 2) {
  const lang = getLocale().startsWith('en') ? 'en' : 'it';
  const names = REMINDER_UNITS[unit][lang];
  return `${n === 1 ? names[0] : names[1]} ${lang === 'en' ? 'before' : 'prima'}`;
}

export function formatReminder(o) {
  const lang = getLocale().startsWith('en') ? 'en' : 'it';
  const names = REMINDER_UNITS[o.unit][lang];
  const n = Number(o.value);
  return lang === 'en' ? `${n} ${n === 1 ? names[0] : names[1]} before` : `${n} ${n === 1 ? names[0] : names[1]} prima`;
}

// Momento di scadenza: data + ora se indicata, altrimenti fine giornata (23:59)
export function getDueAt(item) {
  if (!item?.dueDate) return null;
  const time = item.dueTime && /^\d{1,2}:\d{2}$/.test(item.dueTime) ? item.dueTime : '23:59';
  const d = new Date(`${item.dueDate}T${time.padStart(5, '0')}:00`);
  return isNaN(d.getTime()) ? null : d;
}

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

// 'overdue' | 'due' (dal giorno prima della scadenza) | 'attention' (dal primo promemoria) | 'later' | null
export function getDueStatus(item, now = new Date(), prefs = currentPrefs) {
  if (!item || item.completed) return null;
  const dueAt = getDueAt(item);
  if (!dueAt) return null;
  const nowMs = now.getTime();
  if (nowMs > dueAt.getTime()) return 'overdue';
  if (startOfDay(dueAt) - startOfDay(now) <= DAY) return 'due';
  const earliest = Math.max(0, ...getReminderOffsets(prefs).map(offsetMs));
  if (nowMs >= dueAt.getTime() - earliest) return 'attention';
  return 'later';
}

// Posto delle missioni in scadenza nell'elenco (#72). Si spostano UNA volta per stato e poi restano
// dove sono: se l'utente le trascina altrove, non si rimettono in cima.
// - arancione (dal primo promemoria): in cima, appena sotto le missioni del giorno (e le rosse);
// - rossa (dal giorno prima della scadenza): sopra tutto, anche sopra le missioni del giorno.
// Tra più missioni spostate, prima quella che scade prima. Il segno sta in `dueBump`
// ({ level, due }): se la scadenza cambia, il segno non vale più e la missione può risalire.
// Restituisce lo stesso array se non c'è niente da spostare.
const BUMP_RANK = { attention: 1, urgent: 2 };
const bumpLevel = (item, now, prefs) => {
  const st = getDueStatus(item, now, prefs);
  if (st === 'overdue' || st === 'due') return 'urgent';
  if (st === 'attention') return 'attention';
  return null;
};
const dueKey = (item) => `${item.dueDate || ''}T${item.dueTime || ''}`;

export function promoteDueItems(list = [], { todayStr, now = new Date(), prefs = currentPrefs } = {}) {
  if (!Array.isArray(list) || !list.length) return list;
  const isOpen = (o) => o && !o.completed && !o.locked;
  const isToday = (o) => !!todayStr && o.fromDailyPlan && o.dailyPlanDate === todayStr;
  const dueMs = (o) => getDueAt(o)?.getTime() ?? Infinity;
  const levelOf = (o) => (isOpen(o) ? bumpLevel(o, now, prefs) : null);
  const bumpedRank = (o) => (o.dueBump && o.dueBump.due === dueKey(o) ? BUMP_RANK[o.dueBump.level] || 0 : 0);

  let items = list;
  let changed = false;
  // Prima le rosse, poi le arancioni; a parità, chi scade prima
  const toMove = list
    .filter(o => { const lv = levelOf(o); return lv && BUMP_RANK[lv] > bumpedRank(o); })
    .sort((a, b) => BUMP_RANK[levelOf(b)] - BUMP_RANK[levelOf(a)] || dueMs(a) - dueMs(b));

  for (const target of toMove) {
    const level = levelOf(target);
    const rest = items.filter(o => o.id !== target.id);
    // Si scorre dall'alto finché si trovano elementi che devono restare sopra
    let at = 0;
    while (at < rest.length) {
      const o = rest[at];
      if (!isOpen(o)) { at++; continue; }
      const lv = levelOf(o);
      const placedAbove = lv === 'urgent' && bumpedRank(o) >= 2 ? dueMs(o) <= dueMs(target)
        : level === 'attention' && (lv === 'urgent' || isToday(o) || (lv === 'attention' && bumpedRank(o) >= 1 && dueMs(o) <= dueMs(target)));
      if (!placedAbove) break;
      at++;
    }
    const moved = { ...target, dueBump: { level, due: dueKey(target) } };
    items = [...rest.slice(0, at), moved, ...rest.slice(at)];
    changed = true;
  }
  return changed ? items : list;
}

// Etichetta breve per la data: Scaduta / Oggi / Domani / data
export function getDueLabel(item, now = new Date()) {
  const dueAt = getDueAt(item);
  if (!dueAt) return '';
  if (!item.completed && now.getTime() > dueAt.getTime()) return _t("Scaduta");
  const days = Math.round((startOfDay(dueAt) - startOfDay(now)) / DAY);
  const time = item.dueTime ? ` ${item.dueTime}` : '';
  if (days === 0) return _t("Oggi") + time;
  if (days === 1) return _t("Domani") + time;
  return new Date(item.dueDate + 'T00:00:00').toLocaleDateString(getLocale(), { day: 'numeric', month: 'short' }) + time;
}

// Elementi da evidenziare adesso (pallino rosso e numero sull'icona)
export function getUrgentItems(oneshots = [], quests = [], now = new Date()) {
  return [...oneshots, ...quests].filter(item => ['overdue', 'due', 'attention'].includes(getDueStatus(item, now)));
}

export function updateAppBadge(count) {
  try {
    if (count > 0 && navigator.setAppBadge) navigator.setAppBadge(count).catch(() => {});
    else if (navigator.clearAppBadge) navigator.clearAppBadge().catch(() => {});
  } catch (_) { /* non supportato */ }
}

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  try {
    return await Notification.requestPermission();
  } catch (_) {
    return 'denied';
  }
}

async function showLocalNotification(title, body, tag) {
  const options = { body, tag, icon: './icon.png', badge: './icon.png' };
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return;
      }
    }
    new Notification(title, options);
  } catch (_) { /* notifiche non disponibili */ }
}

const readFired = () => {
  try { return JSON.parse(localStorage.getItem(FIRED_KEY) || '{}') || {}; } catch (_) { return {}; }
};
const writeFired = (fired) => {
  try { localStorage.setItem(FIRED_KEY, JSON.stringify(fired)); } catch (_) { /* spazio pieno */ }
};

const fmtWhen = (dueAt, hasTime) =>
  dueAt.toLocaleDateString(getLocale(), { weekday: 'short', day: 'numeric', month: 'short' }) +
  (hasTime ? ` ${dueAt.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' })}` : '');

// Invia i promemoria dovuti (una sola volta ciascuno)
export function checkDeadlineReminders(oneshots = [], quests = [], prefs = currentPrefs, now = new Date()) {
  if (!prefs?.enabled || !notificationsSupported() || Notification.permission !== 'granted') return;
  const fired = readFired();
  const nowMs = now.getTime();
  const offsets = getReminderOffsets(prefs);
  let changed = false;

  for (const item of [...oneshots, ...quests]) {
    if (item.completed) continue;
    const dueAt = getDueAt(item);
    if (!dueAt) continue;
    const dueMs = dueAt.getTime();
    if (dueMs < nowMs) continue;

    // Se più promemoria sono già passati (es. app chiusa), si invia solo il più recente
    const due = offsets
      .map(o => ({ o, at: dueMs - offsetMs(o), key: `${item.id}|${o.value}${o.unit}|${dueMs}` }))
      .filter(r => nowMs >= r.at && !fired[r.key])
      .sort((a, b) => b.at - a.at);
    if (!due.length) continue;
    for (const r of due) fired[r.key] = nowMs;
    changed = true;
    showLocalNotification(
      `${item.emoji || '⚔️'} ${item.name}`,
      `${_t("Scadenza")}: ${fmtWhen(dueAt, !!item.dueTime)}`,
      due[0].key
    );
  }

  // Pulizia: dimentica i promemoria più vecchi di 60 giorni
  for (const [k, t] of Object.entries(fired)) {
    if (nowMs - t > 60 * DAY) { delete fired[k]; changed = true; }
  }
  if (changed) writeFired(fired);
}
