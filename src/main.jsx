import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js?v=5.8.2')
      .then(reg => {
        console.log('PWA ServiceWorker registered (v5.8.2)');
        reg.update();
      })
      .catch(err => console.log('SW registration error:', err));
  });
}

