import React, { useState } from 'react';
import { fluentUrl, emojiCode, markMissing, splitEmoji } from '../utils/fluent';

// Un'emoji disegnata con Fluent Emoji: `big` = 3D (emoji grandi), altrimenti Color (emoji piccole).
// Misura 1em (segue il font-size del contenitore). Se il disegno manca resta l'emoji del telefono.
export default function Emoji({ e, big = false, className, style, title }) {
  const [failed, setFailed] = useState(false);
  const url = !failed && fluentUrl(e, big);
  if (!e) return null;
  if (!url) return <span className={className} style={style} title={title}>{e}</span>;
  return (
    <img
      src={url}
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
export function EmojiText({ text, big = false }) {
  const parts = splitEmoji(text);
  if (parts.length === 1 && parts[0].t !== undefined) return <>{parts[0].t}</>;
  return <>{parts.map((p, i) => (p.e ? <Emoji key={i} e={p.e} big={big} /> : <React.Fragment key={i}>{p.t}</React.Fragment>))}</>;
}
