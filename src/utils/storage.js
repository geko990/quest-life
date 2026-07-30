import { DB_NAME, DB_VERSION, DB_STORE } from './constants.js';

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
    if ((await handle.queryPermission(options)) === 'granted') {
        return true;
    }
    if ((await handle.requestPermission(options)) === 'granted') {
        return true;
    }
    return false;
}

export async function saveDataToFile(data, handle) {
    if (!handle) return;
    try {
        const perm = await handle.queryPermission({ mode: 'readwrite' });
        if (perm === 'granted') {
            const writable = await handle.createWritable();
            await writable.write(JSON.stringify(data, null, 2));
            await writable.close();
        }
    } catch (err) {
        console.error("Error saving to file:", err);
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

        const fileHandle = await window.showSaveFilePicker(options);
        await saveFileHandle(fileHandle);
        await saveDataToFile(initialData, fileHandle);
        return fileHandle;
    } catch (err) {
        console.error('Errore nel collegamento database:', err);
        if (err.name !== 'AbortError') {
            alert('Impossibile collegare il database.');
        }
        return null;
    }
}

export async function loadFileHandleOnStart() {
    try {
        const handle = await getFileHandle();
        return handle || null;
    } catch (e) {
        console.error("Error loading file handle:", e);
        return null;
    }
}
