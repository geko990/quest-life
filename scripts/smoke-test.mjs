// Test di fumo: apre il build in dist/ in un browser vero, visita ogni scheda
// e fallisce se compaiono errori JavaScript o file mancanti (404).
// Uso (dopo `npm run build`): npx vite preview --port 4173 & node scripts/smoke-test.mjs
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = process.env.SMOKE_URL || 'http://localhost:4173/';
const problems = [];
const report = (msg) => console.log(`::notice::${msg}`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 400, height: 860 } });

page.on('pageerror', (e) => problems.push(`Errore JS: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`Console: ${m.text()}`); });
page.on('response', (r) => {
  const url = r.url();
  if (url.startsWith(BASE) && r.status() >= 400) problems.push(`HTTP ${r.status()}: ${url.replace(BASE, '')}`);
});

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.querySelector('#root')?.children.length > 0, null, { timeout: 15000 });
report(`App avviata: "${(await page.title())}", Home con ${(await page.locator('#root').innerText()).length} caratteri visibili`);

// Schede principali, poi un secondo tocco per le sotto-schede (Campagne, Spesa, Tesoro)
// (la Home "Eroe" è già aperta all'avvio: il suo pulsante mostra l'avatar, non la scritta)
const tabs = ['Abitudini', 'Missioni', 'Missioni', 'Salute', 'Salute', 'Opzioni', 'Opzioni'];
for (const label of tabs) {
  const btn = page.locator('button, [role="button"], div, span', { hasText: new RegExp(`^${label}$`) }).last();
  if (await btn.count() === 0) { problems.push(`Scheda non trovata: ${label}`); continue; }
  await btn.click({ force: true }).catch((e) => problems.push(`Click fallito su ${label}: ${e.message}`));
  await page.waitForTimeout(700);
  const text = (await page.locator('#root').innerText()).length;
  report(`Scheda "${label}" aperta (${text} caratteri visibili)`);
  if (text < 20) problems.push(`La scheda ${label} sembra vuota`);
}

// Controlli sul build
const css = fs.readdirSync('dist/assets').filter((f) => f.endsWith('.css'))
  .map((f) => fs.readFileSync(`dist/assets/${f}`, 'utf8')).join('');
const bg = css.match(/url\(([^)]*fantasy-map-bg[^)]*)\)/);
if (!bg) problems.push('Sfondo D&D non referenziato nel CSS');
else {
  const res = await page.request.get(new URL(bg[1].replace(/['"]/g, ''), new URL('assets/x.css', BASE)).href);
  if (res.status() !== 200) problems.push(`Sfondo D&D non raggiungibile (${res.status()})`);
  else report('Sfondo D&D caricato correttamente');
}
for (const f of ['sw.js', 'version.json', 'manifest.json', 'icon.png']) {
  const res = await page.request.get(BASE + f);
  if (res.status() !== 200) problems.push(`${f} mancante nel sito (${res.status()})`);
}
report(`Versione pubblicata: ${fs.readFileSync('dist/version.json', 'utf8').replace(/\s+/g, ' ')}`);

await browser.close();
if (problems.length) {
  for (const p of problems) console.log(`::error::${p}`);
  process.exit(1);
}
report('Test di fumo superato: nessun errore');
