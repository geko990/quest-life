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
const tabSummary = [];
const tabs = ['Abitudini', 'Missioni', 'Missioni', 'Salute', 'Salute', 'Opzioni', 'Opzioni'];
for (const label of tabs) {
  const btn = page.locator('button, [role="button"], div, span', { hasText: new RegExp(`^${label}$`) }).last();
  if (await btn.count() === 0) { problems.push(`Scheda non trovata: ${label}`); continue; }
  await btn.click({ force: true }).catch((e) => problems.push(`Click fallito su ${label}: ${e.message}`));
  await page.waitForTimeout(700);
  const text = (await page.locator('#root').innerText()).length;
  tabSummary.push(`${label} ${text}`);
  if (text < 20) problems.push(`La scheda ${label} sembra vuota`);
}
report(`Schede aperte (caratteri visibili): ${tabSummary.join(', ')}`);

// Pressione prolungata su "Eroe" → crea missione → la ritrovo tra le recenti
try {
  const hero = page.locator('button[title*="tieni premuto"]').last();
  const box = await hero.boundingBox();
  const longPress = async () => {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(700);
    await page.mouse.up();
    await page.waitForTimeout(400);
  };
  await longPress();
  const nameInput = page.locator('input[name="name"]');
  if (await nameInput.count() === 0) throw new Error('la finestra di creazione non si è aperta');
  await nameInput.fill('Test fumo ripetibile');
  await page.locator('.modal-action-save').click();
  await page.waitForTimeout(500);
  await longPress();
  const chip = page.locator('.recent-template-chip', { hasText: 'Test fumo ripetibile' });
  if (await chip.count() === 0) throw new Error('la missione non compare tra le recenti');
  await chip.first().click();
  if ((await nameInput.inputValue()) !== 'Test fumo ripetibile') throw new Error('il modello non compila il nome');
  report('Pressione prolungata su Eroe e missioni recenti: OK');
  await page.mouse.click(5, 5); // tocca fuori per chiudere
} catch (e) {
  problems.push(`Gruppo 2: ${e.message}`);
}

// Lista della spesa per reparto
try {
  const navBtn = (label) => page.locator('button, [role="button"], div, span', { hasText: new RegExp(`^${label}$`) }).last();
  await navBtn('Abitudini').click({ force: true });
  await page.waitForTimeout(300);
  await navBtn('Salute').click({ force: true });
  await page.waitForTimeout(300);
  await navBtn('Salute').click({ force: true });
  await page.waitForTimeout(500);
  const shopInput = page.locator('input[placeholder^="Es: Latte"]');
  if (await shopInput.count() === 0) throw new Error('lista della spesa non trovata');
  for (const name of ['Latte', 'Mele', 'Petto di pollo']) {
    await shopInput.fill(name);
    await shopInput.press('Enter');
    await page.waitForTimeout(200);
  }
  const headers = (await page.locator('.shop-group-header').allInnerTexts()).join(' | ');
  for (const expected of ['FRUTTA E VERDURA', 'CARNE E PESCE', 'LATTE, YOGURT E UOVA']) {
    if (!headers.toUpperCase().includes(expected)) throw new Error(`reparto mancante: ${expected} (trovati: ${headers})`);
  }
  report(`Spesa per reparto: ${headers.replace(/\n/g, ' ')}`);
} catch (e) {
  problems.push(`Gruppo 3 (spesa): ${e.message}`);
}

// Scadenze: una missione che scade oggi accende il pallino rosso su Missioni
try {
  const hero = page.locator('button[title*="tieni premuto"]').last();
  const box = await hero.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();
  await page.waitForTimeout(400);
  await page.locator('input[name="name"]').fill('Scadenza di prova');
  const t = new Date();
  const today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  await page.locator('input[name="dueDate"]').first().fill(today);
  await page.locator('.modal-action-save').click();
  await page.waitForTimeout(600);
  const dot = await page.locator('.nav-dot').allInnerTexts();
  if (dot.length === 0) throw new Error('pallino rosso non comparso');
  report(`Scadenze: pallino su Missioni = ${dot.join(',')}`);
} catch (e) {
  problems.push(`Gruppo 4 (scadenze): ${e.message}`);
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
