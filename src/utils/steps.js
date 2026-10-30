// Passi: calcoli della finestra "Registro Passi" (grafica in src/components/StepsTrail.jsx e StepsPanel.jsx).

const num = (v, fallback) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const STEP_SNAP = 250;      // il dito sul sentiero si aggancia a blocchi di 250 passi
export const QUICK_STEPS = 1000;   // + / − dei pulsanti
export const GOAL_STEP = 500;      // passo dell'obiettivo

// Minimo consigliato di passi al giorno. Indicazione di massima, non medica:
// i grandi studi sui passi (es. meta-analisi su Lancet Public Health, 2022) vedono benefici che crescono
// fino a circa 8.000–10.000 passi sotto i 60 anni e 6.000–8.000 dai 60 in su.
// Si propone la parte bassa della fascia, +1.500 se l'obiettivo è dimagrire (stesso campo del calcolo TDEE).
export function recommendedSteps({ age, goalType } = {}) {
  const a = num(age, 30);
  let s = a >= 60 ? 7000 : 8000;
  if (goalType === 'lose') s += 1500;
  return s;
}

// Lunghezza del sentiero in passi: la vetta (obiettivo) e poi la cresta fino alla cima più alta,
// circa 1,3 volte l'obiettivo, arrotondata a 500.
export function trailCapacity(goal) {
  const g = Math.max(GOAL_STEP, num(goal, 8000));
  return Math.max(g + 2000, Math.ceil((g * 1.3) / GOAL_STEP) * GOAL_STEP);
}

// Distanza e calorie stimate (circa): falcata ≈ 41,5% dell'altezza; ~0,5 kcal per kg ogni 1.000 passi
export function stepsToKm(steps, heightCm) {
  const h = num(heightCm, 175);
  return (Number(steps) || 0) * h * 0.415 / 100000;
}
export function stepsToKcal(steps, weightKg) {
  const w = num(weightKg, 75);
  return Math.round((Number(steps) || 0) / 1000 * 0.5 * w);
}

export function stepsStatus(steps, goal) {
  const s = Number(steps) || 0;
  const g = Math.max(1, Number(goal) || 1);
  if (s < g) return { kind: 'below', missing: g - s };
  if (s === g) return { kind: 'goal', missing: 0 };
  return { kind: 'extra', extra: s - g };
}
