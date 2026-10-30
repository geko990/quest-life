// L'app che cresce con il giocatore (#62): quali aree si vedono a ogni livello. Un solo posto che decide,
// usato da barra in basso, Home, Missioni, Opzioni e celebrazioni. Solo dati e regole, niente grafica
// (riusabile nell'app nativa, #24). Le aree non ancora aperte sono solo nascoste: i dati restano.
//   Lv 1: Eroe (le missioni singole stanno nella Home, sotto il radar), Abitudini, Opzioni
//   Lv 2: Salute (con la Spesa) e la scheda Missioni; nella Home Concentrazione (Pomodoro) e Sostentamento
//   Lv 3: Tesoro (doppio tocco su Opzioni)
//   Lv 4: Azioni del Giorno ("È il tuo turno!") e Giornate tipo
//   Lv 5: Campagne e Sfide
// settings.unlockAll ("Sblocca tutto" in Opzioni) mostra tutto; togliendolo l'app torna a seguire il livello.
// Chi aveva già dati prima della 278 parte con unlockAll acceso (vedi sanitizeState).
export const UNLOCK_LEVEL = {
  missions: 2,
  nutrition: 2,
  shopping: 2,
  finances: 3,
  dailyActions: 4,
  quests: 5,
};

export function canUse(feature, level, settings) {
  if (!settings || settings.unlockAll !== false) return true;
  const need = UNLOCK_LEVEL[feature];
  return !need || (level || 1) >= need;
}

// Testi della medaglia del livello ("Hai sbloccato"): nome dell'area e descrizione breve
export const LANDS = [
  { level: 2, feature: 'nutrition', emoji: '🍎', name: 'Diario della salute', text: 'Acqua, passi e calorie, giorno per giorno. E le tue Missioni hanno ora una scheda tutta loro.' },
  { level: 3, feature: 'finances', emoji: '💰', name: "Tesoro dell'Eroe", text: 'Conti, spese e risparmi. Si nasconde dietro Opzioni: tocca due volte.' },
  { level: 4, feature: 'dailyActions', emoji: '🎲', name: 'Azioni del Giorno', text: 'Ogni giorno 4 azioni, come i turni di un gioco di ruolo, e un D10 per il bonus.' },
  { level: 5, feature: 'quests', emoji: '🏆', name: 'Campagne e Sfide', text: "Obiettivi lunghi, passo dopo passo, in Missioni. Da adesso l'app è tutta aperta: ogni area è tua." },
];

// Aree che si aprono passando da un livello all'altro (nessuna con "Sblocca tutto")
export function landsBetween(fromLevel, toLevel, settings) {
  if (!settings || settings.unlockAll !== false) return [];
  return LANDS.filter(l => l.level > fromLevel && l.level <= toLevel);
}

// Area aperta ma non ancora visitata: pallino sulla barra e mini missione alla prima visita
export function isFresh(feature, level, settings) {
  if (!settings || settings.unlockAll !== false) return false;
  return canUse(feature, level, settings) && !!UNLOCK_LEVEL[feature] && !(settings.seenLands || {})[feature];
}

// Sfide proposte alla prima visita delle Campagne: id dei modelli in CHALLENGE_TEMPLATES (constants.js)
export const FIRST_CHALLENGES = 3;
