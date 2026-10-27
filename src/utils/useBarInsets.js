import { useEffect, useState } from 'react';

// Spazio occupato dalla barra superiore e dalla nav bar in basso, misurato dal vivo.
// Serve a tenere le finestre (position: fixed) sempre tra le due barre, su ogni telefono.
// In orizzontale la nav è una barra laterale: in basso resta solo un piccolo margine.
const measure = () => {
  if (typeof document === 'undefined') return null;
  const vh = window.innerHeight;
  const header = [...document.querySelectorAll('header')]
    .map(e => e.getBoundingClientRect())
    .find(b => b.height > 0 && b.top < vh / 2);
  const nav = [...document.querySelectorAll('nav')]
    .map(e => e.getBoundingClientRect())
    .find(b => b.height > 0 && b.width > b.height && b.top > vh / 2);
  // Il pulsante centrale (avatar) sporge sopra la nav: lo includo.
  let navTop = nav ? nav.top : vh;
  const navEl = nav ? [...document.querySelectorAll('nav')].find(e => e.getBoundingClientRect().top === nav.top) : null;
  if (navEl) {
    for (const child of navEl.querySelectorAll('*')) {
      const b = child.getBoundingClientRect();
      if (b.height > 0 && b.top < navTop && b.top > vh / 2) navTop = b.top;
    }
  }
  return { top: header ? Math.max(0, header.bottom) : 0, bottom: Math.max(0, vh - navTop) };
};

// `trigger`: cambia quando si apre una finestra, così la misura è sempre fresca.
export function useBarInsets(trigger) {
  const [insets, setInsets] = useState(() => measure());
  useEffect(() => {
    const update = () => setInsets(measure());
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, [trigger]);
  return insets;
}

/** Padding di un overlay a tutto schermo: 10px di respiro sopra e sotto le barre. */
export function overlayPadding(insets, side = 14) {
  if (!insets) {
    return `calc(env(safe-area-inset-top, 0px) + 64px) ${side}px calc(env(safe-area-inset-bottom, 0px) + 70px) ${side}px`;
  }
  return `${Math.round(insets.top + 10)}px ${side}px ${Math.round(insets.bottom + 10)}px ${side}px`;
}
