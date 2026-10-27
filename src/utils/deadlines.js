import { _t, getLocale } from '../i18n';
// Scadenze di task e campagne: stato (scaduta, tra poco, oggi, domani), contatori per
// pallini rossi e numero sull'icona, promemoria locali (1 giorno / 1 ora prima).
// Limite di una PWA: i promemoria partono solo mentre l'app è aperta o in background da poco.

const HOUR = 3600000;
const DAY = 24 * HOUR;
const FIRED_KEY = 'questlife_fired_reminders';

// Momento di scadenza: data + ora se indicata, altrimenti fine giornata (23:59)
export function getDueAt(item) {
  if (!item?.dueDate) return null;
  const time = item.dueTime && /^\d{1,2}:\d{2}$/.test(item.dueTime) ? item.dueTime : '23:59';
  const d = new Date(`${item.dueDate}T${time.padStart(5, '0')}:00`);
  return isNaN(d.getTime()) ? null : d;
}

const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// 'overdue' | 'soon' (entro 1 ora) | 'today' | 'tomorrow' | 'later' | null
export function getDueStatus(item, now = new Date()) {
  if (!item || item.completed) return null;
  const dueAt = getDueAt(item);
  if (!dueAt) return null;
  const diff = dueAt.getTime() - now.getTime();
  if (diff < 0) return 'overdue';
  if (item.dueTime && diff <= HOUR) return 'soon';
  if (sameDay(dueAt, now)) return 'today';
  if (sameDay(dueAt, new Date(now.getTime() + DAY))) return 'tomorrow';
  return 'later';
}

// Elementi che meritano attenzione adesso: scaduti, entro un'ora, in scadenza oggi
export function getUrgentItems(oneshots = [], quests = [], now = new Date()) {
  return [...oneshots, ...quests].filter(item => ['overdue', 'soon', 'today'].includes(getDueStatus(item, now)));
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
  (hasTime ? ` alle ${dueAt.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' })}` : '');

// Invia i promemoria dovuti (una sola volta ciascuno). prefs: { enabled, dayBefore, hourBefore }
export function checkDeadlineReminders(oneshots = [], quests = [], prefs = {}, now = new Date()) {
  if (!prefs?.enabled || !notificationsSupported() || Notification.permission !== 'granted') return;
  const fired = readFired();
  const nowMs = now.getTime();
  let changed = false;

  for (const item of [...oneshots, ...quests]) {
    if (item.completed) continue;
    const dueAt = getDueAt(item);
    if (!dueAt) continue;
    const dueMs = dueAt.getTime();
    if (dueMs < nowMs) continue;

    const reminders = [];
    if (prefs.dayBefore !== false) reminders.push({ type: '1g', at: dueMs - DAY, text: _t("Scade domani") });
    if (prefs.hourBefore !== false && item.dueTime) reminders.push({ type: '1h', at: dueMs - HOUR, text: _t("Scade tra meno di un'ora") });

    for (const r of reminders) {
      const key = `${item.id}|${r.type}|${dueMs}`;
      if (fired[key] || nowMs < r.at) continue;
      fired[key] = nowMs;
      changed = true;
      showLocalNotification(
        `${item.emoji || '⚔️'} ${item.name}`,
        `${r.text} · ${fmtWhen(dueAt, !!item.dueTime)}`,
        key
      );
    }
  }

  // Pulizia: dimentica i promemoria più vecchi di 30 giorni
  for (const [k, t] of Object.entries(fired)) {
    if (nowMs - t > 30 * DAY) { delete fired[k]; changed = true; }
  }
  if (changed) writeFired(fired);
}
