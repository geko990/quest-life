import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import RootErrorBoundary from './components/RootErrorBoundary';
import { setupGlobalErrorHandlers } from './utils/errorLogger';
import './index.css';
import { initPWA } from './utils/pwaManager';

// Initialize global error & promise rejection monitoring
setupGlobalErrorHandlers();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);

// Initialize PWA Service Worker & update monitoring
initPWA();

