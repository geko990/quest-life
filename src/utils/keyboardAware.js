// Tastiera di iOS (#47).
// Nelle app web iOS non restringe lo schermo quando compare la tastiera: fa scorrere in su l'intera
// pagina (barra in basso compresa) finché il campo non è visibile. Qui si fa come un'app nativa:
// - mentre si scrive l'app occupa solo lo spazio sopra la tastiera (attributo data-keyboard="open"
//   su <html> e variabile --kb-vvh, usate da index.css), la barra in basso si nasconde
//   e la pagina torna in cima, così nulla "salta" fuori dallo schermo;
// - la finestra (sovrapposizione fissa) che contiene il campo si adatta allo spazio visibile
//   e scorre al suo interno;
// - il campo viene portato in vista dentro il suo contenitore.
// Su Android e sui computer la tastiera restringe già la pagina: lo scarto misurato è ~0 e qui non
// succede nulla.

const KEYBOARD_MIN_PX = 120;
const NO_KEYBOARD_TYPES = ['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file', 'image', 'hidden'];

function isTextField(el) {
  if (!el || el === document.body) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === 'TEXTAREA') return !el.readOnly;
  if (tag === 'INPUT') return !el.readOnly && !NO_KEYBOARD_TYPES.includes((el.type || 'text').toLowerCase());
  return false;
}

// La sovrapposizione fissa a tutto schermo che contiene il campo (le finestre dell'app)
function findOverlay(el) {
  const minHeight = document.documentElement.clientHeight * 0.6;
  for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
    if (n.classList.contains('kb-overlay')) return n; // già adattata (ora è più bassa)
    const cs = getComputedStyle(n);
    if (cs.position === 'fixed' && n.offsetHeight >= minHeight) return n;
  }
  return null;
}

export function initKeyboardAware() {
  const vv = typeof window !== 'undefined' ? window.visualViewport : null;
  if (!vv || window.__qlKeyboardAware) return;
  window.__qlKeyboardAware = true;

  const root = document.documentElement;
  let open = false;
  let overlay = null;
  let overlayPrev = null;
  let raf = 0;

  const releaseOverlay = () => {
    if (!overlay) return;
    overlay.style.top = overlayPrev.top;
    overlay.style.bottom = overlayPrev.bottom;
    overlay.style.height = overlayPrev.height;
    overlay.classList.remove('kb-overlay');
    overlay = null;
    overlayPrev = null;
  };

  const fitOverlay = (el) => {
    const next = findOverlay(el);
    if (next !== overlay) {
      releaseOverlay();
      if (next) {
        overlay = next;
        overlayPrev = { top: next.style.top, bottom: next.style.bottom, height: next.style.height };
        next.classList.add('kb-overlay');
      }
    }
    if (overlay) {
      overlay.style.top = `${Math.round(vv.offsetTop)}px`;
      overlay.style.bottom = 'auto';
      overlay.style.height = `${Math.round(vv.height)}px`;
    }
  };

  const revealField = (el) => {
    try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (_) {}
  };

  const update = () => {
    raf = 0;
    const active = document.activeElement;
    const keyboardHeight = root.clientHeight - vv.height;
    const nowOpen = keyboardHeight > KEYBOARD_MIN_PX && isTextField(active);

    if (nowOpen) {
      root.style.setProperty('--kb-vvh', `${Math.round(vv.height)}px`);
      if (!open) {
        open = true;
        root.setAttribute('data-keyboard', 'open');
      }
      // la pagina in cima: l'app ora è alta quanto lo spazio sopra la tastiera
      if (vv.offsetTop > 0 || window.scrollY > 0) window.scrollTo(0, 0);
      fitOverlay(active);
      requestAnimationFrame(() => revealField(active));
    } else if (open) {
      open = false;
      root.removeAttribute('data-keyboard');
      root.style.removeProperty('--kb-vvh');
      releaseOverlay();
    }
  };

  const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };

  vv.addEventListener('resize', schedule);
  vv.addEventListener('scroll', schedule);
  document.addEventListener('focusin', () => setTimeout(schedule, 60));
  document.addEventListener('focusout', () => setTimeout(schedule, 60));
}
