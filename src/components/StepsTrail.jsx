import React, { useEffect, useRef, useState } from 'react';
import { _t } from '../i18n';
import { STEP_SNAP, trailCapacity, stepsStatus, fmtSteps } from '../utils/steps';

// Finestra "Registro Passi": un sentiero di montagna. I passi di oggi portano l'escursionista su per i
// tornanti fino alla vetta con la bandierina (= obiettivo); oltre l'obiettivo si prosegue sulla cresta
// dorata verso la cima più alta (circa 1,3 volte l'obiettivo). Si può trascinare il dito lungo il sentiero.

const VB_W = 150, VB_H = 240;
const FRONT = [[14, 228], [100, 212], [34, 184], [94, 160], [42, 132], [86, 108], [64, 74]];
const RIDGE = [[64, 74], [80, 62], [94, 56], [112, 28]];

const segLens = (poly) => poly.slice(1).map((p, i) => Math.hypot(p[0] - poly[i][0], p[1] - poly[i][1]));
const FRONT_L = segLens(FRONT), RIDGE_L = segLens(RIDGE);
const total = (ls) => ls.reduce((a, b) => a + b, 0);
const FRONT_T = total(FRONT_L), RIDGE_T = total(RIDGE_L);

function pointAt(poly, lens, frac) {
  let d = Math.max(0, Math.min(1, frac)) * total(lens);
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const t = lens[i] ? Math.min(1, d / lens[i]) : 0;
      return [poly[i][0] + (poly[i + 1][0] - poly[i][0]) * t, poly[i][1] + (poly[i + 1][1] - poly[i][1]) * t];
    }
    d -= lens[i];
  }
  return poly[poly.length - 1];
}

// Punto del sentiero più vicino al dito → frazione lungo il tratto
function nearest(poly, lens, x, y) {
  let best = { dist: Infinity, frac: 0 };
  let acc = 0;
  const T = total(lens);
  for (let i = 0; i < lens.length; i++) {
    const [ax, ay] = poly[i], [bx, by] = poly[i + 1];
    const vx = bx - ax, vy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy || 1)));
    const px = ax + vx * t, py = ay + vy * t;
    const dist = Math.hypot(x - px, y - py);
    if (dist < best.dist) best = { dist, frac: (acc + lens[i] * t) / T };
    acc += lens[i];
  }
  return best;
}

const pts = (poly) => poly.map(p => p.join(',')).join(' ');
const animOn = () => {
  try {
    if (document.documentElement.getAttribute('data-animations') === 'off') return false;
    return !window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  } catch (_) { return true; }
};

export default function StepsTrail({ steps, goal, onChange }) {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const s = Math.max(0, Number(steps) || 0);
  const g = Math.max(1, Number(goal) || 8000);
  const cap = trailCapacity(g);
  const status = stepsStatus(s, g);

  // Valore mostrato: scorre verso quello vero (all'apertura parte da zero), così l'escursionista cammina sul sentiero
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);
  useEffect(() => {
    if (dragging || !animOn()) { shownRef.current = s; setShown(s); return; }
    const from = shownRef.current, to = s, t0 = performance.now(), dur = from === 0 ? 1100 : 650;
    let raf;
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      const v = from + (to - from) * e;
      shownRef.current = v; setShown(v);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [s, dragging]);

  const frontFrac = Math.min(1, shown / g);
  const ridgeFrac = shown > g ? Math.min(1, (shown - g) / (cap - g)) : 0;
  const walker = shown <= g ? pointAt(FRONT, FRONT_L, frontFrac) : pointAt(RIDGE, RIDGE_L, ridgeFrac);
  const atTop = s >= cap;

  const stepsAt = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return s;
    const r = svg.getBoundingClientRect();
    const x = (clientX - r.left) * (VB_W / r.width), y = (clientY - r.top) * (VB_H / r.height);
    const f = nearest(FRONT, FRONT_L, x, y), rr = nearest(RIDGE, RIDGE_L, x, y);
    const v = f.dist <= rr.dist ? f.frac * g : g + rr.frac * (cap - g);
    return Math.max(0, Math.min(cap, Math.round(v / STEP_SNAP) * STEP_SNAP));
  };
  const lastRef = useRef(s);
  const setFromPointer = (e) => {
    const v = stepsAt(e.clientX, e.clientY);
    if (s > cap && v === cap) return;
    if (v !== lastRef.current) {
      lastRef.current = v;
      try { if (navigator.vibrate) navigator.vibrate(5); } catch (_) {}
      onChange(v);
    }
  };
  const onDown = (e) => {
    e.preventDefault();
    lastRef.current = s;
    setDragging(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    setFromPointer(e);
  };
  const onMove = (e) => { if (dragging) setFromPointer(e); };
  const onUp = (e) => {
    setDragging(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
  };

  const pct = (p) => ({ left: `${(p[0] / VB_W) * 100}%`, top: `${(p[1] / VB_H) * 100}%` });
  const fmt = (n) => fmtSteps(n);

  return (
    <div className={`st-wrap${status.kind !== 'below' ? ' is-goal' : ''}${atTop ? ' is-top' : ''}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="st-svg"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={cap}
        aria-valuenow={s}
        aria-label={_t("Trascina lungo il sentiero")}
      >
        <defs>
          <linearGradient id="stFront" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--st-mount-top)" />
            <stop offset="100%" stopColor="var(--st-mount-bottom)" />
          </linearGradient>
          <radialGradient id="stSun">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>
        </defs>

        {/* Sole: si accende all'obiettivo */}
        <circle className="st-sun-glow" cx="28" cy="40" r="22" fill="#fbbf24" />
        <circle className="st-sun" cx="28" cy="40" r="12" fill="url(#stSun)" />

        {/* Montagne: dietro la cima più alta con la neve, davanti quella dell'obiettivo */}
        <polygon points="44,236 112,20 152,236" fill="var(--st-mount-back)" />
        <polygon points="104,46 112,20 120,46 116,42 112,47 108,42" fill="var(--st-snow)" />
        <polygon points="-4,236 64,66 146,236" fill="url(#stFront)" />

        {/* Sentiero da fare (tratteggiato) e fatto (pieno) */}
        <polyline points={pts(FRONT)} fill="none" stroke="var(--st-trail)" strokeWidth="3" strokeDasharray="1.5 5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={pts(RIDGE)} fill="none" stroke="var(--st-trail)" strokeWidth="3" strokeDasharray="1.5 5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={pts(FRONT)} fill="none" stroke="#4ade80" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={`${Math.max(0.01, FRONT_T * frontFrac)} ${FRONT_T + 10}`} className="st-walked" />
        {ridgeFrac > 0 && (
          <polyline points={pts(RIDGE)} fill="none" stroke="#fbbf24" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={`${Math.max(0.01, RIDGE_T * ridgeFrac)} ${RIDGE_T + 10}`} className="st-walked st-walked-extra" />
        )}
        <circle cx={FRONT[0][0]} cy={FRONT[0][1]} r="3.5" fill="#4ade80" />
      </svg>

      {/* Bandierina della vetta (obiettivo), stella sulla cima più alta, escursionista */}
      <div className="st-flag" style={pct([64, 74])}>🚩</div>
      <div className="st-goal-tag" style={pct([64, 74])}>{fmt(g)}</div>
      {atTop && <div className="st-star" style={pct([112, 22])}>⭐</div>}
      <div className={`st-walker${dragging ? ' is-dragging' : ''}`} style={pct(walker)}>🚶</div>
    </div>
  );
}
