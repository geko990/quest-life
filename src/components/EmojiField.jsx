import React, { useState } from 'react';
import { _t } from '../i18n';
import EmojiPickerSheet from './EmojiPickerSheet';

// Campo "emoji" usato in tutta l'app: mostra l'emoji scelta (con lo stesso aspetto della vecchia casella,
// grazie a className/style) e al tocco apre il selettore EmojiPickerSheet. onChange riceve l'emoji scelta.
export default function EmojiField({ value, onChange, className, style, color, fallback = '🙂', title }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={`emoji-field ${className || ''}`}
        style={style}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        title={title || _t("Tocca per scegliere l'emoji")}
        aria-label={title || _t("Tocca per scegliere l'emoji")}
      >
        {value || fallback}
      </button>
      <EmojiPickerSheet
        open={open}
        emoji={value || fallback}
        color={color}
        onPick={(e) => onChange && onChange(e)}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
