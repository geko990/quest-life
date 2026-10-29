import React from 'react';
import { _t } from '../i18n';
import { CARD_COLORS, getCardColorVars } from '../utils/accounts';

// Fila di colori per le carte dei conti (#59). Ogni pallino usa le stesse variabili della carta,
// così in tema chiaro mostra il pastello e in tema scuro la versione profonda.
const NAMES = {
  sky: () => _t("Azzurro"),
  lavender: () => _t("Lavanda"),
  mint: () => _t("Menta"),
  aqua: () => _t("Acqua"),
  peach: () => _t("Pesca"),
  rose: () => _t("Rosa"),
  butter: () => _t("Burro"),
  stone: () => _t("Pietra"),
};

export default function CardColorPicker({ value, onChange, className = '' }) {
  return (
    <div className={`acc-swatches ${className}`} role="radiogroup" aria-label={_t("Colore della carta")}>
      {CARD_COLORS.map(c => {
        const selected = c.id === value;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={NAMES[c.id] ? NAMES[c.id]() : c.id}
            title={NAMES[c.id] ? NAMES[c.id]() : c.id}
            className={`acc-swatch${selected ? ' is-selected' : ''}`}
            style={getCardColorVars(c.id)}
            onClick={(e) => { e.stopPropagation(); onChange(c.id); }}
          />
        );
      })}
    </div>
  );
}
