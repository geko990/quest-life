// Avvio vero e proprio dell'app: caricato da main.jsx un attimo dopo la prima immagine,
// così l'apertura animata di index.html fa in tempo a partire (vedi #41 nella Roadmap).
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import RootErrorBoundary from './components/RootErrorBoundary';
import './index.css';
import { initPWA } from './utils/pwaManager';
import { initKeyboardAware } from './utils/keyboardAware';

export default function bootApp() {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </React.StrictMode>
  );
  // Initialize PWA Service Worker & update monitoring
  initPWA();
  // Tastiera di iOS: l'app si adatta allo spazio sopra la tastiera invece di scorrere tutta (#47)
  initKeyboardAware();
}
