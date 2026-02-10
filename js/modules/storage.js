/* ============================================
   QUEST LIFE - RPG Habit Tracker v2
   Storage Module (FileSystem & IndexedDB)
   ============================================ */
import { DB_NAME, DB_VERSION, DB_STORE } from './constants.js';

let fileHandle = null;

// IndexedDB Helper to store/retrieve FileHandle
export async function getDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(DB_STORE)) {
                db.createObjectStore(DB_STORE);
            }
        };
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

export async function saveFileHandle(handle) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readwrite');
        const store = tx.objectStore(DB_STORE);
        store.put(handle, 'dbFileHandle');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function getFileHandle() {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readonly');
        const store = tx.objectStore(DB_STORE);
        const request = store.get('dbFileHandle');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function verifyPermission(handle, withWrite) {
    const options = {};
    if (withWrite) {
        options.mode = 'readwrite';
    }
    // Check if permission was already granted
    if ((await handle.queryPermission(options)) === 'granted') {
        return true;
    }
    // Request permission
    if ((await handle.requestPermission(options)) === 'granted') {
        return true;
    }
    return false;
}

export async function saveDataToFile(data) {
    if (!fileHandle) return;

    try {
        const perm = await fileHandle.queryPermission({ mode: 'readwrite' });
        if (perm === 'granted') {
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(data, null, 2));
            await writable.close();
            // Visual feedback could be here
        } else {
            // console.log removed
        }
    } catch (err) {
        console.error("Error saving to file:", err);
    }
}

// NOTE: This modifies specific UI elements. 
// Ideally passed as callbacks, but kept here for now for simplicity.
export function updateDbStatusUI(connected, filename = '', pendingPermission = false, onReconnect = null, onLink = null) {
    const statusEl = document.getElementById('dbStatus');
    const actionBtn = document.getElementById('dbActionBtn');

    if (!statusEl || !actionBtn) return;

    if (connected) {
        if (pendingPermission) {
            statusEl.innerHTML = `<span style="color:orange">🟠 Riconnetti: ${filename}</span>`;
            actionBtn.textContent = 'Riconnetti 🔌';
            actionBtn.onclick = onReconnect;
        } else {
            statusEl.innerHTML = `<span style="color:var(--accent-primary)">🟢 Collegato: ${filename}</span>`;
            actionBtn.textContent = 'Modifica 📁';
            actionBtn.onclick = onLink; // Allow changing file
        }
    } else {
        statusEl.innerHTML = `<span style="color:var(--text-muted)">Nessun file collegato</span>`;
        actionBtn.textContent = 'Collega Database 🔗';
        actionBtn.onclick = onLink;
    }
}

export async function linkDatabaseFile(initialData) {
    try {
        const options = {
            types: [{
                description: 'Quest Life Database (JSON)',
                accept: { 'application/json': ['.json'] },
            }],
            suggestedName: 'quest-life-db.json',
        };

        fileHandle = await window.showSaveFilePicker(options);
        await saveFileHandle(fileHandle);

        // Initial save
        await saveDataToFile(initialData);

        return fileHandle;
    } catch (err) {
        console.error('Errore nel collegamento database:', err);
        if (err.name !== 'AbortError') {
            alert('Impossibile collegare il database.');
        }
        return null;
    }
}

export async function loadFileHandleOnStart(onReconnect) {
    try {
        const handle = await getFileHandle();
        if (handle) {
            fileHandle = handle;
            updateDbStatusUI(true, handle.name, true, onReconnect, null);
            // Note: onLink is passed null here, handled by caller probably or we need to pass it
            return handle;
        } else {
            updateDbStatusUI(false);
            return null;
        }
    } catch (e) {
        console.error("Error loading file handle:", e);
        return null;
    }
}

// Accessor for main app
export function setFileHandle(handle) {
    fileHandle = handle;
}

export function getCurrentFileHandle() {
    return fileHandle;
}
