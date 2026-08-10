import { APP_VERSION } from './constants';

let swRegistration = null;
let updateAvailableCallbacks = [];
let isUpdating = false;
let userHasTouched = false;

/**
 * Track user interaction (touch/click/key) so we know if user is actively using the app
 */
function trackUserInteraction() {
  const handler = () => {
    userHasTouched = true;
  };
  window.addEventListener('touchstart', handler, { capture: true, passive: true });
  window.addEventListener('pointerdown', handler, { capture: true, passive: true });
  window.addEventListener('mousedown', handler, { capture: true, passive: true });
  window.addEventListener('keydown', handler, { capture: true, passive: true });
}

/**
 * Register listener for update availability
 */
export function onUpdateAvailable(callback) {
  updateAvailableCallbacks.push(callback);
}

function notifyUpdateAvailable(newVersion) {
  updateAvailableCallbacks.forEach((cb) => {
    try {
      cb(newVersion);
    } catch (e) {
      console.error('[PWA] Error in update callback:', e);
    }
  });
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
    } else {
      console.log('[PWA] Controller changed in background -> notifying user via top banner');
      notifyUpdateAvailable(APP_VERSION);
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

        // Listen for new worker installed
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New version installed in background. Notifying user via top banner.');
              notifyUpdateAvailable(APP_VERSION);
            }
          });
        });
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
  const interval = setInterval(checkVersion, 30000);
  window.addEventListener('focus', checkVersion);
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
