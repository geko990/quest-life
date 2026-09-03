import { APP_VERSION } from './constants';

let swRegistration = null;
let updateAvailableCallbacks = [];
let isUpdating = false;
let userHasTouched = false;
let latestDetectedVersion = null;

/**
 * Check whether a newer version has already been detected
 */
export function getLatestDetectedVersion() {
  return latestDetectedVersion;
}

export function isUpdateAvailable() {
  return Boolean(latestDetectedVersion && latestDetectedVersion !== APP_VERSION);
}

/**
 * Register listener for update availability
 */
export function onUpdateAvailable(callback) {
  updateAvailableCallbacks.push(callback);
  if (latestDetectedVersion && latestDetectedVersion !== APP_VERSION) {
    try {
      callback(latestDetectedVersion);
    } catch (e) {}
  }
}

function notifyUpdateAvailable(newVersion) {
  if (!newVersion || newVersion === APP_VERSION) return;
  latestDetectedVersion = newVersion;
  updateAvailableCallbacks.forEach((cb) => {
    try {
      cb(newVersion);
    } catch (e) {
      console.error('[PWA] Error in update callback:', e);
    }
  });
}

/**
 * Actively query server for new version (used by Settings check)
 */
export async function checkForAppUpdate() {
  try {
    if (swRegistration) {
      swRegistration.update().catch(() => {});
    }
    const res = await fetch('./version.json?t=' + Date.now(), { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.version && data.version !== APP_VERSION) {
        notifyUpdateAvailable(data.version);
        return { updateAvailable: true, newVersion: data.version };
      }
    }
  } catch (err) {
    // Offline or network error
  }
  return { updateAvailable: false, currentVersion: APP_VERSION };
}

/**
 * Initialize PWA Service Worker & update monitoring
 */
export function initPWA() {
  trackUserInteraction();

  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] ServiceWorker not supported');
    return;
  }

  // Reload page ONLY if explicit user update or cold start update is in progress
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing && isUpdating) {
      refreshing = true;
      console.log('[PWA] Controller changed during update -> refreshing page');
      hardReloadPage();
    }
  });

  window.addEventListener('load', () => {
    // Register SW with updateViaCache: 'none' so browser never uses HTTP cache for sw.js
    navigator.serviceWorker
      .register('./sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        swRegistration = reg;
        console.log(`[PWA] ServiceWorker registered (App v${APP_VERSION})`);

        // Check for updates on startup
        reg.update().catch(() => {});
      })
      .catch((err) => {
        console.warn('[PWA] SW registration failed:', err);
      });
  });

  // Periodic version check via version.json
  const checkVersion = async () => {
    try {
      const res = await fetch('./version.json?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.version && data.version !== APP_VERSION) {
          console.log(`[PWA] Version mismatch detected! Local: ${APP_VERSION}, Server: ${data.version}`);

          // If app was JUST opened (cold startup) and user hasn't interacted/typed data yet:
          // Automatically launch the new version so bugfixes apply seamlessly on launch!
          if (!userHasTouched) {
            console.log('[PWA] Cold start update detected before user interaction. Applying update immediately...');
            await forceUpdateApp(false);
            return;
          }

          // Otherwise (app is in active use): DO NOT auto-refresh while typing! Show purple banner.
          notifyUpdateAvailable(data.version);

          if (swRegistration) {
            swRegistration.update().catch(() => {});
          }
        }
      }
    } catch (err) {
      // Ignore network errors when offline
    }
  };

  checkVersion();
  window.addEventListener('focus', checkVersion);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkVersion();
    }
  });
}

/**
 * Hard reload helper for iOS Safari & PWA standalone mode
 */
function hardReloadPage() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('v', Date.now().toString());
    window.location.href = url.toString();
  } catch (e) {
    window.location.reload();
  }
}

/**
 * Force update application: unregister SW, clear all caches, and perform cache-busting hard reload.
 */
export async function forceUpdateApp(promptConfirm = true) {
  if (
    promptConfirm &&
    !window.confirm("Vuoi forzare l'aggiornamento dell'applicazione? Verrà svuotata la cache e caricata l'ultima versione.")
  ) {
    return;
  }

  isUpdating = true;

  try {
    // 1. Tell current SW to skip waiting if waiting
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    // 2. Unregister all ServiceWorkers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let reg of registrations) {
        await reg.unregister();
      }
    }

    // 3. Clear all Cache Storage
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch (e) {
    console.error('[PWA] Error clearing SW/cache:', e);
  }

  // 4. Perform hard cache-busting navigation
  hardReloadPage();
}

/**
 * Simple update trigger
 */
export async function checkAppUpdate() {
  if (swRegistration) {
    await swRegistration.update();
  }
  await forceUpdateApp(false);
}
