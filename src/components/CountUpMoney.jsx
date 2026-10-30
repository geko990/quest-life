import React, { useEffect, useRef, useState } from 'react';

// Importo che scorre fino al nuovo valore quando cambia (Tesoro: entrate, uscite, trasferimenti).
// Tempi: parte 180 ms dopo il cambio (il tempo che la finestra del movimento si chiuda), dura 900 ms
// con uscita morbida (cubic-out). Mentre scorre il numero si tinge di verde (sale) o rosso (scende),
// poi torna al suo colore in 0,5 s. Con Animazioni spente o "Riduci movimento" cambia di colpo.

const motionAllowed = () => {
  try {
    if (document.documentElement.getAttribute('data-animations') === 'off') return false;
    return !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (_) { return true; }
};

export default function CountUpMoney({ value, format, animate = true, duration = 900, delay = 180 }) {
  const target = Number(value) || 0;
  const [shown, setShown] = useState(target);
  const [dir, setDir] = useState(null); // 'up' | 'down' mentre scorre
  const shownRef = useRef(target);
  const frame = useRef(0);
  const timer = useRef(0);

  useEffect(() => {
    // si riparte da quello che si vede, anche se un conteggio era ancora in corso
    const from = shownRef.current;
    cancelAnimationFrame(frame.current);
    clearTimeout(timer.current);
    const show = (v) => { shownRef.current = v; setShown(v); };
    if (!animate || from === target || !motionAllowed()) { show(target); setDir(null); return undefined; }
    setDir(target > from ? 'up' : 'down');
    timer.current = setTimeout(() => {
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        show(t >= 1 ? target : from + (target - from) * eased);
        if (t < 1) frame.current = requestAnimationFrame(step);
        else timer.current = setTimeout(() => setDir(null), 250);
      };
      frame.current = requestAnimationFrame(step);
    }, delay);
    return () => { cancelAnimationFrame(frame.current); clearTimeout(timer.current); };
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  return <span className={`cum${dir ? ` is-${dir}` : ''}`}>{format(Math.round(shown * 100) / 100)}</span>;
}
