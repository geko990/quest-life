import React, { useState } from 'react';
import { _t } from '../i18n';
import Icon from './Icon';
import StatIconPickerSheet from './StatIconPickerSheet';

// Campo "Simbolo" di attributi e abilità (#53): mostra l'icona Solar scelta e apre il pannello di scelta.
export default function StatIconField({ value, onChange, className, style, color = 'var(--accent-primary)' }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={className}
        style={{ display: 'grid', placeItems: 'center', cursor: 'pointer', color, ...style }}
        onClick={() => setOpen(true)}
        title={_t("Scegli il simbolo")}
        aria-label={_t("Scegli il simbolo")}
      >
        {value ? <Icon name={value} variant="bold-duotone" size="24px" /> : '?'}
      </button>
      <StatIconPickerSheet open={open} value={value} color={color} onPick={onChange} onClose={() => setOpen(false)} />
    </>
  );
}
