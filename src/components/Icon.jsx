import React from 'react';
import { SOLAR } from '../utils/solarIcons';

// Icona del pacchetto Solar (#53). `name` senza variante (es. "rocket"), `variant`:
// 'linear' (vuota), 'bold' (piena) o 'bold-duotone' (bicolore piena, quella delle tessere).
// Prende il colore del testo (currentColor) e la misura dal font-size del contenitore, salvo `size`.
// Le icone disponibili sono quelle elencate in scripts/make-icons.py.
export default function Icon({ name, variant = 'bold-duotone', size, className, style, title }) {
  const body = SOLAR[`${name}-${variant}`];
  if (!body) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size || '1em'}
      height={size || '1em'}
      className={className}
      style={{ display: 'block', flexShrink: 0, ...style }}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      dangerouslySetInnerHTML={{ __html: (title ? `<title>${title}</title>` : '') + body }}
    />
  );
}
