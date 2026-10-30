import { useEffect, useRef, useState } from 'react';

// Importo che "conta" fino al nuovo valore quando cambia (Tesoro: entrate e uscite).
// Se il saldo sale aspetta un attimo (arrivano le monete), se scende parte subito.
// Tempi: 650 ms con uscita morbida (cubic-out); con Animazioni spente cambia di colpo.

const motionAllowed = () => {
  try {
    if (document.documentElement.getAttribute('data-animations') === 'off') return false;
    return !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (_) { return true; }
};

export default function CountUpMoney({ value, format, animate = true, duration = 650, riseDelay = 560 }) {
  const target = Number(value) || 0;
  const [shown, setShown] = useState(target);
  const fromRef = useRef(target);
  const shownRef = useRef(target);
  const frame = useRef(0);
  const timer = useRef(0);

  useEffect(() => {
    // si riparte da quello che si vede, anche se un conteggio era ancora in corso
    const from = shownRef.current;
    fromRef.current = target;
    cancelAnimationFrame(frame.current);
    clearTimeout(timer.current);
    const show = (v) => { shownRef.current = v; setShown(v); };
    if (!animate || from === target || !motionAllowed()) { show(target); return undefined; }
    const run = () => {
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        show(t >= 1 ? target : from + (target - from) * eased);
        if (t < 1) frame.current = requestAnimationFrame(step);
      };
      frame.current = requestAnimationFrame(step);
    };
    if (target > from && riseDelay > 0) timer.current = setTimeout(run, riseDelay);
    else run();
    return () => { cancelAnimationFrame(frame.current); clearTimeout(timer.current); };
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  return format(Math.round(shown * 100) / 100);
}
