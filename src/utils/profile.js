// Profilo del giocatore (Opzioni → "Il tuo profilo"): dati di base e obiettivi fisici, in un solo posto.
// I dati restano dove l'app li ha sempre tenuti (health.calcGender, calcAge, calcHeight, calcActivity,
// calcGoalType, weight.current, weight.target, diet), così la finestra "Obiettivi di Salute" e le
// finestre di acqua, passi e proteine leggono e scrivono gli stessi valori. Solo logica, niente grafica (#24).

import { recommendedWater } from './hydration.js';
import { recommendedSteps } from './steps.js';
import { recommendedProtein } from './proteins.js';

export const DIETS = [
  { id: 'omnivore', label: 'Onnivora', emoji: '🍗' },
  { id: 'vegetarian', label: 'Vegetariana', emoji: '🥚' },
  { id: 'vegan', label: 'Vegana', emoji: '🫘' },
];

// Icona delle proteine secondo l'alimentazione (tessera Proteine, riepilogo del giorno, finestre)
export function dietEmoji(diet) {
  return (DIETS.find(d => d.id === diet) || DIETS[0]).emoji;
}

export const SEXES = [
  { id: 'male', label: 'Uomo' },
  { id: 'female', label: 'Donna' },
];

export const ACTIVITY_LEVELS = [
  { value: 1.2, label: 'Sedentaria', desc: 'Poco o nessun esercizio' },
  { value: 1.375, label: 'Leggera', desc: '1–3 allenamenti a settimana' },
  { value: 1.55, label: 'Moderata', desc: '3–5 allenamenti a settimana' },
  { value: 1.725, label: 'Intensa', desc: '6–7 allenamenti a settimana' },
];

export const GOAL_TYPES = [
  { id: 'lose', label: 'Dimagrire' },
  { id: 'maintain', label: 'Mantenere' },
  { id: 'gain', label: 'Massa' },
];

const num = (v, fallback) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

// Profilo letto dallo stato della Salute, con i valori predefiniti di sempre
export function getProfile(health = {}) {
  return {
    sex: health.calcGender === 'female' ? 'female' : 'male',
    age: num(health.calcAge, 28),
    height: num(health.calcHeight, 175),
    weight: num(health?.weight?.current, 75),
    targetWeight: num(health?.weight?.target, 70),
    fatPct: num(health?.weight?.currentFat, 0),
    activity: num(health.calcActivity, 1.375),
    goalType: ['lose', 'maintain', 'gain'].includes(health.calcGoalType) ? health.calcGoalType : 'lose',
    diet: DIETS.some(d => d.id === health.diet) ? health.diet : 'omnivore',
    hasData: health.calcAge !== undefined || health.calcHeight !== undefined,
  };
}

// Scrive un campo del profilo nello stato della Salute (stessi campi di sempre)
export function applyProfileField(health, field, value) {
  const h = { ...health };
  switch (field) {
    case 'sex': h.calcGender = value === 'female' ? 'female' : 'male'; break;
    case 'age': h.calcAge = Math.round(num(value, 28)); break;
    case 'height': h.calcHeight = Math.round(num(value, 175)); break;
    case 'activity': h.calcActivity = num(value, 1.375); break;
    case 'goalType': h.calcGoalType = value; break;
    case 'diet': h.diet = value; break;
    case 'weight': h.weight = { ...(h.weight || {}), current: Math.round(num(value, 75) * 10) / 10 }; break;
    case 'targetWeight': h.weight = { ...(h.weight || {}), target: Math.round(num(value, 70) * 10) / 10 }; break;
    default: break;
  }
  return h;
}

// Fabbisogno e obiettivi giornalieri consigliati dal profilo
// (stessa formula della finestra "Obiettivi di Salute": Katch-McArdle con la % di grasso, altrimenti Mifflin-St Jeor)
export function computeGoals(p) {
  let bmr, method;
  if (p.fatPct > 0 && p.fatPct < 60) {
    const lbm = p.weight * (1 - p.fatPct / 100);
    bmr = 370 + 21.6 * lbm;
    method = 'Katch-McArdle';
  } else {
    bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'female' ? -161 : 5);
    method = 'Mifflin-St Jeor';
  }
  const tdee = Math.round(bmr * p.activity);
  const factor = p.goalType === 'lose' ? 0.82 : p.goalType === 'gain' ? 1.12 : 1;
  const calories = Math.round((tdee * factor) / 10) * 10;
  const proteins = recommendedProtein({ weight: p.weight, goalType: p.goalType }).grams;
  const water = recommendedWater({ weight: p.weight, height: p.height, age: p.age, gender: p.sex, activity: p.activity }).glasses;
  const steps = recommendedSteps({ age: p.age, goalType: p.goalType });
  return { bmr: Math.round(bmr), tdee, method, calories, proteins, water, steps };
}

// Normalizzazione dei campi del profilo per sanitizeState (dati vecchi senza dieta, valori strani)
export function sanitizeProfileFields(health) {
  if (!health) return health;
  if (!DIETS.some(d => d.id === health.diet)) health.diet = 'omnivore';
  if (health.calcGender !== undefined && !['male', 'female'].includes(health.calcGender)) health.calcGender = 'male';
  return health;
}
