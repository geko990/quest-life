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

// Colori delle "carte": i conti secondari prendono un colore stabile dal proprio id.
const CARD_THEMES = {
  base: { from: '#1d4ed8', via: '#312e81', to: '#0b1023', glow: 'rgba(96, 165, 250, 0.55)', accent: '#bfdbfe' },
  cash: { from: '#059669', via: '#14532d', to: '#04140c', glow: 'rgba(52, 211, 153, 0.5)', accent: '#bbf7d0' },
};
const SECONDARY_THEMES = [
  { from: '#7c3aed', via: '#3b0764', to: '#0f0720', glow: 'rgba(167, 139, 250, 0.55)', accent: '#ddd6fe' },
  { from: '#e11d48', via: '#4c0519', to: '#14040a', glow: 'rgba(251, 113, 133, 0.5)', accent: '#fecdd3' },
  { from: '#0d9488', via: '#134e4a', to: '#031614', glow: 'rgba(45, 212, 191, 0.5)', accent: '#ccfbf1' },
  { from: '#d97706', via: '#78350f', to: '#170a02', glow: 'rgba(251, 191, 36, 0.5)', accent: '#fde68a' },
  { from: '#475569', via: '#1e293b', to: '#05070c', glow: 'rgba(148, 163, 184, 0.5)', accent: '#e2e8f0' },
  { from: '#0284c7', via: '#0c4a6e', to: '#020c16', glow: 'rgba(56, 189, 248, 0.5)', accent: '#bae6fd' },
];

export function getAccountCardTheme(accId) {
  if (CARD_THEMES[accId]) return CARD_THEMES[accId];
  let h = 0;
  for (const ch of String(accId)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return SECONDARY_THEMES[h % SECONDARY_THEMES.length];
}

/** Interessi di un periodo per un conto secondario, secondo la frequenza scelta. */
export function getPeriodInterest(account) {
  const freq = account.interestFrequency || 'monthly';
  const divisor = freq === 'daily' ? 365 : freq === 'quarterly' ? 4 : freq === 'annual' ? 1 : 12;
  return round2(((Number(account.balance) || 0) * ((Number(account.interestRate) || 0) / 100)) / divisor);
}
