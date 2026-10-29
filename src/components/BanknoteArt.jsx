import React from 'react';

// Decorazioni della "banconota" dei Contanti (#59): una banconota inventata, non una copia di
// banconote vere. Onde di sicurezza (guilloche) e rosone a destra; la cornice doppia è in CSS (`.acc-note-frame`).
// Tutto in `currentColor`: il colore viene dalla carta (inchiostro del colore scelto).

const W = 200;
const H = 100;

// Onde sottili che attraversano la banconota, con fase diversa per ciascuna
const waves = Array.from({ length: 9 }, (_, i) => {
  const y0 = 18 + i * 8;
  const amp = 3 + (i % 3);
  const phase = i * 0.7;
  let d = '';
  for (let x = 6; x <= W - 6; x += 4) {
    const y = y0 + Math.sin(x / 11 + phase) * amp;
    d += `${x === 6 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return d.trim();
});

// Rosone: ellissi ruotate attorno allo stesso centro
const ROSETTE = { cx: 160, cy: 50 };
const petals = Array.from({ length: 18 }, (_, i) => i * 10);

export default function BanknoteArt() {
  return (
    <svg className="acc-note-art" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g className="acc-note-waves">
        {waves.map((d, i) => <path key={i} d={d} />)}
      </g>
      <g className="acc-note-rosette">
        {petals.map(r => (
          <ellipse key={r} cx={ROSETTE.cx} cy={ROSETTE.cy} rx="26" ry="9" transform={`rotate(${r} ${ROSETTE.cx} ${ROSETTE.cy})`} />
        ))}
        <circle cx={ROSETTE.cx} cy={ROSETTE.cy} r="30" />
        <circle cx={ROSETTE.cx} cy={ROSETTE.cy} r="7" />
      </g>
    </svg>
  );
}
