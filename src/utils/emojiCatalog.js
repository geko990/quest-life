// Emoji del selettore (EmojiPickerSheet), divise per tema e scelte per i task di tutti i giorni.
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
  { id: 'top', icon: '⭐', emojis: split('🎯⚡🔥⭐✅📌🏆💡🚀🎉💎🧩🎲🗝️⏰📅🔔🧭🛡️⚔️🏹🪄🔮👑') },
  { id: 'work', icon: '💼', emojis: split('💼📊📈📝✉️📞💻🖨️📁🗂️📎🧾💰🏦🤝🗓️📮🖊️📋🧑‍💻📢🔍⌛🧠') },
  { id: 'body', icon: '🏃', emojis: split('🚶🏃🚴🏋️🧘🏊⚽🎾🥾🧗🤸🛌💤❤️🦷💊🩺🚿🧴⚖️🏀⛹️🤾💪') },
  { id: 'food', icon: '🥗', emojis: split('🥗🍎🥦🍳🥛💧☕🍵🍝🍞🥩🐟🍌🥕🍽️🛒🥑🍊🍇🥜🧀🍚🥤🍫') },
  { id: 'home', icon: '🏠', emojis: split('🏠🧹🧺🧽🪴🛠️🔧🪛💡🚗⛽🐶🐱👶🎁📦🛏️🧼🗑️🔑🚲✈️🧳🏡') },
  { id: 'fun', icon: '📚', emojis: split('📚📖✏️🎓🔬🧪🌍🗣️🎨🎸🎹🎬📷✍️🧮💬🎧🎮♟️🧶📰🎤🖌️🎭') },
  { id: 'mood', icon: '😊', emojis: split('😊🙂😌🥳😎🤓🫶🙏👏🌞🌙🌈🍀🌸🦋❤️‍🔥✨🎈🌻🐾🌊⛰️🧡💜') }
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
