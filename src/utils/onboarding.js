// Benvenuto per chi apre l'app la prima volta (#58): dati e regole, niente grafica
// (riusabile nell'app nativa, #24). La grafica è in src/components/Onboarding.jsx.
import { _t } from '../i18n';

// Prime icone (mondo del gioco e mondo reale, persone senza genere) e altre nel pannello "+ altre"
export const AVATAR_CHOICES = ['🧙', '🦸', '🥷', '🧝', '🧑‍🎤', '🧑‍🎨', '🧑‍💻'];
export const AVATAR_GROUPS = [
  { title: 'Mestieri', emojis: ['🧑‍🎤', '🎭', '🧑‍🎨', '🧑‍💻', '🧑‍🔬', '🧑‍🏫', '🧑‍⚕️', '🧑‍🍳', '🧑‍🌾', '🧑‍🔧', '🧑‍💼', '🧑‍🎓', '🧑‍🚀', '🧑‍🚒', '🧑‍✈️', '🧑‍⚖️', '🧑‍🍼', '🌱'] },
  { title: 'Mondo del gioco', emojis: ['🧙', '🦸', '🦹', '🥷', '🧝', '🧚', '🧛', '🧞', '🧜', '🧌', '🐉', '🦄'] },
  { title: 'Compagni di viaggio', emojis: ['🦊', '🐱', '🐶', '🦉', '🐼', '🐸', '🤖', '👾'] },
];

// Aree della vita → abilità. Per chi comincia dal benvenuto le abilità di base prendono questi nomi
// (stessi id di prima: str, dex, con, int, wis, cha, cre, così tutto il resto dell'app continua a funzionare);
// si vedono nel radar solo quelle scelte. "Soldi" è un'abilità nuova (id 'mon').
export const AREAS = [
  { id: 'fit', statId: 'str', type: 'attribute', emoji: '💪', name: 'Forma fisica', color: '#ef4444', desc: 'Movimento, sport, energia del corpo.' },
  { id: 'study', statId: 'int', type: 'attribute', emoji: '🧠', name: 'Studio', color: '#ec4899', desc: 'Imparare, leggere, capire cose nuove.' },
  { id: 'work', statId: 'dex', type: 'attribute', emoji: '💼', name: 'Lavoro', color: '#a16207', desc: 'Progetti, produttività, carriera.' },
  { id: 'mind', statId: 'wis', type: 'attribute', emoji: '🧘', name: 'Mente', color: '#8b5cf6', desc: 'Calma, consapevolezza, riposo.' },
  { id: 'home', statId: 'con', type: 'attribute', emoji: '🏠', name: 'Casa', color: '#0ea5e9', desc: 'Ordine e cura della casa e delle cose.' },
  { id: 'money', statId: 'mon', type: 'ability', emoji: '💰', name: 'Soldi', color: '#10b981', desc: 'Risparmio, spese, obiettivi economici.' },
  { id: 'art', statId: 'cre', type: 'ability', emoji: '🎨', name: 'Creatività', color: '#f97316', desc: 'Arte, musica, scrittura, idee.' },
  { id: 'love', statId: 'cha', type: 'attribute', emoji: '❤️', name: 'Relazioni', color: '#e11d48', desc: 'Amicizie, famiglia, persone care.' },
];
export const MIN_AREAS = 3; // il radar ha bisogno di almeno 3 punte per avere una forma
export const MAX_AREAS = 5;
export const MAX_HABITS = 3;

// Abitudini proposte: 2 per area, più l'acqua per tutti. [emoji, nome, stelle]
const HABIT_SUGGESTIONS = {
  fit: [['🚶', 'Passeggiata di 20 minuti', 2], ['🏋️', 'Allenamento di 15 minuti', 3]],
  study: [['📖', 'Leggi 10 pagine', 2], ['🗣️', '15 minuti di inglese', 2]],
  work: [['📋', 'Pianifica la giornata', 1], ['📥', 'Svuota la posta', 2]],
  mind: [['🧘', 'Meditazione di 5 minuti', 1], ['📓', 'Diario della sera', 2]],
  home: [['🧹', 'Riordina per 10 minuti', 1], ['🪴', 'Annaffia le piante', 1]],
  money: [['🧾', 'Segna le spese del giorno', 1], ['🐷', 'Metti da parte 2 €', 2]],
  art: [['🎨', 'Disegna per 10 minuti', 2], ['🎸', 'Suona per 15 minuti', 2]],
  love: [['💬', 'Scrivi a un amico', 1], ['🤗', 'Tempo con la famiglia', 2]],
};
const WATER = ['💧', "Bevi 8 bicchieri d'acqua", 1];

export function suggestedHabits(areaIds) {
  const list = [];
  areaIds.forEach(id => (HABIT_SUGGESTIONS[id] || []).forEach(([emoji, name, stars]) => list.push({ key: name, emoji, name, stars, areaId: id })));
  const healthArea = areaIds.includes('fit') ? 'fit' : (areaIds.includes('home') ? 'home' : (areaIds[0] || 'fit'));
  list.push({ key: WATER[1], emoji: WATER[0], name: WATER[1], stars: WATER[2], areaId: healthArea });
  return list;
}

export const areaById = (id) => AREAS.find(a => a.id === id);

// Abilità per chi comincia dal benvenuto: le abilità di base rinominate come le aree, visibili solo quelle scelte
export function buildStats(stats, areaIds) {
  const out = (stats || []).map(s => {
    const area = AREAS.find(a => a.statId === s.id);
    if (!area) return s;
    return { ...s, name: _t(area.name), icon: area.emoji, emoji: area.emoji, description: _t(area.desc), visible: areaIds.includes(area.id) };
  });
  AREAS.forEach(area => {
    if (!out.some(s => s.id === area.statId)) {
      out.push({ id: area.statId, name: _t(area.name), icon: area.emoji, emoji: area.emoji, description: _t(area.desc), type: area.type, visible: areaIds.includes(area.id), level: 1, xp: 0 });
    }
  });
  // Nel radar le abilità scelte nell'ordine in cui sono state scelte
  const order = areaIds.map(id => areaById(id).statId);
  return out.sort((a, b) => {
    const ia = order.indexOf(a.id); const ib = order.indexOf(b.id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
}

export function buildHabit(h, i = 0) {
  const area = areaById(h.areaId);
  return {
    id: 'habit_' + Date.now() + '_' + i,
    emoji: h.emoji,
    name: _t(h.name),
    frequency: 'daily',
    freqTimes: 1,
    difficulty: h.stars,
    stars: h.stars,
    primaryTarget: area ? area.statId : 'str',
    secondaryTarget: null,
    streak: 0,
    locked: false,
    createdAt: new Date().toISOString(),
  };
}

export function buildFirstMission(areaIds) {
  const areaId = areaIds.includes('fit') ? 'fit' : (areaIds[0] || 'fit');
  return {
    id: 'oneshot_welcome_' + Date.now(),
    emoji: '💧',
    name: _t("Bevi un bicchiere d'acqua"),
    difficulty: 1,
    stars: 1,
    primaryTarget: areaById(areaId).statId,
    secondaryTarget: null,
    completed: false,
    locked: false,
    createdAt: new Date().toISOString(),
    welcome: true,
  };
}

// --- Aggiungere l'app alla Home (finché è una PWA) ---
export function isStandalone() {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  } catch (_) { return false; }
}

// 'ios' | 'android' | null (computer: niente schermata, si comincia subito)
export function mobilePlatform() {
  try {
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
    if (/Android/.test(ua)) return 'android';
  } catch (_) { /* niente navigator */ }
  return null;
}

const SKIP_KEY = 'ql_install_skip';
export function installSkipped() { try { return localStorage.getItem(SKIP_KEY) === '1'; } catch (_) { return false; } }
export function skipInstall() { try { localStorage.setItem(SKIP_KEY, '1'); } catch (_) { /* niente */ } }

// Rimpicciolisce una foto scelta dall'utente (quadrata, 256 px, JPEG): l'avatar resta leggero nei dati salvati
export function photoToAvatar(file, size = 256) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('immagine non leggibile'));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const c = document.createElement('canvas'); c.width = size; c.height = size;
        c.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
        resolve(c.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
