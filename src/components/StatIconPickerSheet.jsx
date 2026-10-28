import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { _t } from '../i18n';
import Icon from './Icon';
import { STAT_ICON_CHOICES } from '../utils/statIcons';

// Scelta del simbolo di un attributo/abilità (#53): stesso pannello del selettore delle emoji
// (classi .emoji-picker-*), con le icone Solar di STAT_ICON_CHOICES. Scelta un'icona, rimbalza e si chiude.
export default function StatIconPickerSheet({ open, value, color = 'var(--accent-primary)', onPick, onClose }) {
  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState(false);
  const [current, setCurrent] = useState(value);
  const [popKey, setPopKey] = useState(0);
  const timers = useRef([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout); timers.current = [];
    if (open) {
      setCurrent(value); setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    } else if (visible) {
      setShown(false);
      timers.current.push(setTimeout(() => setVisible(false), 300));
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  if (!visible) return null;

  const choose = (n) => {
    setCurrent(n); setPopKey(k => k + 1);
    timers.current.push(setTimeout(() => { onPick && onPick(n); onClose && onClose(); }, 200));
  };

  return createPortal(
    <div className="emoji-picker-root" style={{ '--c': color }} onClick={(e) => e.stopPropagation()}>
      <div className={`emoji-picker-veil ${shown ? 'show' : ''}`} onClick={onClose} />
      <div className={`emoji-picker-sheet ${shown ? 'show' : ''}`} role="dialog" aria-label={_t("Scegli il simbolo")}>
        <div className="emoji-picker-grab" />
        <div className="emoji-picker-hero">
          <div className="emoji-picker-big stat-icon-big" key={popKey} style={{ color }}>
            {current ? <Icon name={current} variant="bold-duotone" /> : '?'}
          </div>
        </div>
        <div className="emoji-picker-grid stat-icon-grid">
          {STAT_ICON_CHOICES.map((n) => (
            <button key={n} type="button" onClick={() => choose(n)} aria-pressed={n === current} aria-label={n} style={{ color }}>
              <Icon name={n} variant="bold-duotone" />
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
