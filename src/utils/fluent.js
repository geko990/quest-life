// Fluent Emoji di Microsoft (licenza MIT) al posto delle emoji del telefono: stesso disegno su ogni
// dispositivo. I file sono in public/fluent/ (generati da scripts/make-fluent.py):
//   3d/<codice>.webp     (128 px) per le emoji grandi
//   color/<codice>.webp  (64 px)  per le emoji piccole
// <codice> = punti di codice esadecimali uniti da "-", senza FE0F (es. 💪 → 1f4aa).
// Solo logica, niente grafica (riusabile nell'app nativa, #24).

const BASE = (import.meta.env && import.meta.env.BASE_URL) || './';

// Emoji per cui il disegno manca (file non trovato): si mostra quella del telefono
const missing = new Set();
export const markMissing = (code) => missing.add(code);

// Toni della pelle (🏻–🏿): Fluent li ha come varianti a parte; si usa la versione "Default"
const SKIN = new Set(['1f3fb', '1f3fc', '1f3fd', '1f3fe', '1f3ff']);
export function emojiCode(e) {
  return Array.from(String(e || '')).filter(c => c !== '\uFE0F').map(c => c.codePointAt(0).toString(16)).filter(c => !SKIN.has(c)).join('-');
}

// Indirizzo del disegno, oppure null se non c'è
export function fluentUrl(e, big = false) {
  const code = emojiCode(e);
  if (!code || missing.has(code)) return null;
  return `${BASE}fluent/${big ? '3d' : 'color'}/${code}.webp`;
}

const PICTO = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;
let segmenter = null;
try { segmenter = new Intl.Segmenter('it', { granularity: 'grapheme' }); } catch (_) { /* senza: Array.from */ }

// È un'emoji da disegnare? (le cifre e i simboli come © restano testo)
export function isEmoji(g) {
  if (!g || !PICTO.test(g)) return false;
  // "©", "®", "™" e simili senza FE0F restano testo
  if (g.length === 1 && g.charCodeAt(0) < 0x2190) return false;
  return true;
}

// Divide un testo in pezzi: { t: 'testo' } oppure { e: '💪' }
export function splitEmoji(text) {
  const s = String(text == null ? '' : text);
  if (!PICTO.test(s)) return [{ t: s }];
  const parts = segmenter ? Array.from(segmenter.segment(s), x => x.segment) : Array.from(s);
  const out = [];
  for (const g of parts) {
    if (isEmoji(g)) out.push({ e: g });
    else if (out.length && out[out.length - 1].t !== undefined) out[out.length - 1].t += g;
    else out.push({ t: g });
  }
  return out;
}

// Emoji iniziale di un testo (es. "🎭 Prove Canterville" → { e: '🎭', rest: 'Prove Canterville' })
export function leadingEmoji(text) {
  const parts = splitEmoji(text);
  if (parts.length && parts[0].e) {
    const rest = parts.slice(1).map(p => (p.e !== undefined ? p.e : p.t)).join('').replace(/^\s+/, '');
    return { e: parts[0].e, rest };
  }
  return { e: null, rest: String(text == null ? '' : text) };
}
