// Controlla che ogni testo passato a _t("...") abbia la traduzione inglese in src/i18n/en.json.
// Uso: node scripts/check-i18n.mjs   (esce con codice 1 se mancano traduzioni)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const en = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/en.json'), 'utf8'));

const files = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) { if (f !== 'i18n') walk(p); }
    else if (/\.(jsx?|mjs)$/.test(f)) files.push(p);
  }
})(path.join(root, 'src'));

const missing = new Map();
const re = /_t\(\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  for (const m of src.matchAll(re)) {
    let key;
    try {
      key = m[1].startsWith('"') ? JSON.parse(m[1]) : JSON.parse('"' + m[1].slice(1, -1).replace(/\\'/g, "'").replace(/"/g, '\\"') + '"');
    } catch (_) { continue; }
    if (!(key in en)) missing.set(key, path.relative(root, file));
  }
}

if (missing.size) {
  console.log(`::warning::${missing.size} testi senza traduzione inglese in src/i18n/en.json`);
  for (const [k, f] of missing) console.log(`  ${f}: ${JSON.stringify(k)}`);
  process.exit(1);
}
console.log(`✅ Tutti i testi hanno la traduzione inglese (${Object.keys(en).length} voci).`);
