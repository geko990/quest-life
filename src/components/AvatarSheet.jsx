import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { _t } from '../i18n';
import EmojiPickerSheet from './EmojiPickerSheet';
import { AVATAR_GROUPS, photoToAvatar } from '../utils/onboarding';

// Pannello per scegliere l'icona del profilo (#58): una foto dal telefono, le icone per gruppo
// (mestieri, mondo del gioco, compagni di viaggio) o qualunque emoji (selettore completo con la ricerca).
// onPick({ type: 'emoji', emoji }) oppure onPick({ type: 'image', image: dataURL }).
// Stesso aspetto del selettore delle emoji (classi .emoji-picker-*), tempi uguali.
export default function AvatarSheet({ open, onPick, onClose }) {
  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState(false);
  const [allOpen, setAllOpen] = useState(false);
  const [error, setError] = useState('');
  const timer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    if (open) {
      setVisible(true); setError('');
      requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    } else if (visible) {
      setShown(false);
      timer.current = setTimeout(() => setVisible(false), 300);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => clearTimeout(timer.current), []);

  if (!visible) return null;

  const pick = (v) => { onPick && onPick(v); setTimeout(() => onClose && onClose(), 150); };

  return createPortal(
    <div className="emoji-picker-root" onClick={(e) => e.stopPropagation()}>
      <div className={`emoji-picker-veil ${shown ? 'show' : ''}`} onClick={onClose} />
      <div className={`emoji-picker-sheet avatar-sheet ${shown ? 'show' : ''}`} role="dialog" aria-label={_t("Scegli la tua icona")}>
        <div className="emoji-picker-grab" />
        <h3 className="avatar-sheet-title">{_t("Scegli la tua icona")}</h3>
        <div className="avatar-sheet-actions">
          <label className="avatar-sheet-btn">
            📷 {_t("Carica una foto")}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={async (ev) => {
                const f = ev.target.files && ev.target.files[0];
                ev.target.value = '';
                if (!f) return;
                try { pick({ type: 'image', image: await photoToAvatar(f) }); } catch (_) { setError(_t("Non riesco a leggere questa foto: prova con un'altra.")); }
              }}
            />
          </label>
          <button type="button" className="avatar-sheet-btn" onClick={() => setAllOpen(true)}>🔍 {_t("Tutte le emoji")}</button>
        </div>
        {error && <div className="avatar-sheet-error">{error}</div>}
        <div className="avatar-sheet-groups">
          {AVATAR_GROUPS.map(g => (
            <div key={g.title} className="avatar-sheet-group">
              <div className="avatar-sheet-label">{_t(g.title)}</div>
              <div className="emoji-picker-grid avatar-sheet-grid">
                {g.emojis.map(e => <button key={e} type="button" onClick={() => pick({ type: 'emoji', emoji: e })}>{e}</button>)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <EmojiPickerSheet
        open={allOpen}
        emoji="🧑‍🎤"
        onPick={(e) => pick({ type: 'emoji', emoji: e })}
        onClose={() => setAllOpen(false)}
      />
    </div>,
    document.body
  );
}
