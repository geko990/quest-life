import React from 'react';

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
