// Logica dei singoli conti del Tesoro (separata dalla grafica, vedi Roadmap #24).
// Un conto è identificato da 'base', 'cash' o dall'id di un conto secondario.

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const txSortKey = (t) => `${t.date || ''}|${String(t.timestamp || 0).padStart(15, '0')}`;

/**
 * Movimenti che toccano un conto, dal più recente.
 * Ogni voce riceve `flow`: importo con segno (+ entra nel conto, - esce).
 * I trasferimenti compaiono sia nel conto di partenza (uscita) sia in quello di arrivo (entrata).
 */
export function getAccountMovements(transactions, accId) {
  const out = [];
  for (const t of transactions || []) {
    const amount = Number(t.amount) || 0;
    if (t.type === 'transfer') {
      // Stessa lettura di handleDeleteTransaction in FinancesTab
      const src = t.sourceAccount || 'base';
      const dst = t.targetAccount || t.account || 'cash';
      if (src === accId && dst === accId) continue;
      if (src === accId) out.push({ ...t, flow: -amount, direction: 'out' });
      else if (dst === accId) out.push({ ...t, flow: amount, direction: 'in' });
      continue;
    }
    if ((t.account || 'base') !== accId) continue;
    out.push({ ...t, flow: t.type === 'income' ? amount : -amount, direction: t.type === 'income' ? 'in' : 'out' });
  }
  out.sort((a, b) => (txSortKey(a) < txSortKey(b) ? 1 : -1));
  return out;
}

/** Entrate, uscite e saldo netto del mese (`monthPrefix` = 'AAAA-MM'). */
export function getAccountMonthStats(movements, monthPrefix) {
  let inflow = 0;
  let outflow = 0;
  for (const m of movements) {
    if (!m.date || !m.date.startsWith(monthPrefix)) continue;
    if (m.flow >= 0) inflow += m.flow;
    else outflow += -m.flow;
  }
  return { inflow: round2(inflow), outflow: round2(outflow), net: round2(inflow - outflow) };
}

/** Raggruppa i movimenti per giorno, mantenendo l'ordine. */
export function groupMovementsByDay(movements) {
  const groups = [];
  for (const m of movements) {
    const last = groups[groups.length - 1];
    if (last && last.date === m.date) last.items.push(m);
    else groups.push({ date: m.date, items: [m] });
  }
  return groups;
}

// Colori delle "carte" (#59). Ogni colore ha una versione pastello per il tema chiaro
// [da, a, macchia di luce, inchiostro] e una profonda per il tema scuro [da, a, alone, testo tenue].
// Il conto sceglie il colore in `finances.cardColors[accId]`; senza scelta: base azzurro,
// contanti menta, conti secondari un colore stabile ricavato dall'id.
export const CARD_COLORS = [
  { id: 'sky',      light: ['#dbe4ff', '#c3d0ff', '#a5b8ff', '#1e2a78'], dark: ['#2f4fd8', '#16154a', 'rgba(96, 165, 250, 0.5)', '#c7d7fe'] },
  { id: 'lavender', light: ['#ece4ff', '#d6cbff', '#b9a8ff', '#3b1f86'], dark: ['#6d3ae0', '#22104f', 'rgba(167, 139, 250, 0.5)', '#ddd6fe'] },
  { id: 'mint',     light: ['#d9f7e6', '#bfefd4', '#8fe3b5', '#14532d'], dark: ['#0f8f63', '#052e1c', 'rgba(52, 211, 153, 0.45)', '#bbf7d0'] },
  { id: 'aqua',     light: ['#d4f4f6', '#b4e9ee', '#84d8e0', '#134e57'], dark: ['#0e8a96', '#042b31', 'rgba(45, 212, 191, 0.45)', '#ccfbf1'] },
  { id: 'peach',    light: ['#ffe6d5', '#ffd2b5', '#ffb48a', '#7a2e0b'], dark: ['#c2531a', '#3a1306', 'rgba(251, 146, 60, 0.45)', '#fed7aa'] },
  { id: 'rose',     light: ['#ffe3ec', '#ffcadb', '#ffa3bf', '#831843'], dark: ['#be2a68', '#3b0a21', 'rgba(244, 114, 182, 0.45)', '#fbcfe8'] },
  { id: 'butter',   light: ['#fff3c9', '#ffe7a1', '#ffd469', '#6b3d0c'], dark: ['#b7791f', '#2e1a05', 'rgba(251, 191, 36, 0.45)', '#fde68a'] },
  { id: 'stone',    light: ['#eeecf3', '#dcd8e6', '#c4bfd4', '#2a2540'], dark: ['#4b5670', '#0c111d', 'rgba(148, 163, 184, 0.45)', '#e2e8f0'] },
];
const COLOR_BY_ID = Object.fromEntries(CARD_COLORS.map(c => [c.id, c]));
const SECONDARY_DEFAULTS = ['lavender', 'peach', 'rose', 'aqua', 'butter', 'stone'];

export const isCardColorId = (id) => typeof id === 'string' && Boolean(COLOR_BY_ID[id]);

/** Colore della carta di un conto: quello scelto, altrimenti quello predefinito. */
export function getAccountCardColor(accId, cardColors) {
  const chosen = cardColors && cardColors[accId];
  if (isCardColorId(chosen)) return chosen;
  if (accId === 'base') return 'sky';
  if (accId === 'cash') return 'mint';
  let h = 0;
  for (const ch of String(accId)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return SECONDARY_DEFAULTS[h % SECONDARY_DEFAULTS.length];
}

/** Variabili CSS di un colore, da mettere nello `style` della carta (il CSS sceglie chiaro o scuro). */
export function getCardColorVars(colorId) {
  const c = COLOR_BY_ID[colorId] || COLOR_BY_ID.sky;
  return {
    '--cl-a': c.light[0], '--cl-b': c.light[1], '--cl-blob': c.light[2], '--cl-ink': c.light[3],
    '--cd-a': c.dark[0], '--cd-b': c.dark[1], '--cd-glow': c.dark[2], '--cd-soft': c.dark[3],
  };
}

/** Primo colore non ancora usato dai conti (per proporlo a un conto nuovo). */
export function suggestCardColor(accountIds, cardColors) {
  const used = new Set(accountIds.map(id => getAccountCardColor(id, cardColors)));
  return SECONDARY_DEFAULTS.find(id => !used.has(id)) || SECONDARY_DEFAULTS[0];
}

/** Pulizia per sanitizeState: solo chiavi testuali e colori esistenti. */
export function sanitizeCardColors(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (typeof k === 'string' && k.length <= 64 && isCardColorId(v)) out[k] = v;
  }
  return out;
}

/** Interessi di un periodo per un conto secondario, secondo la frequenza scelta. */
export function getPeriodInterest(account) {
  const freq = account.interestFrequency || 'monthly';
  const divisor = freq === 'daily' ? 365 : freq === 'quarterly' ? 4 : freq === 'annual' ? 1 : 12;
  return round2(((Number(account.balance) || 0) * ((Number(account.interestRate) || 0) / 100)) / divisor);
}
