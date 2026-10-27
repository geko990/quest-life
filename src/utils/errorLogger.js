import { getLocale } from '../i18n';
import { APP_VERSION } from './constants';
/**
 * Error Logger & Diagnostics for Quest Life
 * Captures uncaught runtime errors, unhandled rejections, storage exceptions,
 * and React error boundary catches into a persistent local log.
 *
 * - Errori uguali (stesso tipo + messaggio) vengono raggruppati in una sola voce con un contatore.
 * - Ogni voce ricorda le versioni dell'app in cui si è verificata.
 * - Messaggi, stack e contesto vengono filtrati: restano solo informazioni sul codice,
 *   mai testi inseriti dall'utente (il report può finire in una issue pubblica su GitHub).
 */

const ERROR_LOG_STORAGE_KEY = 'questlife_error_log';
const MAX_LOG_ENTRIES = 25;
const MAX_VERSIONS_PER_ENTRY = 8;

export const GITHUB_REPO = 'geko990/quest-life';
export const GITHUB_ERROR_LABEL = 'errore-app';

// ---------------------------------------------------------------------------
// Filtro dei dati personali
// ---------------------------------------------------------------------------

// Un testo tra virgolette resta solo se sembra un nome di codice (es. 'name', "habits.length", 'onSave').
// Parole con l'iniziale maiuscola (es. un nome proprio o un cibo) vengono nascoste.
const CODE_TOKEN = /^(?:[a-z_$][\w$\-]{0,40}|[A-Za-z_$][\w$]*(?:\.[\w$]+)+|[A-Z0-9_]{2,40})$/;

export function sanitizeText(text) {
  if (text === null || text === undefined) return '';
  let s = String(text);
  // Testi tra virgolette: tieni solo gli identificatori di codice
  s = s.replace(/(?<![A-Za-z])(["'`“”‘’«])([^"'`“”‘’«»\n]{0,200})(["'`“”‘’»])/g, (m, open, inner, close) =>
    CODE_TOKEN.test(inner) ? m : `${open}…${close}`
  );
  // Email, numeri lunghi (telefono, importi, codici), URL esterni con parametri
  s = s.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '‹email›');
  s = s.replace(/\b\d{5,}\b/g, '‹n›');
  s = s.replace(/(https?:\/\/[^\s?)]*)\?[^\s)]*/g, '$1');
  // Percorso del sito: inutile e lungo
  s = s.replace(/https?:\/\/geko990\.github\.io\/quest-life\//g, '');
  return s.slice(0, 500);
}

function sanitizeStack(stack) {
  if (!stack) return '';
  return String(stack)
    .split('\n')
    .slice(0, 5)
    .map(line => line
      .replace(/https?:\/\/geko990\.github\.io\/quest-life\//g, '')
      .replace(/https?:\/\/[^\s)]*/g, m => m.replace(/\?.*$/, ''))
      .slice(0, 200))
    .join('\n');
}

// Nel contesto restano solo chiavi tecniche note, con valori brevi
const CONTEXT_KEYS = ['type', 'context', 'filename', 'lineno', 'colno', 'sizeEstimate', 'info', 'componentStack', 'tab', 'action'];

function sanitizeContext(context) {
  const raw = typeof context === 'string' ? { info: context } : (context || {});
  const clean = {};
  CONTEXT_KEYS.forEach(key => {
    const value = raw[key];
    if (value === undefined || value === null || value === '') return;
    if (typeof value === 'number' || typeof value === 'boolean') {
      clean[key] = value;
    } else if (key === 'componentStack') {
      clean[key] = sanitizeStack(String(value).trim());
    } else {
      clean[key] = sanitizeText(String(value)).slice(0, 160);
    }
  });
  return clean;
}

// ---------------------------------------------------------------------------
// Archivio
// ---------------------------------------------------------------------------

function signatureOf(name, message, context) {
  return `${name || 'Error'}|${message || ''}|${(context && context.type) || (context && context.context) || ''}`;
}

function formatReadable(iso) {
  try {
    return new Date(iso).toLocaleString(getLocale(), { dateStyle: 'short', timeStyle: 'medium' });
  } catch (e) {
    return iso;
  }
}

// Porta le voci del vecchio formato (una per errore, senza filtro) al nuovo formato raggruppato
function normalizeEntries(list) {
  const groups = [];
  const bySig = new Map();
  list.forEach(item => {
    if (!item || typeof item !== 'object') return;
    const name = item.name || 'Error';
    const message = sanitizeText(item.message || '');
    const context = sanitizeContext(item.context);
    const signature = item.signature || signatureOf(name, message, context);
    const lastSeen = item.lastSeen || item.timestamp || new Date().toISOString();
    const firstSeen = item.firstSeen || item.timestamp || lastSeen;
    const count = Number(item.count) > 0 ? Number(item.count) : 1;
    const versions = Array.isArray(item.versions) ? item.versions.filter(Boolean) : [];

    const existing = bySig.get(signature);
    if (existing) {
      existing.count += count;
      if (lastSeen > existing.lastSeen) existing.lastSeen = lastSeen;
      if (firstSeen < existing.firstSeen) existing.firstSeen = firstSeen;
      versions.forEach(v => { if (!existing.versions.includes(v)) existing.versions.push(v); });
      return;
    }
    const entry = {
      id: item.id || 'err_' + Date.parse(lastSeen) + '_' + Math.floor(Math.random() * 1000),
      signature,
      name,
      message,
      stack: sanitizeStack(item.stack),
      context,
      firstSeen,
      lastSeen,
      count,
      versions
    };
    bySig.set(signature, entry);
    groups.push(entry);
  });
  groups.sort((a, b) => (a.lastSeen < b.lastSeen ? 1 : -1));
  groups.forEach(g => { g.readableTime = formatReadable(g.lastSeen); });
  return groups.slice(0, MAX_LOG_ENTRIES);
}

function saveEntries(entries) {
  localStorage.setItem(ERROR_LOG_STORAGE_KEY, JSON.stringify(entries));
}

export function getAppErrors() {
  try {
    const raw = localStorage.getItem(ERROR_LOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? normalizeEntries(parsed) : [];
  } catch (e) {
    console.error("Error reading error log from storage:", e);
    return [];
  }
}

export function logAppError(error, context = {}) {
  try {
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

    const now = new Date().toISOString();
    const cleanMessage = sanitizeText(message);
    const cleanContext = sanitizeContext(context);
    const signature = signatureOf(errorName, cleanMessage, cleanContext);

    const existing = getAppErrors();
    const same = existing.find(e => e.signature === signature);
    let updated;
    if (same) {
      same.count += 1;
      same.lastSeen = now;
      same.stack = sanitizeStack(stack) || same.stack;
      same.context = cleanContext;
      if (!same.versions.includes(APP_VERSION)) {
        same.versions = [...same.versions, APP_VERSION].slice(-MAX_VERSIONS_PER_ENTRY);
      }
      updated = [same, ...existing.filter(e => e !== same)];
    } else {
      const newEntry = {
        id: 'err_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        signature,
        name: errorName,
        message: cleanMessage,
        stack: sanitizeStack(stack),
        context: cleanContext,
        firstSeen: now,
        lastSeen: now,
        count: 1,
        versions: [APP_VERSION]
      };
      updated = [newEntry, ...existing];
    }
    // readableTime viene ricalcolato in lettura
    saveEntries(updated.slice(0, MAX_LOG_ENTRIES).map(({ readableTime, ...rest }) => rest));

    console.warn(`[QuestLife Logger] Error recorded:`, cleanMessage);
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

// Elimina un singolo errore (es. quando il bug è stato risolto)
export function removeAppError(id) {
  try {
    const remaining = getAppErrors().filter(e => e.id !== id);
    if (remaining.length === 0) {
      clearAppErrors();
    } else {
      saveEntries(remaining.map(({ readableTime, ...rest }) => rest));
    }
    return remaining;
  } catch (e) {
    console.error("Failed to remove error from log:", e);
    return getAppErrors();
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function versionsLabel(err) {
  return err.versions && err.versions.length ? err.versions.join(', ') : '?';
}

function deviceSummary() {
  if (typeof navigator === 'undefined') return 'N/A';
  const ua = navigator.userAgent || '';
  const ios = ua.match(/OS (\d+[_.]\d+)/);
  const standalone = (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
  let device = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Mac/.test(ua) ? 'Mac' : 'Altro';
  if (ios) device += ` iOS ${ios[1].replace('_', '.')}`;
  return `${device}${standalone ? ' (app installata)' : ' (browser)'}`;
}

export function formatErrorsForClipboard(appVersion) {
  const errors = getAppErrors();
  if (errors.length === 0) {
    return `=== QUEST LIFE DIAGNOSTICA ===\nApp Version: ${appVersion || 'N/A'}\nData: ${new Date().toLocaleString(getLocale())}\nNessun errore registrato. Tutto operativo.`;
  }

  const total = errors.reduce((sum, e) => sum + (e.count || 1), 0);
  const lines = [
    `=== QUEST LIFE DIAGNOSTICA ERRORI ===`,
    `Versione al momento del report: ${appVersion || 'N/A'}`,
    `Dispositivo: ${deviceSummary()}`,
    `Data report: ${new Date().toLocaleString(getLocale())}`,
    `Problemi distinti: ${errors.length} (occorrenze totali: ${total})`,
    `--------------------------------------`
  ];

  errors.forEach((err, idx) => {
    lines.push(`[#${idx + 1}] ${err.name || 'Error'} — ${err.count}× — versioni: ${versionsLabel(err)}`);
    lines.push(`Prima volta: ${formatReadable(err.firstSeen)} · Ultima: ${formatReadable(err.lastSeen)}`);
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

// Indirizzo della pagina "nuova issue" di GitHub già compilata (l'utente deve solo inviarla)
export function buildGithubIssueUrl(appVersion) {
  const errors = getAppErrors();
  const maxBody = 5500; // limite prudente per la lunghezza dell'indirizzo
  const header = [
    `<!-- Report generato da Quest Life. I testi inseriti dall'utente sono filtrati. -->`,
    `**Versione al momento del report:** ${appVersion || 'N/A'}`,
    `**Dispositivo:** ${deviceSummary()}`,
    `**Problemi distinti:** ${errors.length}`,
    ''
  ].join('\n');

  let body = header;
  let included = 0;
  for (const err of errors) {
    const block = [
      `### ${err.name || 'Error'}: ${err.message}`,
      `- Occorrenze: ${err.count} · versioni: ${versionsLabel(err)}`,
      `- Prima volta: ${err.firstSeen} · ultima: ${err.lastSeen}`,
      err.context && Object.keys(err.context).length ? `- Contesto: \`${JSON.stringify(err.context)}\`` : null,
      err.stack ? '```\n' + err.stack + '\n```' : null,
      ''
    ].filter(l => l !== null).join('\n');
    if (encodeURIComponent(body + block).length > maxBody) break;
    body += block + '\n';
    included++;
  }
  if (included < errors.length) {
    body += `\n_(${errors.length - included} altri problemi non inclusi per limiti di lunghezza: copiali dal registro.)_\n`;
  }

  const latest = errors[0];
  const title = latest
    ? `[Errore app] v${appVersion}: ${latest.name}: ${latest.message}`.slice(0, 120)
    : `[Errore app] v${appVersion}`;

  const params = new URLSearchParams({ title, body, labels: GITHUB_ERROR_LABEL });
  return `https://github.com/${GITHUB_REPO}/issues/new?${params.toString()}`;
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
