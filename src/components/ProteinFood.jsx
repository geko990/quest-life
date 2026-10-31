import React, { useEffect, useRef, useState } from 'react';
import { _t } from '../i18n';
import { PROTEIN_SNAP, proteinStatus, fmtGrams } from '../utils/proteins';

// Finestra "Apporto Proteico": il cibo si consuma man mano che si registrano proteine.
//   onnivora → coscia di pollo mangiata a morsi fino all'osso
//   vegetariana → uovo sodo nel portauovo, mangiato a morsi (si vede il tuorlo) fino al portauovo vuoto
//   vegana → ciotola di legumi che si svuota fino alla ciotola pulita
// L'obiettivo è il cibo finito; oltre compare un boccone extra dorato con i grammi in più.
// Trascinando il dito dall'alto verso il basso si "mangia" (blocchi da 5 g).

const VB_W = 150, VB_H = 240;
const MEAT = 'M 75 14 C 122 14 130 68 120 104 C 112 132 94 148 82 154 L 68 154 C 56 148 38 132 30 104 C 20 68 28 14 75 14 Z';

// Altezza del morso: da dove a dove scende il taglio per ogni cibo (0 g → obiettivo)
const RANGE = {
  omnivore: [4, 152],
  vegetarian: [34, 150],
  vegan: [62, 142],
};

const animOn = () => {
  try {
    if (document.documentElement.getAttribute('data-animations') === 'off') return false;
    return !window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  } catch (_) { return true; }
};

// Fagioli della ciotola: posizioni fisse (sempre uguali)
const BEANS = (() => {
  const out = [];
  const colors = ['#8b3a2b', '#c99a4a', '#6b8f3a', '#a0522d', '#d8b56a', '#7a2f24'];
  let seed = 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let i = 0; i < 70; i++) {
    const x = 34 + rnd() * 82;
    const y = 66 + rnd() * 78;
    out.push({ x, y, rx: 5 + rnd() * 2.5, ry: 3.4 + rnd() * 1.6, rot: Math.round(rnd() * 180), c: colors[Math.floor(rnd() * colors.length)] });
  }
  return out.sort((a, b) => a.y - b.y);
})();

export default function ProteinFood({ grams, goal, diet = 'omnivore', onChange }) {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const gr = Math.max(0, Number(grams) || 0);
  const t = Math.max(1, Number(goal) || 100);
  const status = proteinStatus(gr, t);
  const [top, bottom] = RANGE[diet] || RANGE.omnivore;
  const uid = useRef(`pf${Math.random().toString(36).slice(2, 7)}`).current;

  // Valore mostrato: scorre verso quello vero (all'apertura parte dal cibo intero)
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);
  useEffect(() => {
    if (dragging || !animOn()) { shownRef.current = gr; setShown(gr); return; }
    const from = shownRef.current, to = gr, t0 = performance.now(), dur = from === 0 ? 1000 : 550;
    let raf;
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      const v = from + (to - from) * (1 - Math.pow(1 - k, 3));
      shownRef.current = v; setShown(v);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gr, dragging]);

  const frac = Math.min(1, shown / t);
  const cutY = top + (bottom - top) * frac;

  const gramsAt = (clientY) => {
    const svg = svgRef.current;
    if (!svg) return gr;
    const r = svg.getBoundingClientRect();
    const y = (clientY - r.top) * (VB_H / r.height);
    const f = Math.max(0, Math.min(1, (y - top) / (bottom - top)));
    return Math.round((f * t) / PROTEIN_SNAP) * PROTEIN_SNAP;
  };
  const lastRef = useRef(gr);
  const setFromPointer = (e) => {
    let v = Math.min(t, gramsAt(e.clientY));
    if (gr > t && v === t) return; // oltre l'obiettivo resta il valore finché il dito non risale
    if (v !== lastRef.current) {
      lastRef.current = v;
      try { if (navigator.vibrate) navigator.vibrate(5); } catch (_) {}
      onChange(v);
    }
  };
  const onDown = (e) => {
    e.preventDefault();
    lastRef.current = gr;
    setDragging(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    setFromPointer(e);
  };
  const onMove = (e) => { if (dragging) setFromPointer(e); };
  const onUp = (e) => {
    setDragging(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
  };

  // Maschera del morso: resta solo ciò che sta sotto il taglio, con il bordo a morsi (tranne la ciotola)
  const bites = diet === 'vegan' ? [] : Array.from({ length: 9 }, (_, i) => 22 + i * 13.5);
  const mask = (
    <mask id={`${uid}-bite`} maskUnits="userSpaceOnUse" x="0" y="0" width={VB_W} height={VB_H}>
      <rect x="0" y={cutY} width={VB_W} height={VB_H} fill="#fff" />
      {bites.map((x, i) => <circle key={i} cx={x} cy={cutY + (i % 2 ? 2 : 0)} r={i % 3 === 0 ? 9 : 7.5} fill="#000" />)}
    </mask>
  );

  // Ciotola: il mucchio di legumi si abbassa mantenendo la forma a cupola
  const moundH = Math.max(0, 144 - cutY);
  const moundPath = `M 30 144 C 30 ${144 - moundH * 0.75} ${50} ${cutY} 75 ${cutY} C 100 ${cutY} 120 ${144 - moundH * 0.75} 120 144 Z`;

  const extraEmoji = diet === 'vegan' ? '🫘' : diet === 'vegetarian' ? '🥚' : '🍗';

  return (
    <div className={`pf-wrap is-${diet}${status.kind !== 'below' ? ' is-goal' : ''}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="pf-svg"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={t}
        aria-valuenow={gr}
        aria-label={_t("Trascina in giù per mangiare")}
      >
        <defs>
          {mask}
          <radialGradient id={`${uid}-meat`} cx="40%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#f2b25c" />
            <stop offset="55%" stopColor="#c9732c" />
            <stop offset="100%" stopColor="#8a4517" />
          </radialGradient>
          <linearGradient id={`${uid}-bone`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#e8dcc0" />
            <stop offset="50%" stopColor="#fbf5e6" />
            <stop offset="100%" stopColor="#d9caa6" />
          </linearGradient>
          <radialGradient id={`${uid}-egg`} cx="38%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#efe4cf" />
          </radialGradient>
          <linearGradient id={`${uid}-cup`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--pf-cup-a)" />
            <stop offset="50%" stopColor="var(--pf-cup-b)" />
            <stop offset="100%" stopColor="var(--pf-cup-a)" />
          </linearGradient>
          <clipPath id={`${uid}-meatclip`}><path d={MEAT} /></clipPath>
          <clipPath id={`${uid}-mound`}><path d={moundPath} /></clipPath>
        </defs>

        {diet === 'omnivore' && (
          <g>
            {/* Osso (sotto la carne: si vede tutto quando la coscia è finita) */}
            <circle cx="75" cy="56" r="8" fill={`url(#${uid}-bone)`} />
            <path d="M 70 60 L 80 60 L 82 196 L 68 196 Z" fill={`url(#${uid}-bone)`} />
            <circle cx="64" cy="204" r="11" fill={`url(#${uid}-bone)`} />
            <circle cx="86" cy="204" r="11" fill={`url(#${uid}-bone)`} />
            <circle cx="75" cy="200" r="9" fill={`url(#${uid}-bone)`} />
            <path d="M 70 60 L 80 60 L 82 196 L 68 196 Z" fill="none" stroke="rgba(150,120,80,0.35)" strokeWidth="1.2" />
            {/* Carne a morsi */}
            <g mask={`url(#${uid}-bite)`}>
              <path d={MEAT} fill={`url(#${uid}-meat)`} />
              <ellipse cx="58" cy="52" rx="13" ry="20" fill="rgba(255,235,190,0.35)" transform="rotate(-18 58 52)" />
              {[[92, 40], [100, 78], [52, 96], [86, 118], [64, 70], [78, 134]].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={i % 2 ? 2.2 : 3} fill="rgba(110,50,15,0.35)" />
              ))}
              {/* Taglio del morso: carne chiara sotto la crosta */}
              <rect x="0" y={cutY} width={VB_W} height="7" fill="#f3d3a6" clipPath={`url(#${uid}-meatclip)`} opacity={frac > 0.01 && frac < 0.99 ? 0.9 : 0} />
            </g>
          </g>
        )}

        {diet === 'vegetarian' && (
          <g>
            {/* Portauovo */}
            <path d="M 40 150 C 42 178 56 190 75 190 C 94 190 108 178 110 150 Z" fill={`url(#${uid}-cup)`} />
            <rect x="66" y="188" width="18" height="16" fill={`url(#${uid}-cup)`} />
            <ellipse cx="75" cy="208" rx="30" ry="7" fill={`url(#${uid}-cup)`} />
            <ellipse cx="75" cy="150" rx="35" ry="7" fill="var(--pf-cup-in)" />
            {/* Uovo a morsi, con il tuorlo che si vede nel taglio */}
            <g mask={`url(#${uid}-bite)`}>
              <ellipse cx="75" cy="98" rx="34" ry="52" fill={`url(#${uid}-egg)`} />
              <ellipse cx="62" cy="74" rx="8" ry="14" fill="rgba(255,255,255,0.7)" transform="rotate(-15 62 74)" />
              <clipPath id={`${uid}-yolkband`}><rect x="0" y={cutY} width={VB_W} height="18" /></clipPath>
              <circle cx="75" cy="108" r="21" fill="#f5b316" clipPath={`url(#${uid}-yolkband)`} opacity={frac > 0.01 && frac < 0.99 ? 1 : 0} />
            </g>
            <path d="M 40 150 C 42 178 56 190 75 190 C 94 190 108 178 110 150" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          </g>
        )}

        {diet === 'vegan' && (
          <g>
            <ellipse cx="75" cy="144" rx="52" ry="11" fill="var(--pf-cup-in)" />
            {/* Legumi nella ciotola: il mucchio si abbassa */}
            <g>
              <g clipPath={`url(#${uid}-mound)`}>
                <path d={moundPath} fill="#6b3a24" />
                {BEANS.map((b, i) => (
                  <ellipse key={i} cx={b.x} cy={b.y} rx={b.rx} ry={b.ry} fill={b.c} transform={`rotate(${b.rot} ${b.x} ${b.y})`} stroke="rgba(0,0,0,0.18)" strokeWidth="0.6" />
                ))}
              </g>
            </g>
            {/* Ciotola (il fondo interno è disegnato prima dei legumi) */}
            <path d="M 23 144 C 25 182 48 204 75 204 C 102 204 125 182 127 144 C 118 152 100 156 75 156 C 50 156 32 152 23 144 Z" fill={`url(#${uid}-cup)`} />
            <ellipse cx="75" cy="208" rx="24" ry="5" fill={`url(#${uid}-cup)`} />
            <path d="M 30 160 C 36 182 52 194 70 197" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}
      </svg>

      {/* Briciole e scintille quando il cibo è finito */}
      {status.kind !== 'below' && <div className="pf-done" aria-hidden="true">✨</div>}

      {/* Boccone extra dorato oltre l'obiettivo */}
      {status.kind === 'extra' && (
        <div className="pf-extra" key="extra">
          <span className="pf-extra-emoji">{extraEmoji}</span>
          <span className="pf-extra-text">+{fmtGrams(status.extra)} g</span>
        </div>
      )}
    </div>
  );
}
