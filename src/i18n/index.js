// Multilingua: i testi dell'interfaccia sono scritti in italiano direttamente nel codice
// e passano da _t("testo italiano"). In inglese si cerca la traduzione in en.json
// (chiave = testo italiano); se manca, resta l'italiano.
// Segnaposto: _t('Hai {0} missioni', n) → "Hai 3 missioni" / "You have 3 missions".
import en from './en.json';

const DICTIONARIES = { en };
let currentLang = 'it';

export function setLanguage(lang) {
  const next = lang === 'en' ? 'en' : 'it';
  if (next === currentLang) return;
  currentLang = next;
  try { document.documentElement.lang = next; } catch (_) { /* ambiente senza DOM */ }
}

export function getLanguage() {
  return currentLang;
}

// Locale per date e numeri (toLocaleDateString, Intl...)
export function getLocale() {
  return currentLang === 'en' ? 'en-GB' : 'it-IT';
}

export function _t(text, ...args) {
  if (typeof text !== 'string') return text;
  let out = text;
  if (currentLang !== 'it') {
    const dict = DICTIONARIES[currentLang];
    if (dict && typeof dict[text] === 'string' && dict[text] !== '') out = dict[text];
  }
  if (args.length) out = out.replace(/\{(\d+)\}/g, (m, i) => (args[i] !== undefined && args[i] !== null ? args[i] : ''));
  return out;
}

// Nomi brevi di giorni e mesi (in italiano identici a prima, in inglese abbreviazioni standard)
const DAYS_SHORT = {
  it: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
};
const MONTHS_LONG = {
  it: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
};
const MONTHS_SHORT = {
  it: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
};
export const dayShort = (dayIndex) => DAYS_SHORT[currentLang][dayIndex];
export const monthLong = (monthIndex) => MONTHS_LONG[currentLang][monthIndex];
export const monthShort = (monthIndex) => MONTHS_SHORT[currentLang][monthIndex];

// Nome del giocatore: quello predefinito ("Avventuriero", salvato nei dati di chi non l'ha cambiato)
// si mostra nella lingua scelta; un nome scelto dall'utente resta com'è
export const DEFAULT_PLAYER_NAME = 'Avventuriero';
export const playerDisplayName = (name) => {
  const n = (name || '').trim();
  return !n || n === DEFAULT_PLAYER_NAME ? _t(DEFAULT_PLAYER_NAME) : n;
};
