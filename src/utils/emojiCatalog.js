// Emoji del selettore (EmojiPickerSheet), divise per tema: in testa a ogni scheda quelle scelte per i task
// di tutti i giorni, poi (`tail`) tutte le altre del gruppo di Unicode corrispondente (src/utils/emojiIndex.js, #56).
// Solo dati e piccole funzioni, niente grafica (riusabile anche nell'app nativa, #24).

const split = (s) => {
  try {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      return Array.from(new Intl.Segmenter('it', { granularity: 'grapheme' }).segment(s), (x) => x.segment);
    }
  } catch (_) { /* senza Segmenter si usa Array.from */ }
  return Array.from(s);
};

export const EMOJI_CATEGORIES = [
  { id: 'top', icon: '⭐', tail: null, emojis: split('🎯⚡🔥⭐✅📌🏆💡🚀🎉💎🧩🎲🗝️⏰📅🔔🧭🛡️⚔️🏹🪄🔮👑') },
  { id: 'work', icon: '💼', tail: 'objects', emojis: split('💼📊📈📝✉️📞💻🖨️📁🗂️📎🧾💰🏦🤝🗓️📮🖊️📋🧑‍💻📢🔍⌛🧠') },
  { id: 'body', icon: '🏃', tail: 'people', emojis: split('🚶🏃🚴🏋️🧘🏊⚽🎾🥾🧗🤸🛌💤❤️🦷💊🩺🚿🧴⚖️🏀⛹️🤾💪') },
  { id: 'food', icon: '🥗', tail: 'food', emojis: split('🥗🍎🥦🍳🥛💧☕🍵🍝🍞🥩🐟🍌🥕🍽️🛒🥑🍊🍇🥜🧀🍚🥤🍫') },
  { id: 'home', icon: '🏠', tail: 'places', emojis: split('🏠🧹🧺🧽🪴🛠️🔧🪛💡🚗⛽🐶🐱👶🎁📦🛏️🧼🗑️🔑🚲✈️🧳🏡') },
  { id: 'fun', icon: '📚', tail: 'activities', emojis: split('📚📖✏️🎓🔬🧪🌍🗣️🎨🎸🎹🎬📷✍️🧮💬🎧🎮♟️🧶📰🎤🖌️🎭') },
  { id: 'mood', icon: '😊', tail: 'mood', emojis: split('😊🙂😌🥳😎🤓🫶🙏👏🌞🌙🌈🍀🌸🦋❤️‍🔥✨🎈🌻🐾🌊⛰️🧡💜') },
  { id: 'nature', icon: '🐶', tail: 'nature', emojis: [] },
  { id: 'symbols', icon: '🔣', tail: 'symbols', emojis: [] }
];

// Ultima emoji presente in un testo scritto a mano (es. dalla tastiera emoji), oppure null
export function lastEmojiIn(text) {
  if (!text) return null;
  const parts = split(String(text));
  for (let i = parts.length - 1; i >= 0; i--) {
    if (/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(parts[i])) return parts[i];
  }
  return null;
}

// Ricerca nell'elenco completo (EMOJI_SEARCH di emojiIndex.js: una riga per emoji, "emoji<TAB>parole").
// Ogni parola cercata deve essere l'inizio di una delle parole dell'emoji (italiano o inglese,
// senza accenti). Prima le emoji in cui la prima parola cercata è l'inizio del nome.
export function normalizeQuery(q) {
  return String(q || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

export function searchEmoji(searchText, query, limit = 160) {
  const words = normalizeQuery(query).split(' ').filter(Boolean);
  if (!words.length || !searchText) return [];
  const res = [];
  const first = [];
  for (const line of searchText.split('\n')) {
    const tab = line.indexOf('\t');
    const terms = ' ' + line.slice(tab + 1);
    if (words.every(w => terms.includes(' ' + w))) {
      (terms.startsWith(' ' + words[0]) ? first : res).push(line.slice(0, tab));
    }
  }
  return first.concat(res).slice(0, limit);
}
