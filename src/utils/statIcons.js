// Icone di attributi e abilità (#53): simboli "fissi" dell'app, presi dal pacchetto Solar (bicolore piena).
// Le emoji restano per ciò che scrive l'utente (abitudini, task, campagne, cibi). Solo logica e dati,
// niente grafica (riusabile nell'app nativa, #24).
// Regola: ogni immagine ha un solo significato. Qui NON vanno icone già usate dall'interfaccia
// (quaderno, razzo, coppa, cuore col battito, carrello, ingranaggio, portafoglio, bersaglio,
// cronometro, cappello da cuoco, fiamma, goccia, omino che cammina, dado).

// Icone che si possono scegliere per un attributo o un'abilità (nome Solar senza variante)
export const STAT_ICON_CHOICES = [
  'dumbbell-large-minimalistic', 'bolt', 'shield', 'brain', 'stars', 'crown', 'pallete-2',
  'music-note-2', 'book', 'pen', 'code', 'global', 'translation', 'chat-round-dots', 'user-speak',
  'users-group-rounded', 'hand-shake', 'hand-heart', 'heart', 'smile-circle', 'mask-happy',
  'meditation', 'sleeping', 'leaf', 'sun', 'moon', 'wind', 'running', 'bicycling', 'swimming',
  'football', 'basketball', 'tennis', 'gamepad', 'camera', 'microphone-3', 'cup-hot', 'home-smile',
  'graph-up', 'dollar', 'calculator', 'scale', 'lightbulb', 'test-tube', 'atom', 'planet', 'compass',
  'key', 'eye', 'medal-ribbon', 'sledgehammer', 'magic-stick-3', 'pills', 'stethoscope', 'ghost'
];

// Icona degli attributi predefiniti
export const DEFAULT_STAT_ICONS = {
  str: 'dumbbell-large-minimalistic', dex: 'bolt', con: 'shield', int: 'brain', wis: 'stars', cha: 'crown', cre: 'pallete-2'
};

// Emoji già salvate dagli utenti → icona Solar equivalente (così i dati esistenti cambiano aspetto da soli)
export const EMOJI_TO_STAT_ICON = {
  '💪': 'dumbbell-large-minimalistic', '🏋️': 'dumbbell-large-minimalistic', '⚡': 'bolt', '🛡️': 'shield', '🛡': 'shield',
  '🧠': 'brain', '✨': 'stars', '👑': 'crown', '🎨': 'pallete-2', '🖌️': 'pallete-2',
  '🎵': 'music-note-2', '🎶': 'music-note-2', '🎸': 'music-note-2', '🎹': 'music-note-2', '🎧': 'music-note-2',
  '📚': 'book', '📖': 'book', '✍️': 'pen', '🖊️': 'pen', '✏️': 'pen', '💻': 'code', '🧑‍💻': 'code',
  '🌍': 'global', '🌎': 'global', '🌐': 'global', '🗣️': 'user-speak', '💬': 'chat-round-dots',
  '👥': 'users-group-rounded', '🤝': 'hand-shake', '🫶': 'hand-heart', '❤️': 'heart', '😊': 'smile-circle', '🙂': 'smile-circle',
  '🎭': 'mask-happy', '🧘': 'meditation', '😴': 'sleeping', '💤': 'sleeping', '🌿': 'leaf', '🍀': 'leaf', '🌱': 'leaf',
  '☀️': 'sun', '🌞': 'sun', '🌙': 'moon', '🏃': 'running', '🚴': 'bicycling', '🏊': 'swimming',
  '⚽': 'football', '🏀': 'basketball', '🎾': 'tennis', '🎮': 'gamepad', '📷': 'camera', '🎤': 'microphone-3',
  '☕': 'cup-hot', '🏠': 'home-smile', '📈': 'graph-up', '💰': 'dollar', '💵': 'dollar', '🧮': 'calculator',
  '⚖️': 'scale', '💡': 'lightbulb', '🔬': 'test-tube', '🧪': 'test-tube', '⚛️': 'atom', '🪐': 'planet', '🧭': 'compass',
  '🔑': 'key', '👁️': 'eye', '🏅': 'medal-ribbon', '🛠️': 'sledgehammer', '🔧': 'sledgehammer', '🔨': 'sledgehammer',
  '🪄': 'magic-stick-3', '🔮': 'magic-stick-3', '💊': 'pills', '🩺': 'stethoscope', '👻': 'ghost'
};

// Colore del simbolo: gli attributi predefiniti hanno il loro, gli altri il colore dei dettagli
const STAT_COLORS = { str: 'var(--stat-str)', dex: 'var(--stat-dex)', con: 'var(--stat-con)', int: 'var(--stat-int)', wis: 'var(--stat-wis)', cha: 'var(--stat-cha)' };

// Emoji salvata di un attributo (vecchi dati: `icon`; attributi creati dalla finestra prima della 265: `emoji`)
export function statEmoji(stat) {
  return (stat && (stat.icon || stat.emoji)) || '⭐';
}

// Nome dell'icona Solar di un attributo, oppure null se resta un'emoji senza equivalente
export function statSolar(stat) {
  if (!stat) return null;
  if (stat.solar && STAT_ICON_CHOICES.includes(stat.solar)) return stat.solar;
  const e = stat.icon || stat.emoji;
  if (e && EMOJI_TO_STAT_ICON[e]) return EMOJI_TO_STAT_ICON[e];
  if (!e && DEFAULT_STAT_ICONS[stat.id]) return DEFAULT_STAT_ICONS[stat.id];
  return null;
}

export function statColor(stat) {
  return (stat && STAT_COLORS[stat.id]) || 'var(--accent-primary)';
}
