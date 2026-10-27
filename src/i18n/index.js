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
