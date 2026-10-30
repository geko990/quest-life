import React, { useRef, useState, useEffect } from 'react';
import { _t, getLocale } from '../i18n';
import { carafeCapacity, glassesToLiters, waterStatus } from '../utils/hydration';

// Finestra "Registro Acqua": caraffa di vetro che si riempie un bicchiere alla volta.
// Si riempie anche trascinando il dito sulla caraffa (agganciata ai bicchieri).
// L'obiettivo è la linea tratteggiata a circa 3/4: sopra c'è la zona "extra", più chiara e frizzante;
// se si supera anche la capienza della caraffa, l'acqua trabocca dal beccuccio.

const VB_W = 150, VB_H = 240;
const Y_BOTTOM = 224;   // fondo interno
const Y_TOP = 44;       // livello a caraffa piena (capienza)

const BODY = 'M 38 14 L 104 14 Q 109 14 108 19 L 106 27 Q 104 35 104 45 C 104 62 122 74 122 104 L 122 204 Q 122 226 100 226 L 44 226 Q 22 226 22 204 L 22 104 C 22 74 40 62 40 45 Q 40 36 35 30 L 27 21 Q 24 14 38 14 Z';
const HANDLE = 'M 110 54 C 138 52 146 74 142 104 C 139 130 133 148 122 160';

const fmtL = (l) => l.toLocaleString(getLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export default function WaterCarafe({ glasses, goal, onChange }) {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const lastRef = useRef(glasses);
  const cap = carafeCapacity(goal);
  const g = Math.max(0, Number(glasses) || 0);
  const shown = Math.min(g, cap);
  const levelY = Y_BOTTOM - (shown / cap) * (Y_BOTTOM - Y_TOP);
  const goalY = Y_BOTTOM - (Math.min(goal, cap) / cap) * (Y_BOTTOM - Y_TOP);
  const status = waterStatus(g, goal);
  const overflow = g > cap;

  // Il livello parte da zero e sale all'apertura
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 60); return () => clearTimeout(t); }, []);
  const drawY = ready ? levelY : Y_BOTTOM + 4;

  const glassesAt = (clientY) => {
    const svg = svgRef.current;
    if (!svg) return g;
    const r = svg.getBoundingClientRect();
    const y = (clientY - r.top) * (VB_H / r.height);
    const v = Math.round(((Y_BOTTOM - y) / (Y_BOTTOM - Y_TOP)) * cap);
    return Math.max(0, Math.min(cap, v));
  };
  const setFromPointer = (e) => {
    const v = glassesAt(e.clientY);
    // oltre la capienza resta il valore attuale finché il dito non scende sotto il bordo
    if (g > cap && v === cap) return;
    if (v !== lastRef.current) {
      lastRef.current = v;
      try { if (navigator.vibrate) navigator.vibrate(6); } catch (_) {}
      onChange(v);
    }
  };
  const onDown = (e) => {
    e.preventDefault();
    lastRef.current = g;
    setDragging(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    setFromPointer(e);
  };
  const onMove = (e) => { if (dragging) setFromPointer(e); };
  const onUp = (e) => {
    setDragging(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
  };

  const ticks = [];
  for (let i = 1; i < cap; i++) {
    if (i === Number(goal)) continue;
    ticks.push(Y_BOTTOM - (i / cap) * (Y_BOTTOM - Y_TOP));
  }

  return (
    <div className={`wc-wrap${dragging ? ' is-dragging' : ''}${status.kind !== 'below' ? ' is-goal' : ''}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="wc-svg"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={cap}
        aria-valuenow={g}
        aria-label={_t("Trascina per riempire la caraffa")}
      >
        <defs>
          <clipPath id="wcBody"><path d={BODY} /></clipPath>
          <linearGradient id="wcWater" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="35%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#0e7490" />
          </linearGradient>
          <linearGradient id="wcExtra" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a5f3fc" />
            <stop offset="100%" stopColor="#5eead4" />
          </linearGradient>
          <linearGradient id="wcGlass" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--wc-glass-a)" />
            <stop offset="50%" stopColor="var(--wc-glass-b)" />
            <stop offset="100%" stopColor="var(--wc-glass-a)" />
          </linearGradient>
        </defs>

        {/* Manico e corpo di vetro */}
        <path d={HANDLE} fill="none" stroke="var(--wc-stroke)" strokeWidth="10" strokeLinecap="round" />
        <path d={HANDLE} fill="none" stroke="var(--wc-glass-b)" strokeWidth="5" strokeLinecap="round" />
        <path d={BODY} fill="url(#wcGlass)" />

        {/* Acqua */}
        <g clipPath="url(#wcBody)">
          <g className="wc-water" style={{ transform: `translateY(${drawY}px)` }}>
            <rect x="0" y="4" width={VB_W} height={VB_H} fill="url(#wcWater)" />
            <path className="wc-wave wc-wave-back" d="M -150 4 q 18.75 -6 37.5 0 t 37.5 0 t 37.5 0 t 37.5 0 t 37.5 0 t 37.5 0 t 37.5 0 t 37.5 0 t 37.5 0 t 37.5 0 t 37.5 0 t 37.5 0 V 9 H -150 Z" fill="#a5f3fc" opacity="0.5" />
            <path className="wc-wave" d="M -150 5 q 18.75 5 37.5 0 t 37.5 0 t 37.5 0 t 37.5 0 t 37.5 0 t 37.5 0 t 37.5 0 t 37.5 0 t 37.5 0 t 37.5 0 t 37.5 0 t 37.5 0 V 9 H -150 Z" fill="#67e8f9" />
            {g > 0 && [28, 52, 74, 96].map((x, i) => (
              <circle key={x} className="wc-bubble" cx={x} cy={Y_BOTTOM - drawY - 8} r={i % 2 ? 2 : 2.8}
                style={{ animationDelay: `${i * 0.7}s`, '--rise': `${-Math.max(10, Y_BOTTOM - drawY - 14)}px` }} />
            ))}
          </g>
          {/* Zona extra: oltre l'obiettivo l'acqua è più chiara */}
          {status.kind === 'extra' && ready && (
            <rect className="wc-extra" x="0" y={levelY + 4} width={VB_W} height={Math.max(0, goalY - levelY - 4)} fill="url(#wcExtra)" opacity="0.55" />
          )}
        </g>

        {/* Tacche dei bicchieri e linea dell'obiettivo */}
        {ticks.map((y, i) => <line key={i} x1="26" x2="33" y1={y} y2={y} stroke="var(--wc-tick)" strokeWidth="1.5" strokeLinecap="round" />)}
        <line x1="24" x2="120" y1={goalY} y2={goalY} stroke="#fbbf24" strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" className="wc-goal-line" />

        {/* Contorno e riflesso del vetro */}
        <path d={BODY} fill="none" stroke="var(--wc-stroke)" strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M 32 110 C 32 90 40 76 46 66" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" />
        <path d="M 31 124 L 31 196" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" strokeLinecap="round" />

        {/* Trabocca: gocce dal beccuccio */}
        {overflow && [0, 1, 2].map(i => (
          <circle key={i} className="wc-drop" cx="25" cy="22" r="3" fill="#67e8f9" style={{ animationDelay: `${i * 0.45}s` }} />
        ))}
      </svg>

      {/* Etichetta dell'obiettivo accanto alla linea */}
      <div className="wc-goal-tag" style={{ top: `${(goalY / VB_H) * 100}%`, left: `${(72 / VB_W) * 100}%` }}>🎯 {fmtL(glassesToLiters(goal))} L</div>
    </div>
  );
}
