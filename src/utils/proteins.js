// Proteine: calcoli della finestra "Apporto Proteico" (grafica in src/components/ProteinFood.jsx e ProteinPanel.jsx).
// Le proteine sono un minimo da raggiungere: il cibo si "consuma" fino all'osso / alla ciotola vuota,
// oltre l'obiettivo compare un boccone extra dorato (non è un errore).

const num = (v, fallback) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const PROTEIN_SNAP = 5;     // il dito sul cibo si aggancia a blocchi di 5 g
export const QUICK_PROTEIN = 10;   // + / − dei pulsanti
export const PROTEIN_GOAL_STEP = 5;

// Grammi per kg di peso corporeo secondo l'obiettivo fisico (indicazione di massima, non medica):
// mantenimento 1,2 g/kg; dimagrimento 1,6 g/kg (aiuta a conservare la massa magra in deficit);
// massa muscolare 1,8 g/kg. Le linee guida per la popolazione partono da 0,8–0,9 g/kg;
// chi si allena regolarmente sta di solito tra 1,4 e 2 g/kg.
export const PROTEIN_PER_KG = { maintain: 1.2, lose: 1.6, gain: 1.8 };

export function recommendedProtein({ weight, goalType } = {}) {
  const w = num(weight, 75);
  const perKg = PROTEIN_PER_KG[goalType] || PROTEIN_PER_KG.maintain;
  return { grams: Math.round((w * perKg) / PROTEIN_GOAL_STEP) * PROTEIN_GOAL_STEP, perKg };
}

export function proteinStatus(grams, goal) {
  const g = Math.round((Number(grams) || 0) * 10) / 10;
  const t = Math.max(1, Number(goal) || 1);
  if (g < t) return { kind: 'below', missing: Math.round((t - g) * 10) / 10 };
  if (g === t) return { kind: 'goal', missing: 0 };
  return { kind: 'extra', extra: Math.round((g - t) * 10) / 10 };
}

export const fmtGrams = (n) => {
  const v = Math.round((Number(n) || 0) * 10) / 10;
  return Number.isInteger(v) ? String(v) : String(v).replace('.', ',');
};
