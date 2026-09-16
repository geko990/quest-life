/**
 * Error Logger & Diagnostics for Quest Life
 * Captures uncaught runtime errors, unhandled rejections, storage exceptions,
 * and React error boundary catches into a persistent local log.
 */

const ERROR_LOG_STORAGE_KEY = 'questlife_error_log';
const MAX_LOG_ENTRIES = 25;

export function getAppErrors() {
  try {
    const raw = localStorage.getItem(ERROR_LOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Error reading error log from storage:", e);
    return [];
  }
}

export function logAppError(error, context = {}) {
  try {
    const timestamp = new Date().toISOString();
    const readableTime = new Date().toLocaleString('it-IT', {
      dateStyle: 'short',
      timeStyle: 'medium'
    });

    let message = 'Errore sconosciuto';
    let stack = '';
    let errorName = 'Error';

    if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object') {
      message = error.message || error.statusText || String(error);
      stack = error.stack || '';
      errorName = error.name || 'Error';
    }

    // Ignore benign ResizeObserver notifications from some browsers
    if (message.includes('ResizeObserver loop completed with undelivered notifications') ||
        message.includes('ResizeObserver loop limit exceeded')) {
      return;
    }

    const newEntry = {
      id: 'err_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      timestamp,
      readableTime,
      name: errorName,
      message,
      stack: stack ? stack.split('\n').slice(0, 5).join('\n') : '',
      context: typeof context === 'string' ? { info: context } : (context || {})
    };

    const existing = getAppErrors();
    // Keep most recent first, capped at MAX_LOG_ENTRIES
    const updated = [newEntry, ...existing].slice(0, MAX_LOG_ENTRIES);
    localStorage.setItem(ERROR_LOG_STORAGE_KEY, JSON.stringify(updated));

    console.warn(`[QuestLife Logger] Error recorded:`, newEntry);
  } catch (err) {
    console.error("Failed to write to error log:", err);
  }
}

export function clearAppErrors() {
  try {
    localStorage.removeItem(ERROR_LOG_STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear error log:", e);
  }
}

export function formatErrorsForClipboard(appVersion) {
  const errors = getAppErrors();
  if (errors.length === 0) {
    return `=== QUEST LIFE DIAGNOSTICA ===\nApp Version: ${appVersion || 'N/A'}\nData: ${new Date().toLocaleString('it-IT')}\nNessun errore registrato. Tutto operativo.`;
  }

  const lines = [
    `=== QUEST LIFE DIAGNOSTICA ERRORI ===`,
    `App Version: ${appVersion || 'N/A'}`,
    `Data report: ${new Date().toLocaleString('it-IT')}`,
    `Errori totali registrati: ${errors.length}`,
    `--------------------------------------`
  ];

  errors.forEach((err, idx) => {
    lines.push(`[#${idx + 1}] ${err.readableTime} - ${err.name || 'Error'}`);
    lines.push(`Messaggio: ${err.message}`);
    if (err.context && Object.keys(err.context).length > 0) {
      lines.push(`Contesto: ${JSON.stringify(err.context)}`);
    }
    if (err.stack) {
      lines.push(`Stack:\n${err.stack}`);
    }
    lines.push(`--------------------------------------`);
  });

  return lines.join('\n');
}

let handlersInitialized = false;

export function setupGlobalErrorHandlers() {
  if (handlersInitialized || typeof window === 'undefined') return;
  handlersInitialized = true;

  // Uncaught JavaScript exceptions
  window.addEventListener('error', (event) => {
    // Check if error is from extensions or benign
    if (!event.error && !event.message) return;
    logAppError(event.error || event.message, {
      type: 'uncaught_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  // Unhandled Promise rejections (e.g. storage, fetch, async)
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    logAppError(reason || 'Unhandled Promise Rejection', {
      type: 'unhandled_promise_rejection'
    });
  });
}
