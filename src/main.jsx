// Punto d'ingresso leggero: il resto dell'app (React, schermate, stili) è in bootApp.jsx e si carica
// dopo due fotogrammi. Così il telefono mostra subito l'apertura animata di index.html e ne avvia le
// animazioni prima di mettersi a leggere il codice dell'app (#41).
import { setupGlobalErrorHandlers } from './utils/errorLogger';

// Initialize global error & promise rejection monitoring
setupGlobalErrorHandlers();

let started = false;
const start = () => {
  if (started) return;
  started = true;
  import('./bootApp.jsx')
    .then((m) => m.default())
    .catch((err) => {
      console.error('[Avvio] Caricamento dell\'app non riuscito:', err);
      // Di solito è una pagina vecchia salvata dal service worker i cui file non esistono più sul sito:
      // si ripulisce e si ricarica una volta dalla rete (vedi __qlRecover in index.html).
      let recovering = false;
      try { recovering = !!(window.__qlRecover && window.__qlRecover(err && err.message)); } catch (_) {}
      if (recovering) return; // la pagina si sta ricaricando: niente errore nel registro
      try { window.__qlBootDone && window.__qlBootDone(); } catch (_) {}
      throw err;
    });
};
requestAnimationFrame(() => requestAnimationFrame(start));
setTimeout(start, 150); // se la pagina non disegna (es. aperta in secondo piano)
