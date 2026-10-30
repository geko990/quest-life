// Acqua: calcoli della finestra "Registro Acqua" (grafica in src/components/WaterCarafe.jsx).
// Un bicchiere = 0,2 L (come nel resto della scheda Salute).

export const GLASS_L = 0.2;

const num = (v, fallback) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

// Quantità minima consigliata da bere al giorno, in bicchieri.
// Indicazione di massima, non medica:
// - fabbisogno d'acqua totale per kg di peso secondo l'età (35 ml fino a 30 anni, 33 fino a 55,
//   30 fino a 75, poi 25);
// - con un indice di massa corporea oltre 30 si usa il peso corrispondente a 30 (altezza),
//   per non gonfiare la stima;
// - +10% con attività moderata, +20% con attività intensa (livello del calcolo TDEE);
// - circa il 20% dell'acqua arriva dal cibo, quindi da bere ne resta l'80%;
// - mai sotto i valori di riferimento EFSA per le bevande (circa 2,0 L uomini, 1,6 L donne).
export function recommendedWater({ weight, height, age, gender, activity } = {}) {
  const w = num(weight, 75);
  const hM = num(height, 175) / 100;
  const a = num(age, 30);
  const act = num(activity, 1.375);
  const refWeight = hM > 1 ? Math.min(w, 30 * hM * hM) : w;
  const mlPerKg = a <= 30 ? 35 : a <= 55 ? 33 : a <= 75 ? 30 : 25;
  let totalMl = refWeight * mlPerKg;
  if (act >= 1.725) totalMl *= 1.2;
  else if (act >= 1.55) totalMl *= 1.1;
  const drinkMl = totalMl * 0.8;
  const floorMl = gender === 'female' ? 1600 : 2000;
  const ml = Math.max(floorMl, drinkMl);
  const glasses = Math.ceil(ml / (GLASS_L * 1000));
  return { glasses, liters: Math.round(glasses * GLASS_L * 10) / 10 };
}

// Capienza della caraffa in bicchieri: l'obiettivo sta a circa 3/4 dell'altezza,
// sopra resta la "zona extra" per quello che si beve in più.
export function carafeCapacity(goal) {
  const g = Math.max(1, Math.round(num(goal, 8)));
  return Math.max(g + 2, Math.ceil(g * 1.3));
}

export const glassesToLiters = (g) => Math.round((Number(g) || 0) * GLASS_L * 10) / 10;

// Stato rispetto all'obiettivo: 'below' | 'goal' | 'extra'
export function waterStatus(glasses, goal) {
  const g = Number(glasses) || 0;
  const t = Math.max(1, Number(goal) || 1);
  if (g < t) return { kind: 'below', missing: t - g };
  if (g === t) return { kind: 'goal', missing: 0 };
  return { kind: 'extra', extra: g - t };
}
