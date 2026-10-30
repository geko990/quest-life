import { useRef, useState } from 'react';

// Grafici del Tesoro che si "sfogliano" col dito (come i grafici di Borsa).
// - un tocco in un punto qualsiasi del grafico sceglie il punto più vicino in orizzontale
// - trascinando in orizzontale la selezione segue il dito, punto per punto (vibrazione leggera dove c'è)
// - lo scorrimento verticale della pagina resta libero (`touch-action: pan-y`): se il dito va in su/giù
//   il browser scorre e il trascinamento si interrompe da solo
// Logica senza grafica: riceve le coordinate x dei punti nel sistema del `viewBox` e restituisce
// le props da mettere sull'<svg>.
//
// onStart(i): dito appoggiato (punto più vicino)   onMove(i): il punto cambia trascinando
// onTap(i): dito sollevato senza trascinare        scrubbing: true mentre il dito è sul grafico

const vibrate = () => {
  try {
    if (document.documentElement.getAttribute('data-animations') === 'off') return;
    if (navigator.vibrate) navigator.vibrate(4);
  } catch (_) { /* niente vibrazione */ }
};

export function nearestIndex(xs, x) {
  let best = -1, dist = Infinity;
  xs.forEach((px, i) => { const d = Math.abs(px - x); if (d < dist) { dist = d; best = i; } });
  return best;
}

export function useChartScrub({ xs, viewW, onStart, onMove, onTap }) {
  const [scrubbing, setScrubbing] = useState(false);
  const st = useRef({ id: null, idx: -1, moved: false, x0: 0 });

  const indexAt = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (!r.width || !xs.length) return -1;
    return nearestIndex(xs, ((e.clientX - r.left) / r.width) * viewW);
  };

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const i = indexAt(e);
    if (i < 0) return;
    st.current = { id: e.pointerId, idx: i, moved: false, x0: e.clientX };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) { /* ok */ }
    setScrubbing(true);
    if (onStart) onStart(i);
  };
  const onPointerMove = (e) => {
    const s = st.current;
    if (s.id !== e.pointerId) return;
    if (Math.abs(e.clientX - s.x0) > 4) s.moved = true;
    const i = indexAt(e);
    if (i >= 0 && i !== s.idx) {
      s.idx = i; s.moved = true;
      vibrate();
      if (onMove) onMove(i);
    }
  };
  const end = (e, tap) => {
    const s = st.current;
    if (s.id !== e.pointerId) return;
    st.current = { id: null, idx: -1, moved: false, x0: 0 };
    setScrubbing(false);
    if (tap && !s.moved && onTap) onTap(s.idx);
  };

  return {
    scrubbing,
    svgProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (e) => end(e, true),
      onPointerCancel: (e) => end(e, false),
      style: { touchAction: 'pan-y', cursor: 'pointer', WebkitUserSelect: 'none', userSelect: 'none' },
    },
  };
}
