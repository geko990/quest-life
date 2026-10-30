// Fogli che si chiudono trascinandoli in giù (come su iOS). Nessuna grafica: restituisce i gestori dei
// tocchi da mettere sul contenitore del foglio.
// - il trascinamento parte solo dalle zone `[data-sheet-handle]` (maniglia, carta), non dal corpo che scorre
// - mentre si trascina il foglio segue il dito (solo verso il basso) e lo sfondo schiarisce
// - al rilascio: oltre 90 px, o un colpo veloce oltre 40 px, il foglio scivola via in 200 ms e si chiude;
//   altrimenti torna su in 220 ms
// - un tocco senza movimento resta un tocco (i bottoni della carta funzionano)

const CLOSE_DISTANCE = 90;
const FLICK_DISTANCE = 40;
const FLICK_SPEED = 0.5; // px/ms

export function makeSheetDrag({ sheet, overlay, onClose }) {
  let y0 = 0, t0 = 0, dy = 0, active = false;

  const set = (el, ty, ms) => {
    if (!el) return;
    el.style.transition = ms ? `transform ${ms}ms cubic-bezier(0.22, 1, 0.36, 1)` : 'none';
    el.style.transform = ty ? `translateY(${ty}px)` : '';
  };
  const fade = (ty, ms) => {
    const ov = overlay();
    if (!ov) return;
    ov.style.transition = ms ? `opacity ${ms}ms ease` : 'none';
    ov.style.opacity = ty ? String(Math.max(0.35, 1 - ty / 500)) : '';
  };

  return {
    onTouchStart: (e) => {
      const handle = e.target.closest && e.target.closest('[data-sheet-handle]');
      if (!handle || !e.touches || e.touches.length !== 1) { active = false; return; }
      active = true; dy = 0;
      y0 = e.touches[0].clientY; t0 = performance.now();
    },
    onTouchMove: (e) => {
      if (!active) return;
      dy = Math.max(0, e.touches[0].clientY - y0);
      if (dy > 4) { set(sheet(), dy, 0); fade(dy, 0); }
    },
    onTouchEnd: () => {
      if (!active) return;
      active = false;
      const speed = dy / Math.max(1, performance.now() - t0);
      if (dy > CLOSE_DISTANCE || (dy > FLICK_DISTANCE && speed > FLICK_SPEED)) {
        const el = sheet();
        set(el, (el ? el.getBoundingClientRect().height : 600) + 60, 200);
        fade(600, 200);
        setTimeout(onClose, 190);
      } else if (dy > 0) {
        set(sheet(), 0, 220); fade(0, 220);
      }
      dy = 0;
    },
    onTouchCancel: () => { active = false; set(sheet(), 0, 220); fade(0, 220); },
  };
}
