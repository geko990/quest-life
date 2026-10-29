import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Menu a tendina dell'app al posto di quello del telefono (#57).
// Il JSX dell'app (src/jsx/) trasforma ogni <select> in questo componente: stesse props (value, onChange,
// name, className, style, disabled, <option>, <optgroup>), così il codice delle schermate non cambia.
// Il bottone prende gli stessi stili del select (in index.css i selettori `select` valgono anche per `.qsel`)
// e mostra la voce scelta con le emoji Fluent; al tocco sale dal basso una rotellina come quella di iOS:
// la voce al centro è quella scelta (cambia mentre si gira, come l'originale), un tocco su una voce la
// sceglie e chiude, un tocco fuori chiude.
// Misure: righe da 44 px, 5 visibili. Tempi: pannello che sale in 0,3 s, chiusura dopo un tocco 0,18 s.
// Per tenere il menu del telefono in un punto preciso: <select data-native ...>.
const ROW = 44;
const VISIBLE = 5;
const PAD = ROW * Math.floor(VISIBLE / 2);

const textOf = (children) => {
  let out = '';
  React.Children.forEach(children, (c) => {
    if (c == null || typeof c === 'boolean') return;
    if (typeof c === 'string' || typeof c === 'number') out += c;
    else if (c.props) out += textOf(c.props.children);
  });
  return out;
};

// Voci in ordine: { value, label, disabled } e intestazioni dei gruppi { header }
function readOptions(children, list = [], groupDisabled = false) {
  React.Children.forEach(children, (c) => {
    if (!c || !c.props) return;
    if (c.type === 'option') {
      const value = c.props.value !== undefined ? String(c.props.value) : textOf(c.props.children);
      list.push({ value, label: textOf(c.props.children).trim(), disabled: !!(c.props.disabled || groupDisabled), hidden: !!c.props.hidden });
    } else if (c.type === 'optgroup') {
      list.push({ header: c.props.label });
      readOptions(c.props.children, list, !!c.props.disabled);
    } else if (c.type === React.Fragment) {
      readOptions(c.props.children, list, groupDisabled);
    }
  });
  return list;
}

export default function WheelSelect(props) {
  const { value, defaultValue, onChange, name, className, style, disabled, children, id, title } = props;
  const options = readOptions(children);
  const controlled = value !== undefined && value !== null;
  const [inner, setInner] = useState(defaultValue !== undefined ? String(defaultValue) : undefined);
  const raw = controlled ? String(value) : inner;
  const choices = options.filter(o => !o.header && !o.hidden);
  // Come il select del browser: senza valore valido si vede la prima voce
  const selected = choices.find(o => o.value === raw) || choices[0];
  const [open, setOpen] = useState(false);

  const emit = (v) => {
    if (selected && v === selected.value) return;
    if (!controlled) setInner(v);
    if (onChange) {
      const target = { value: v, name, type: 'select-one', id };
      onChange({ target, currentTarget: target, type: 'change', preventDefault() {}, stopPropagation() {}, persist() {} });
    }
  };

  const aria = {};
  Object.keys(props).forEach(k => { if (k.startsWith('aria-') || k.startsWith('data-')) aria[k] = props[k]; });

  return (
    <>
      <button
        type="button"
        {...aria}
        id={id}
        title={title}
        name={name}
        disabled={disabled}
        className={`qsel${className ? ' ' + className : ''}`}
        style={style}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); if (!disabled) setOpen(true); }}
      >
        <span className="qsel-text">{selected ? selected.label : ''}</span>
        <svg className="qsel-chev" viewBox="0 0 10 16" aria-hidden="true"><path d="M2 6l3-3 3 3M2 10l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <WheelSheet
          options={options}
          value={selected ? selected.value : undefined}
          label={props['aria-label'] || title}
          onChange={emit}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function WheelSheet({ options, value, label, onChange, onClose }) {
  const [shown, setShown] = useState(false);
  const scrollRef = useRef(null);
  const itemsRef = useRef([]);
  const centerRef = useRef(-1);
  const settleTimer = useRef(null);
  const closing = useRef(false);
  const rows = options.filter(o => !o.hidden);
  const startIndex = Math.max(0, rows.findIndex(o => !o.header && o.value === value));

  // Righe inclinate e sfumate in base alla distanza dal centro (si aggiorna direttamente lo stile: 60 fps)
  const paint = () => {
    const el = scrollRef.current; if (!el) return;
    const mid = el.scrollTop + PAD;
    itemsRef.current.forEach((it, i) => {
      if (!it) return;
      const d = (i * ROW - mid + PAD) / ROW;
      const a = Math.min(Math.abs(d), 3);
      it.style.transform = `rotateX(${(-d * 20).toFixed(1)}deg) scale(${(1 - a * 0.06).toFixed(3)})`;
      it.style.opacity = String(Math.max(0.15, 1 - a * 0.3));
    });
  };

  const nearestChoice = (i) => {
    for (let k = 0; k < rows.length; k++) {
      for (const j of [i + k, i - k]) {
        if (j >= 0 && j < rows.length && !rows[j].header && !rows[j].disabled) return j;
      }
    }
    return -1;
  };

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) { el.scrollTop = startIndex * ROW; centerRef.current = startIndex; paint(); }
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    return () => cancelAnimationFrame(r);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearTimeout(settleTimer.current), []);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    setShown(false);
    setTimeout(onClose, 260);
  };

  const onScroll = () => {
    requestAnimationFrame(paint);
    const el = scrollRef.current; if (!el) return;
    const i = Math.round(el.scrollTop / ROW);
    if (i !== centerRef.current) {
      centerRef.current = i;
      try { if (navigator.vibrate) navigator.vibrate(4); } catch (_) {}
    }
    clearTimeout(settleTimer.current);
    // Fermata la rotella: la voce al centro diventa quella scelta (un'intestazione rimanda alla voce più vicina)
    settleTimer.current = setTimeout(() => {
      const j = nearestChoice(Math.round(el.scrollTop / ROW));
      if (j < 0) return;
      if (j * ROW !== Math.round(el.scrollTop)) el.scrollTo({ top: j * ROW, behavior: 'smooth' });
      onChange(rows[j].value);
    }, 140);
  };

  const tap = (i) => {
    const r = rows[i];
    if (!r || r.header || r.disabled) return;
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: i * ROW, behavior: 'smooth' });
    clearTimeout(settleTimer.current);
    onChange(r.value);
    setTimeout(close, 180);
  };

  return createPortal(
    <div className="wheel-root" onClick={(e) => e.stopPropagation()}>
      <div className={`wheel-veil ${shown ? 'show' : ''}`} onClick={close} />
      <div className={`wheel-sheet ${shown ? 'show' : ''}`} role="listbox" aria-label={label}>
        <div className="wheel-grab" />
        <div className="wheel" style={{ height: ROW * VISIBLE }}>
          <div className="wheel-band" style={{ top: PAD, height: ROW }} />
          <div className="wheel-scroll" ref={scrollRef} onScroll={onScroll} style={{ paddingTop: PAD, paddingBottom: PAD }}>
            {rows.map((o, i) => (
              <div
                key={i}
                ref={(n) => { itemsRef.current[i] = n; }}
                className={`wheel-item${o.header ? ' is-header' : ''}${o.disabled ? ' is-disabled' : ''}`}
                role={o.header ? 'presentation' : 'option'}
                aria-selected={!o.header && o.value === value}
                style={{ height: ROW }}
                onClick={() => tap(i)}
              >
                <span>{o.header || o.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
