import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { _t } from '../i18n';
import { EMOJI_CATEGORIES, lastEmojiIn } from '../utils/emojiCatalog';

// Selettore delle emoji: pannello dal basso con l'emoji grande al centro (nel colore `color`),
// una casella dove scriverla a mano e sotto la griglia per tema.
// Scelta un'emoji (dalla griglia o dalla tastiera) l'emoji grande rimbalza e il pannello si chiude da solo.
// Tempi: pannello che sale in 0,32 s; dopo la scelta 0,2 s di rimbalzo, poi chiusura in 0,28 s.
export default function EmojiPickerSheet({ open, emoji, color = '#7c3aed', onPick, onClose }) {
  const [visible, setVisible] = useState(false);   // montato
  const [shown, setShown] = useState(false);       // animazione d'ingresso
  const [current, setCurrent] = useState(emoji);
  const [cat, setCat] = useState(0);
  const [typed, setTyped] = useState('');
  const [popKey, setPopKey] = useState(0);
  const timers = useRef([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout); timers.current = [];
    if (open) {
      setCurrent(emoji); setTyped(''); setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    } else if (visible) {
      setShown(false);
      timers.current.push(setTimeout(() => setVisible(false), 300));
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  if (!visible) return null;

  const choose = (e) => {
    if (!e) return;
    setCurrent(e); setPopKey(k => k + 1);
    try { document.activeElement && document.activeElement.blur(); } catch (_) {}
    timers.current.push(setTimeout(() => { onPick && onPick(e); onClose && onClose(); }, 200));
  };

  // In un portale sopra a tutto; i clic non risalgono alle finestre sotto (che si chiuderebbero)
  return createPortal(
    <div className="emoji-picker-root" style={{ '--c': color }} onClick={(e) => e.stopPropagation()}>
      <div className={`emoji-picker-veil ${shown ? 'show' : ''}`} onClick={onClose} />
      <div className={`emoji-picker-sheet ${shown ? 'show' : ''}`} role="dialog" aria-label={_t("Scegli l'emoji")}>
        <div className="emoji-picker-grab" />
        <div className="emoji-picker-hero">
          <div className="emoji-picker-big" key={popKey}>{current}</div>
        </div>
        <div className="emoji-picker-field">
          <input
            type="text"
            inputMode="text"
            enterKeyHint="done"
            value={typed}
            placeholder={_t("Tocca per scrivere un'emoji")}
            onChange={(ev) => {
              setTyped(ev.target.value);
              const found = lastEmojiIn(ev.target.value);
              if (found) choose(found);
            }}
            aria-label={_t("Scrivi un'emoji")}
          />
        </div>
        <div className="emoji-picker-tabs">
          {EMOJI_CATEGORIES.map((c, i) => (
            <button key={c.id} type="button" aria-pressed={i === cat} onClick={() => setCat(i)}>{c.icon}</button>
          ))}
        </div>
        <div className="emoji-picker-grid">
          {EMOJI_CATEGORIES[cat].emojis.map((e) => (
            <button key={e} type="button" onClick={() => choose(e)}>{e}</button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
