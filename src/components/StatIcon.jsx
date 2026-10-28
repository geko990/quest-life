import React from 'react';
import Icon from './Icon';
import { statSolar, statEmoji, statColor } from '../utils/statIcons';

// Simbolo di un attributo/abilità (#53): icona Solar bicolore nel colore dell'attributo;
// se l'utente aveva scelto un'emoji senza equivalente, resta quell'emoji.
// `colored={false}` lascia il colore del testo intorno.
export default function StatIcon({ stat, size, colored = true, style, className }) {
  const solar = statSolar(stat);
  if (solar) {
    return (
      <span className={className} style={{ display: 'inline-flex', verticalAlign: '-0.15em', color: colored ? statColor(stat) : undefined, fontSize: size, ...style }}>
        <Icon name={solar} variant="bold-duotone" />
      </span>
    );
  }
  return <span className={className} style={{ fontSize: size, ...style }}>{statEmoji(stat)}</span>;
}
