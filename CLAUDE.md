# Quest Life (RPG Life)

PWA "gamificata" per abitudini, missioni, nutrizione e finanze. Interfaccia e testi in italiano.
Pubblicata su GitHub Pages: https://geko990.github.io/quest-life/

## Stack
- React 18 + Vite 5 + Tailwind CSS 4 (plugin `@tailwindcss/vite`), JavaScript/JSX (niente TypeScript).
- `tesseract.js` per l'OCR delle etichette nutrizionali.
- Nessun backend: i dati vivono nel browser dell'utente.

## Struttura
```
index.html              Sorgente HTML (entry: /src/main.jsx). NON va sovrascritto dal build.
public/                 Copiati così come sono nel sito: sw.js, version.json, manifest.json, icon.png
src/
  main.jsx              Avvio app, error boundary, registrazione PWA
  App.jsx               Stato globale, logica di gioco (XP, livelli, medaglie), routing tra le schede
  index.css             Tutti gli stili, temi (standard, fantasy, dnd, futuristic) e colori accento
  assets/               Immagini importate dal CSS (es. sfondo mappa del tema D&D)
  tabs/                 Una schermata per scheda: Home, Habits, Missions (include quest e one-shot),
                        Nutrition (include lista spesa), Finances, Settings
  components/           Header, BottomNav, Modal (form di creazione/modifica), planner, ecc.
  i18n/                 Multilingua: _t(), getLocale(), dizionario en.json
  utils/
    constants.js        APP_VERSION/BUILD_TIME (aggiornati in automatico), template sfide, colori
    state.js            Stato iniziale e sanitizeState (migrazione/validazione dei dati salvati)
    storage.js          IndexedDB + collegamento facoltativo a un file di database locale
    helpers.js          Date "di gioco", calcolo XP/livelli, settimane/mesi, conteggio stelle
    pwaManager.js       Rilevamento nuove versioni e aggiornamento forzato
scripts/
  check-i18n.mjs        Verifica che tutti i testi _t() abbiano la traduzione inglese
  smoke-test.mjs        Test nel browser usato dalla verifica su GitHub
  update-version.js     Sincronizza la versione in package.json, public/version.json, public/sw.js, constants.js
  publish.js            Rilascio completo: incrementa versione, build di verifica, commit, push su main
.github/workflows/deploy.yml   Build e pubblicazione su GitHub Pages a ogni push su main
.github/workflows/check.yml    Verifica (build, traduzioni, test nel browser) sui rami di lavoro
```

## Multilingua (italiano / inglese)
- I testi visibili si scrivono in italiano e passano sempre da `_t("Testo italiano")` (import da `src/i18n`).
  Valori dinamici con segnaposto: `_t('Hai {0} missioni', n)`.
- Ogni nuovo testo va aggiunto con la traduzione in `src/i18n/en.json` (chiave = testo italiano).
  `node scripts/check-i18n.mjs` segnala quelli mancanti (gira anche nella verifica su GitHub).
- Date: usare `getLocale()` invece di `'it-IT'` in `toLocaleDateString` e simili.
- La lingua si sceglie in Opzioni (`settings.language`: `'it'` predefinito, `'en'`).
- I dati creati dall'utente (nomi di abitudini, missioni, cibi) non si traducono.

## Dati dell'utente (non romperli!)
- Stato principale in `localStorage` alla chiave `questlife_state_v2`, con copia in IndexedDB.
- Ogni modifica alla forma dei dati deve passare da `sanitizeState` in `src/utils/state.js`,
  così i dati già salvati sui telefoni vengono migrati senza perdite.
- Lo script di emergenza in `index.html` svuota cache e service worker ma conserva `localStorage`.

## Rilascio e versioning
Regola del progetto: **ogni modifica pubblicata incrementa la versione** (`X.Y.Z`, si incrementa Z).

```bash
node scripts/publish.js "descrizione delle modifiche"
```
Lo script incrementa la versione, fa un build di verifica in `dist/`, committa con il messaggio
`release vX.Y.Z: ...` e fa push su `main`. GitHub Actions ricostruisce il sito dai sorgenti e lo
pubblica (1-2 minuti). L'output del build (`dist/`) non va mai committato né copiato nella radice.

Se non si può fare il build in locale: `node scripts/update-version.js --bump`, commit e push;
il build lo fa comunque GitHub Actions.

## Comandi
- `npm run dev` — server di sviluppo
- `npm run build` — build di produzione in `dist/`
- `npm run preview` — anteprima del build

## Note
- Questo progetto è stato sviluppato anche con Antigravity (Gemini): `GEMINI.md` contiene le stesse
  regole di rilascio. Se cambi il flusso di lavoro, aggiorna entrambi i file.
