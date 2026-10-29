import { jsx } from 'react/jsx-runtime';
import { EmojiText } from '../components/Emoji';
import { hasEmoji } from '../utils/fluent';
import WheelSelect from '../components/WheelSelect';

// Fluent Emoji in tutta l'app (#54): il JSX dell'app passa da qui (vite.config.js, `jsxImportSource`).
// Quando un elemento HTML ha come figlio un testo con emoji (scritto nel codice, tradotto con _t()
// o inserito dall'utente), il testo diventa <EmojiText>, che disegna le emoji con Fluent.
// Restano emoji del telefono: menu nativi (<option>), campi di testo, testi dentro gli SVG,
// attributi (title, placeholder) e tutto ciò che non passa da React (alert, notifiche, titolo della pagina).
// Per lasciare un elemento com'è: attributo data-no-fluent.
const SKIP = new Set(['option', 'optgroup', 'select', 'textarea', 'input', 'title', 'style', 'script',
  'svg', 'text', 'tspan', 'textPath', 'g', 'defs', 'foreignObject']);

function convert(child) {
  return typeof child === 'string' && hasEmoji(child) ? jsx(EmojiText, { text: child }) : child;
}

export function emojifyProps(type, props) {
  if (typeof type !== 'string' || !props || SKIP.has(type)) return props;
  const c = props.children;
  if (c == null || props['data-no-fluent'] !== undefined || props.dangerouslySetInnerHTML) return props;
  if (typeof c === 'string') {
    return hasEmoji(c) ? { ...props, children: convert(c) } : props;
  }
  if (Array.isArray(c)) {
    let changed = false;
    const out = c.map((x) => {
      const y = convert(x);
      if (y !== x) changed = true;
      return y;
    });
    return changed ? { ...props, children: out } : props;
  }
  return props;
}

// Menu a tendina dell'app al posto di quello del telefono (#57): ogni <select> diventa WheelSelect,
// che ha le stesse props. Per tenere il menu del telefono: <select data-native ...>.
export function appType(type, props) {
  return type === 'select' && !(props && props['data-native'] !== undefined) ? WheelSelect : type;
}
