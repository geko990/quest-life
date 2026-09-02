# Istruzioni Progetto Quest Life (RPG Life)

## Regola Fondamentale di Rilascio e Versioning
Ogni volta che viene effettuata una modifica, o ad ogni sessione / riapertura di Antigravity:
1. **Incrementare sempre il numero di versione** e fare il build dell'applicazione PWA.
2. **Eseguire sempre il push su GitHub** sul branch `main`:
   ```bash
   PATH="$PWD/.node-bin/bin:$PATH" node scripts/publish.js "descrizione delle modifiche"
   ```
   Lo script `scripts/publish.js` automatizza:
   - Incremento del numero di versione (`vX.Y.Z`) in `package.json`, `version.json`, `sw.js` e `constants.js`
   - Rigenerazione cache PWA e build di produzione Vite (`dist/`)
   - Stage dei file con Git (`git add .`)
   - Creazione commit con prefisso versione `release vX.Y.Z: ...`
   - Push automatico sul repository remoto GitHub (`origin main`) per attivare il deploy su GitHub Pages.
