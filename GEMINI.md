# Istruzioni Progetto Quest Life (RPG Life)

La documentazione completa del progetto (struttura, dati, rilascio) è in `CLAUDE.md`: leggila all'inizio di ogni sessione.

## Regola Fondamentale di Rilascio e Versioning
Ogni volta che viene effettuata una modifica:
1. **Incrementare sempre il numero di versione** e verificare il build.
2. **Eseguire sempre il push su GitHub** sul branch `main`:
   ```bash
   PATH="$PWD/.node-bin/bin:$PATH" node scripts/publish.js "descrizione delle modifiche"
   ```
   Lo script `scripts/publish.js` automatizza:
   - Incremento del numero di versione (`vX.Y.Z`) in `package.json`, `public/version.json`, `public/sw.js` e `src/utils/constants.js`
   - Build di verifica con Vite in `dist/`
   - Stage dei file con Git (`git add .`)
   - Creazione commit con prefisso versione `release vX.Y.Z: ...`
   - Push automatico sul repository remoto GitHub (`origin main`): GitHub Actions ricostruisce il sito e lo pubblica su GitHub Pages.

## Multilingua
- I testi visibili passano da `_t("Testo italiano")` (da `src/i18n`); ogni testo nuovo va tradotto in `src/i18n/en.json`.
- Controllo: `node scripts/check-i18n.mjs`.

## Lavoro in parallelo con altre sessioni (anche di Claude)
- Prima di pubblicare: `git pull --rebase origin main`, poi incrementa la versione partendo dall'ultimo `main`.
- L'elenco delle modifiche e dei punti aperti è nel documento "Roadmap Quest Life" del Progetto claude.ai "Solo RPG".

## Da non fare
- Non copiare `dist/` nella radice del progetto e non committarlo: il sito viene costruito da GitHub Actions.
- Non sovrascrivere `index.html` con la versione compilata: è il file sorgente (entry `/src/main.jsx`).
- Non lasciare screenshot o file di test nella radice del progetto.
