import React, { useLayoutEffect, useRef, useState } from 'react';
import { fluentUrl, emojiCode, markMissing, splitEmoji } from '../utils/fluent';

// Un'emoji disegnata con Fluent Emoji (#54). Misura 1,15 em (segue il font-size del contenitore).
// Disegno: 3D se l'emoji è grande (font-size del contenitore da 24 px in su, o `big`), altrimenti Color
// (le 3D da piccole si "impastano"). Se il disegno manca resta l'emoji del telefono.
// Nota: dentro questo file i testi con emoji vanno marcati con data-no-fluent, altrimenti il JSX
// dell'app (src/jsx/) li trasformerebbe di nuovo in disegni, all'infinito.
const BIG_FROM_PX = 24;

export default function Emoji({ e, big, className, style, title }) {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);
  // Misura del contenitore: si legge prima di disegnare (useLayoutEffect), così si scarica un solo disegno
  const [auto, setAuto] = useState(big === undefined ? null : !!big);
  useLayoutEffect(() => {
    if (big !== undefined || auto !== null || !ref.current) return;
    let px = 0;
    try { px = parseFloat(getComputedStyle(ref.current.parentElement || ref.current).fontSize) || 0; } catch (_) { /* resta Color */ }
    setAuto(px >= BIG_FROM_PX);
  }, [big, auto]);

  if (!e) return null;
  const isBig = big !== undefined ? !!big : auto;
  const url = !failed && fluentUrl(e, !!isBig);
  if (!fluentUrl(e) || failed) {
    return <span className={className} style={style} title={title} data-no-fluent="">{e}</span>;
  }
  return (
    <img
      ref={ref}
      src={isBig === null ? undefined : url}
      alt={e}
      title={title}
      draggable={false}
      decoding="async"
      className={`fe-emoji${className ? ' ' + className : ''}`}
      style={style}
      onError={() => { markMissing(emojiCode(e)); setFailed(true); }}
    />
  );
}

// Testo con emoji dentro (es. "🍎 Sostentamento di oggi"): le emoji diventano disegni, il resto resta testo
export function EmojiText({ text, big }) {
  const parts = splitEmoji(text);
  if (parts.length === 1 && parts[0].t !== undefined) return <>{parts[0].t}</>;
  // Pezzi di testo dentro un Fragment: il JSX dell'app non li tocca (trasforma solo i figli degli elementi HTML)
  return <>{parts.map((p, i) => (p.e ? <Emoji key={i} e={p.e} big={big} /> : <React.Fragment key={i}>{p.t}</React.Fragment>))}</>;
}
