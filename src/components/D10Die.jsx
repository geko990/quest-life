import React from 'react';

// Dado a 10 facce (#64) per "È il tuo turno!": la 🎲 delle emoji ha 6 facce, il nostro è un D10.
// Disegnato in SVG come un trapezoedro pentagonale visto di fronte (faccia ad aquilone al centro,
// due facce laterali sopra e due sotto), con le sfumature morbide delle Fluent Emoji e il colore dei
// dettagli dell'app. Sulla faccia davanti il valore (10 … 100), che cambia mentre il dado rotola.
export default function D10Die({ value = '', size = 96 }) {
  const T = '50,4', L = '6,46', R = '94,46', LL = '8,64', RL = '92,64', B = '50,108';
  const FL = '23,54', FR = '77,54', FB = '50,76';
  return (
    <svg className="d10-die" width={size} height={size * 1.08} viewBox="0 0 100 112" aria-hidden="true">
      <defs>
        <linearGradient id="d10-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'color-mix(in srgb, var(--accent-secondary, #a78bfa) 70%, #fff)' }} />
          <stop offset="1" style={{ stopColor: 'var(--accent-secondary, #a78bfa)' }} />
        </linearGradient>
        <linearGradient id="d10-side" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--accent-secondary, #a78bfa)' }} />
          <stop offset="1" style={{ stopColor: 'var(--accent-primary, #7c3aed)' }} />
        </linearGradient>
        <linearGradient id="d10-low" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--accent-primary, #7c3aed)' }} />
          <stop offset="1" style={{ stopColor: 'color-mix(in srgb, var(--accent-primary, #7c3aed) 65%, #1e1033)' }} />
        </linearGradient>
      </defs>
      <g strokeLinejoin="round" strokeWidth="2.4" style={{ stroke: 'color-mix(in srgb, var(--accent-primary, #7c3aed) 55%, #1e1033)' }}>
        <polygon points={`${T} ${L} ${LL} ${FL}`} fill="url(#d10-side)" />
        <polygon points={`${T} ${FR} ${RL} ${R}`} fill="url(#d10-side)" opacity="0.92" />
        <polygon points={`${FL} ${LL} ${B} ${FB}`} fill="url(#d10-low)" />
        <polygon points={`${FR} ${FB} ${B} ${RL}`} fill="url(#d10-low)" opacity="0.85" />
        <polygon points={`${T} ${FL} ${FB} ${FR}`} fill="url(#d10-front)" />
      </g>
      {/* riflesso morbido in alto, come nelle Fluent */}
      <path d="M50 10 L30 44 Q38 40 50 38 Z" fill="#fff" opacity="0.28" />
      <text x="50" y="58" textAnchor="middle" dominantBaseline="middle" fontSize={String(value).length > 2 ? 17 : 21} fontWeight="900"
        style={{ fontFamily: 'inherit', fill: 'color-mix(in srgb, var(--accent-primary, #7c3aed) 75%, #1e1033)' }}>{value}</text>
    </svg>
  );
}
