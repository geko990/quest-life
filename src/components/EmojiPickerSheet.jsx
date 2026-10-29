import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { _t } from '../i18n';
import { EMOJI_CATEGORIES, lastEmojiIn, searchEmoji, normalizeQuery } from '../utils/emojiCatalog';

// Selettore delle emoji: pannello dal basso con l'emoji grande al centro (nel colore `color`),
// una casella dove cercarla per nome o scriverla dalla tastiera e sotto la griglia per tema.
// Ogni scheda mostra prima le emoji scelte per i task di tutti i giorni, poi (scorrendo) tutte le altre
// del suo gruppo: in tutto le 1.593 emoji Fluent (#56). Swipe orizzontale sulla griglia = scheda accanto.
// Scelta un'emoji l'emoji grande rimbalza e il pannello si chiude da solo.
// Tempi: pannello che sale in 0,32 s; dopo la scelta 0,2 s di rimbalzo, poi chiusura in 0,28 s;
// cambio scheda con scorrimento di 0,2 s.
let indexPromise = null;
const loadIndex = () => (indexPromise = indexPromise || import('../utils/emojiIndex').catch(() => { indexPromise = null; return null; }));

export default function EmojiPickerSheet({ open, emoji, color = '#7c3aed', onPick, onClose }) {
  const [visible, setVisible] = useState(false);   // montato
  const [shown, setShown] = useState(false);       // animazione d'ingresso
  const [current, setCurrent] = useState(emoji);
  const [cat, setCat] = useState(0);
  const [slide, setSlide] = useState('');          // direzione dell'ultimo cambio scheda
  const [typed, setTyped] = useState('');
  const [popKey, setPopKey] = useState(0);
  const [index, setIndex] = useState(null);        // elenco completo, caricato all'apertura
  const timers = useRef([]);
  const gridRef = useRef(null);
  const tabsRef = useRef(null);
  const touch = useRef(null);

  useEffect(() => {
    timers.current.forEach(clearTimeout); timers.current = [];
    if (open) {
      setCurrent(emoji); setTyped(''); setVisible(true);
      loadIndex().then(m => m && setIndex(m));
      requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    } else if (visible) {
      setShown(false);
      timers.current.push(setTimeout(() => setVisible(false), 300));
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // La scheda attiva resta visibile nella fila (che scorre in orizzontale) e la griglia riparte dall'alto
  useEffect(() => {
    if (gridRef.current) gridRef.current.scrollTop = 0;
    const tab = tabsRef.current && tabsRef.current.children[cat];
    if (tab && tab.scrollIntoView) { try { tab.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); } catch (_) { /* vecchi browser */ } }
  }, [cat]);

  if (!visible) return null;

  const choose = (e) => {
    if (!e) return;
    setCurrent(e); setPopKey(k => k + 1);
    try { document.activeElement && document.activeElement.blur(); } catch (_) {}
    timers.current.push(setTimeout(() => { onPick && onPick(e); onClose && onClose(); }, 200));
  };

  const goTo = (i) => {
    const n = EMOJI_CATEGORIES.length;
    const next = (i + n) % n;
    if (next === cat) return;
    setSlide(i > cat ? 'next' : 'prev');
    setCat(next);
  };

  const query = normalizeQuery(typed);
  const searching = query.length >= 2;
  const results = searching && index ? searchEmoji(index.EMOJI_SEARCH, query) : [];

  const c = EMOJI_CATEGORIES[cat];
  const head = c.emojis;
  const headSet = new Set(head);
  const tail = c.tail && index ? (index.EMOJI_GROUPS[c.tail] || []).filter(e => !headSet.has(e)) : [];

  const onTouchStart = (ev) => {
    const t = ev.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (ev) => {
    const s = touch.current; touch.current = null;
    if (!s || searching) return;
    const t = ev.changedTouches[0];
    const dx = t.clientX - s.x; const dy = t.clientY - s.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(cat + (dx < 0 ? 1 : -1));
  };

  const cell = (e, i) => <button key={e + i} type="button" onClick={() => choose(e)}>{e}</button>;

  // In un portale sopra a tutto; i clic non risalgono alle finestre sotto (che si chiuderebbero)
  return createPortal(
    <div className="emoji-picker-root" style={{ '--c': color }} onClick={(e) => e.stopPropagation()}>
      <div className={`emoji-picker-veil ${shown ? 'show' : ''}`} onClick={onClose} />
      <div className={`emoji-picker-sheet ${shown ? 'show' : ''} ${typed ? 'is-typing' : ''}`} role="dialog" aria-label={_t("Scegli l'emoji")}>
        <div className="emoji-picker-grab" />
        <div className="emoji-picker-hero">
          <div className="emoji-picker-big" key={popKey}>{current}</div>
        </div>
        <div className="emoji-picker-field">
          <input
            type="text"
            inputMode="text"
            enterKeyHint="search"
            value={typed}
            placeholder={_t("Cerca o scrivi un'emoji")}
            onChange={(ev) => {
              setTyped(ev.target.value);
              const found = lastEmojiIn(ev.target.value);
              if (found) choose(found);
            }}
            aria-label={_t("Cerca o scrivi un'emoji")}
          />
        </div>
        {searching ? (
          <div className="emoji-picker-grid emoji-picker-results" ref={gridRef}>
            {!index && <div className="emoji-picker-note">{_t("Caricamento…")}</div>}
            {index && results.length === 0 && <div className="emoji-picker-note">{_t("Nessuna emoji trovata")}</div>}
            {results.map(cell)}
          </div>
        ) : (
          <>
            <div className="emoji-picker-tabs" ref={tabsRef}>
              {EMOJI_CATEGORIES.map((t, i) => (
                <button key={t.id} type="button" aria-pressed={i === cat} onClick={() => goTo(i)}>{t.icon}</button>
              ))}
            </div>
            <div
              className={`emoji-picker-grid ${slide ? 'slide-' + slide : ''}`}
              key={c.id}
              ref={gridRef}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {head.map(cell)}
              {head.length > 0 && tail.length > 0 && <div className="emoji-picker-sep">{_t("Tutte")}</div>}
              {tail.map(cell)}
              {c.tail && !index && <div className="emoji-picker-note">{_t("Caricamento…")}</div>}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
