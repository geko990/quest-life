import React, { useEffect, useRef, useState } from 'react';
import { _t } from '../i18n';
import { proteinStatus, fmtGrams } from '../utils/proteins';

// Finestra "Apporto Proteico": il cibo si consuma A MORSI man mano che si registrano proteine.
//   onnivora → coscia di pollo morsa un boccone alla volta fino all'osso (nei morsi si vede la carne chiara)
//   vegetariana → uovo sodo nel portauovo, a morsi (nei morsi vicino al centro compare il tuorlo)
//   vegana → ciotola di legumi che si abbassa a cucchiaiate fino alla ciotola vuota
// L'obiettivo è il cibo finito; oltre compare un boccone extra dorato con i grammi in più.
// Non si modifica a mano: segue i grammi dei cibi di "Mangiato oggi". Un tocco sul cibo fa rivedere la
// giornata: il cibo torna intero e viene morso cibo dopo cibo (con la sua emoji e i grammi) fino a oggi.

const VB_W = 150, VB_H = 240;
const MEAT = 'M 75 14 C 122 14 130 68 120 104 C 112 132 94 148 82 154 L 68 154 C 56 148 38 132 30 104 C 20 68 28 14 75 14 Z';
const EGG = { cx: 75, cy: 98, rx: 34, ry: 52 };

const animOn = () => {
  try {
    if (document.documentElement.getAttribute('data-animations') === 'off') return false;
    return !window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  } catch (_) { return true; }
};

// Generatore pseudo-casuale fisso (stessi morsi a ogni apertura)
const rng = (seed) => () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

// Punti dei morsi: una griglia sfalsata che copre tutto il cibo, ordinata dall'alto verso il basso
// alternando i bordi, così si mangia come si farebbe davvero. Calcolata una volta per forma.
const biteCache = {};
function getBites(diet) {
  if (biteCache[diet]) return biteCache[diet];
  let inside;
  if (diet === 'vegetarian') {
    inside = (x, y) => ((x - EGG.cx) / EGG.rx) ** 2 + ((y - EGG.cy) / EGG.ry) ** 2 <= 1;
  } else {
    let ctx = null, path = null;
    try {
      ctx = document.createElement('canvas').getContext('2d');
      path = new Path2D(MEAT);
    } catch (_) {}
    inside = (x, y) => (ctx && path) ? ctx.isPointInPath(path, x, y)
      : ((x - 75) / 48) ** 2 + ((y - 84) / 70) ** 2 <= 1;
  }
  const near = (x, y) => [[0, 0], [7, 0], [-7, 0], [0, 7], [0, -7]].some(([dx, dy]) => inside(x + dx, y + dy));
  const r = rng(diet === 'vegetarian' ? 11 : 5);
  const out = [];
  const [y0, y1] = diet === 'vegetarian' ? [40, 152] : [10, 158];
  let row = 0;
  for (let y = y0; y <= y1; y += 14, row++) {
    const pts = [];
    for (let x = 18 + (row % 2) * 7; x <= 134; x += 14) {
      const jx = x + (r() - 0.5) * 5, jy = y + (r() - 0.5) * 5;
      if (near(jx, jy)) pts.push([jx, jy]);
    }
    // in ogni fila si morde dai bordi verso il centro, alternando sinistra e destra
    const ordered = [];
    let a = 0, b = pts.length - 1, left = row % 2 === 0;
    while (a <= b) { ordered.push(left ? pts[a++] : pts[b--]); left = !left; }
    out.push(...ordered);
  }
  biteCache[diet] = out;
  return out;
}

// Un morso: cerchio centrale + piccoli cerchi intorno (il bordo frastagliato dei denti)
function Bite({ x, y, s = 1, rot = 0 }) {
  if (s <= 0.02) return null;
  const R = 10 * s, r = 5.6 * s, d = 9 * s;
  return (
    <g transform={`rotate(${rot} ${x} ${y})`}>
      <circle cx={x} cy={y} r={R} />
      {[0, 60, 120, 180, 240, 300].map(a => (
        <circle key={a} cx={x + Math.cos((a * Math.PI) / 180) * d} cy={y + Math.sin((a * Math.PI) / 180) * d} r={r} />
      ))}
    </g>
  );
}

// Fagioli della ciotola: posizioni fisse (sempre uguali)
const BEANS = (() => {
  const out = [];
  const colors = ['#8b3a2b', '#c99a4a', '#6b8f3a', '#a0522d', '#d8b56a', '#7a2f24'];
  const r = rng(7);
  for (let i = 0; i < 70; i++) {
    const x = 34 + r() * 82;
    const y = 66 + r() * 78;
    out.push({ x, y, rx: 5 + r() * 2.5, ry: 3.4 + r() * 1.6, rot: Math.round(r() * 180), c: colors[Math.floor(r() * colors.length)] });
  }
  return out.sort((a, b) => a.y - b.y);
})();

const wait = (ms) => new Promise(res => setTimeout(res, ms));

export default function ProteinFood({ grams, goal, diet = 'omnivore', foods = [] }) {
  const gr = Math.max(0, Number(grams) || 0);
  const t = Math.max(1, Number(goal) || 100);
  const status = proteinStatus(gr, t);
  const uid = useRef(`pf${Math.random().toString(36).slice(2, 7)}`).current;

  // Valore mostrato (grammi "mangiati" nel disegno): scorre verso quello vero; il rivedere la giornata lo guida a mano
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);
  const rafRef = useRef(0);
  const [replaying, setReplaying] = useState(false);
  const replayRef = useRef(false);
  const [bubble, setBubble] = useState(null);

  const tweenTo = (to, dur) => new Promise(res => {
    cancelAnimationFrame(rafRef.current);
    const from = shownRef.current, t0 = performance.now();
    if (dur <= 0 || from === to) { shownRef.current = to; setShown(to); res(); return; }
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      const v = from + (to - from) * (1 - Math.pow(1 - k, 3));
      shownRef.current = v; setShown(v);
      if (k < 1) rafRef.current = requestAnimationFrame(tick); else res();
    };
    rafRef.current = requestAnimationFrame(tick);
  });

  useEffect(() => {
    if (replayRef.current) return;
    tweenTo(gr, animOn() ? (shownRef.current === 0 ? 1000 : 550) : 0);
    return () => cancelAnimationFrame(rafRef.current);
  }, [gr]);

  // Rivedi la giornata: il cibo torna intero, poi un morso (o più) per ogni cibo registrato oggi
  const replay = async () => {
    if (replayRef.current || !animOn() || gr <= 0) return;
    replayRef.current = true; setReplaying(true);
    try {
      await tweenTo(0, 450);
      await wait(250);
      let cum = 0;
      const list = foods.filter(f => Number(f.proteins) > 0);
      for (let i = 0; i < list.length; i++) {
        const f = list[i];
        cum = Math.min(gr, cum + Number(f.proteins));
        setBubble({ key: i, emoji: f.emoji || '🍽️', text: `+${fmtGrams(f.proteins)} g` });
        try { if (navigator.vibrate) navigator.vibrate(8); } catch (_) {}
        await tweenTo(cum, Math.min(900, 350 + Number(f.proteins) * 6));
        await wait(220);
      }
      if (cum < gr) await tweenTo(gr, 400);
    } finally {
      setBubble(null);
      replayRef.current = false; setReplaying(false);
    }
  };

  const frac = Math.min(1, shown / t);
  const bites = diet === 'vegan' ? [] : getBites(diet);
  const exact = frac * bites.length;
  const n = Math.floor(exact);
  const partial = exact - n;
  const done = frac >= 0.999;
  const rot = (i) => (i * 47) % 360;
  const biteList = (scale) => bites.slice(0, n + 1).map(([x, y], i) => (
    <Bite key={i} x={x} y={y} rot={rot(i)} s={(i < n ? 1 : partial) * scale} />
  ));

  // Ciotola: il mucchio di legumi si abbassa a cucchiaiate mantenendo la forma a cupola
  const cutY = 62 + (142 - 62) * frac;
  const moundH = Math.max(0, 144 - cutY);
  const moundPath = `M 30 144 C 30 ${144 - moundH * 0.75} 50 ${cutY} 75 ${cutY} C 100 ${cutY} 120 ${144 - moundH * 0.75} 120 144 Z`;

  const extraEmoji = diet === 'vegan' ? '🫘' : diet === 'vegetarian' ? '🥚' : '🍗';

  return (
    <div
      className={`pf-wrap is-${diet}${status.kind !== 'below' ? ' is-goal' : ''}${replaying ? ' is-replaying' : ''}`}
      onClick={replay}
      role="button"
      aria-label={_t("Rivedi i morsi di oggi")}
    >
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="pf-svg" aria-hidden="true">
        <defs>
          {/* Crosta: sparisce dove c'è il morso. Interno: sparisce in un morso un po' più piccolo (resta un bordo chiaro) */}
          <mask id={`${uid}-crust`} maskUnits="userSpaceOnUse" x="0" y="0" width={VB_W} height={VB_H}>
            <rect x="0" y="0" width={VB_W} height={VB_H} fill="#fff" />
            <g fill="#000">{biteList(1)}</g>
          </mask>
          <mask id={`${uid}-flesh`} maskUnits="userSpaceOnUse" x="0" y="0" width={VB_W} height={VB_H}>
            <rect x="0" y="0" width={VB_W} height={VB_H} fill="#fff" />
            <g fill="#000">{biteList(0.72)}</g>
          </mask>
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
          <clipPath id={`${uid}-eggclip`}><ellipse cx={EGG.cx} cy={EGG.cy} rx={EGG.rx} ry={EGG.ry} /></clipPath>
          <clipPath id={`${uid}-mound`}><path d={moundPath} /></clipPath>
        </defs>

        {diet === 'omnivore' && (
          <g>
            {/* Osso (sotto la carne: si vede tra i morsi e tutto quando la coscia è finita) */}
            <circle cx="75" cy="56" r="8" fill={`url(#${uid}-bone)`} />
            <path d="M 70 60 L 80 60 L 82 196 L 68 196 Z" fill={`url(#${uid}-bone)`} />
            <circle cx="64" cy="204" r="11" fill={`url(#${uid}-bone)`} />
            <circle cx="86" cy="204" r="11" fill={`url(#${uid}-bone)`} />
            <circle cx="75" cy="200" r="9" fill={`url(#${uid}-bone)`} />
            <path d="M 70 60 L 80 60 L 82 196 L 68 196 Z" fill="none" stroke="rgba(150,120,80,0.35)" strokeWidth="1.2" />
            <g className="pf-food" style={{ opacity: done ? 0 : 1 }}>
              {/* Carne chiara (si vede sul bordo dei morsi) */}
              <g mask={`url(#${uid}-flesh)`}>
                <path d={MEAT} fill="#f3d3a6" />
                <path d={MEAT} fill="none" stroke="#e8b97f" strokeWidth="1" />
              </g>
              {/* Crosta dorata */}
              <g mask={`url(#${uid}-crust)`}>
                <path d={MEAT} fill={`url(#${uid}-meat)`} />
                <ellipse cx="58" cy="52" rx="13" ry="20" fill="rgba(255,235,190,0.35)" transform="rotate(-18 58 52)" />
                {[[92, 40], [100, 78], [52, 96], [86, 118], [64, 70], [78, 134]].map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r={i % 2 ? 2.2 : 3} fill="rgba(110,50,15,0.35)" />
                ))}
              </g>
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
            <g className="pf-food" style={{ opacity: done ? 0 : 1 }}>
              {/* Interno: bianco con il tuorlo al centro (si vede nei morsi) */}
              <g mask={`url(#${uid}-flesh)`} clipPath={`url(#${uid}-eggclip)`}>
                <ellipse cx={EGG.cx} cy={EGG.cy} rx={EGG.rx} ry={EGG.ry} fill="#f4ecdc" />
                <circle cx="75" cy="106" r="20" fill="#f5b316" />
              </g>
              {/* Superficie dell'uovo */}
              <g mask={`url(#${uid}-crust)`}>
                <ellipse cx={EGG.cx} cy={EGG.cy} rx={EGG.rx} ry={EGG.ry} fill={`url(#${uid}-egg)`} />
                <ellipse cx="62" cy="74" rx="8" ry="14" fill="rgba(255,255,255,0.7)" transform="rotate(-15 62 74)" />
              </g>
            </g>
            <path d="M 40 150 C 42 178 56 190 75 190 C 94 190 108 178 110 150" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          </g>
        )}

        {diet === 'vegan' && (
          <g>
            <ellipse cx="75" cy="144" rx="52" ry="11" fill="var(--pf-cup-in)" />
            {/* Legumi nella ciotola: il mucchio si abbassa */}
            <g clipPath={`url(#${uid}-mound)`}>
              <path d={moundPath} fill="#6b3a24" />
              {BEANS.map((b, i) => (
                <ellipse key={i} cx={b.x} cy={b.y} rx={b.rx} ry={b.ry} fill={b.c} transform={`rotate(${b.rot} ${b.x} ${b.y})`} stroke="rgba(0,0,0,0.18)" strokeWidth="0.6" />
              ))}
            </g>
            {/* Ciotola */}
            <path d="M 23 144 C 25 182 48 204 75 204 C 102 204 125 182 127 144 C 118 152 100 156 75 156 C 50 156 32 152 23 144 Z" fill={`url(#${uid}-cup)`} />
            <ellipse cx="75" cy="208" rx="24" ry="5" fill={`url(#${uid}-cup)`} />
            <path d="M 30 160 C 36 182 52 194 70 197" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}
      </svg>

      {/* Scintille quando il cibo è finito */}
      {status.kind !== 'below' && !replaying && <div className="pf-done" aria-hidden="true">✨</div>}

      {/* Rivedi la giornata: il cibo di ogni morso con i suoi grammi */}
      {bubble && (
        <div className="pf-bubble" key={bubble.key}>
          <span className="pf-bubble-emoji">{bubble.emoji}</span>
          <span className="pf-bubble-text">{bubble.text}</span>
        </div>
      )}

      {/* Boccone extra dorato oltre l'obiettivo */}
      {status.kind === 'extra' && !replaying && (
        <div className="pf-extra" key="extra">
          <span className="pf-extra-emoji">{extraEmoji}</span>
          <span className="pf-extra-text">+{fmtGrams(status.extra)} g</span>
        </div>
      )}
    </div>
  );
}
