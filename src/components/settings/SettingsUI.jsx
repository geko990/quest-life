import React, { useState } from 'react';

// Mattoncini della schermata Opzioni: una sola "grammatica" per tutte le righe.
// Tessera (titolo con emoji) → righe con titolo, descrizione facoltativa e comando a destra.
// Gli stili sono le classi opt-* in src/index.css.

const Chevron = ({ open }) => (
  <svg className={`opt-chevron${open ? ' is-open' : ''}`} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Tessera richiudibile. `summary` = testo breve a destra del titolo; `preview` = contenuto visibile anche da chiusa.
export function SettingsGroup({ title, open, onToggle, summary, preview, highlight, children }) {
  return (
    <div className={`glass-panel opt-group${highlight ? ' opt-group--highlight' : ''}`}>
      <button type="button" className="opt-group-head" onClick={onToggle} aria-expanded={!!open}>
        <span className="opt-group-title">{title}</span>
        {summary != null && summary !== '' && <span className="opt-group-summary">{summary}</span>}
        <Chevron open={open} />
      </button>
      {!open && preview}
      {open && <div className="opt-group-body">{children}</div>}
    </div>
  );
}

// Riga: titolo + descrizione a sinistra, comando a destra; `below` va a tutta larghezza sotto.
export function SettingRow({ title, desc, children, below, onClick, danger }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} className={`opt-row${onClick ? ' opt-row--tap' : ''}`} onClick={onClick}>
      <div className="opt-row-main">
        <div className="opt-row-text">
          <div className={`opt-row-title${danger ? ' is-danger' : ''}`}>{title}</div>
          {desc && <div className="opt-row-desc">{desc}</div>}
        </div>
        {children != null && <div className="opt-row-control">{children}</div>}
        {onClick && children == null && <Chevron />}
      </div>
      {below && <div className="opt-row-below">{below}</div>}
    </Tag>
  );
}

// Interruttore sì/no in stile iPhone.
export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      aria-label={label}
      className={`opt-toggle${checked ? ' is-on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="opt-toggle-knob" />
    </button>
  );
}

// Selettore a pulsanti per 2–3 scelte.
export function Segmented({ options, value, onChange }) {
  return (
    <div className="opt-segmented" role="radiogroup">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? 'is-on' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Valore + › : al tocco si apre la scelta nativa del telefono.
export function SelectValue({ value, options, onChange, label }) {
  const current = options.find(o => String(o.value) === String(value)) || options[0];
  return (
    <span className="opt-select">
      <span className="opt-select-text">{current?.short || current?.label}</span>
      <Chevron />
      <select value={value} onChange={e => onChange(e.target.value)} aria-label={label}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </span>
  );
}

// Tre soli tipi di pulsante: primary, secondary, danger.
export function OptButton({ variant = 'secondary', small, className = '', ...props }) {
  return <button type="button" className={`opt-btn opt-btn--${variant}${small ? ' opt-btn--small' : ''} ${className}`} {...props} />;
}

// Valore numerico modificabile (età, altezza, peso, obiettivi): casella compatta con unità, si conferma
// uscendo dal campo o con Invio; accetta la virgola. Testo a 16 px: su iPhone niente zoom.
export function NumberValue({ value, unit, onChange, min = 0, max = 100000, decimals = 0, label }) {
  const [draft, setDraft] = useState(null);
  const fmt = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return '';
    const r = decimals ? Math.round(n * 10 ** decimals) / 10 ** decimals : Math.round(n);
    return String(r).replace('.', ',');
  };
  const commit = () => {
    if (draft === null) return;
    const n = parseFloat(String(draft).replace(/\./g, decimals ? '.' : '').replace(',', '.').replace(/[^\d.]/g, ''));
    setDraft(null);
    if (!Number.isFinite(n)) return;
    const v = Math.min(max, Math.max(min, decimals ? Math.round(n * 10 ** decimals) / 10 ** decimals : Math.round(n)));
    if (v !== Number(value)) onChange(v);
  };
  return (
    <span className="opt-num">
      <input
        type="text"
        inputMode={decimals ? 'decimal' : 'numeric'}
        aria-label={label}
        value={draft !== null ? draft : fmt(value)}
        onFocus={(e) => { setDraft(fmt(value)); setTimeout(() => { try { e.target.select(); } catch (_) {} }, 0); }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      />
      {unit && <span className="opt-num-unit">{unit}</span>}
    </span>
  );
}
