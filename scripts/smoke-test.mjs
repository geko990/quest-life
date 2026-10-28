// Test di fumo: apre il build in dist/ in un browser vero, visita ogni scheda
// e fallisce se compaiono errori JavaScript o file mancanti (404).
// Uso (dopo `npm run build`): npx vite preview --port 4173 & node scripts/smoke-test.mjs
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = process.env.SMOKE_URL || 'http://localhost:4173/';
const SHOTS = 'ci-shots';
fs.mkdirSync(SHOTS, { recursive: true });
const problems = [];
const report = (msg) => console.log(`::notice::${msg}`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const shot = async (name) => { try { await page.screenshot({ path: `${SHOTS}/${name}.png` }); } catch (_) {} };

page.on('pageerror', (e) => problems.push(`Errore JS: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`Console: ${m.text()}`); });
page.on('response', (r) => {
  const url = r.url();
  if (url.startsWith(BASE) && r.status() >= 400) problems.push(`HTTP ${r.status()}: ${url.replace(BASE, '')}`);
});

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.querySelector('#root')?.children.length > 0, null, { timeout: 15000 });
report(`App avviata: "${(await page.title())}", Home con ${(await page.locator('#root').innerText()).length} caratteri visibili`);

// Primo avvio: tema Standard in modalità chiara (prima partiva con un tema inesistente, misto chiaro/scuro)
{
  const firstTheme = await page.evaluate(() => `${document.documentElement.dataset.theme}/${document.documentElement.dataset.mode}`);
  if (firstTheme !== 'standard/light') problems.push(`Tema al primo avvio: ${firstTheme} invece di standard/light`);
  else report('Primo avvio: tema Standard chiaro');
  await shot('00-primo-avvio');
}
// Schermata Eroe così come si apre (tessera del radar quadrata, aria sopra la nav bar)
await page.waitForTimeout(1500);
await shot('00-eroe');

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

// Screenshot delle schermate principali (salvati su GitHub nel ramo ci-screenshots)
const navTo = async (label) => {
  await page.locator('button, [role="button"], div, span', { hasText: new RegExp(`^${label}$`) }).last().click({ force: true });
  await page.waitForTimeout(600);
};
const tapOutside = async () => { await page.mouse.click(8, 8); await page.waitForTimeout(400); };
const step = async (name, fn) => { try { await fn(); await shot(name); } catch (e) { console.log(`(screenshot ${name} non riuscito: ${e.message})`); } };
await navTo('Abitudini');
await shot('01-abitudini');
await navTo('Missioni');
await step('02-missioni', async () => {});
await step('03-dettaglio-missione', async () => {
  await page.getByText('Scadenza di prova').first().click();
  await page.waitForTimeout(600);
});
await tapOutside();
await step('04-crea-task', async () => {
  const hero = page.locator('button[title*="tieni premuto"]').last();
  const box = await hero.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down(); await page.waitForTimeout(700); await page.mouse.up();
  await page.waitForTimeout(600);
});
await tapOutside();
await step('05-modifica-missione', async () => {
  await page.getByText('Scadenza di prova').first().click();
  await page.waitForTimeout(500);
  await page.locator('.modal-edit-fab').click();
  await page.waitForTimeout(600);
});
await tapOutside();
await navTo('Eroe').catch(() => {});
await step('05b-dettaglio-attributo', async () => {
  const hero = page.locator('button[title*="tieni premuto"]').last();
  await hero.click();
  await page.waitForTimeout(500);
  await page.getByText('Forza').first().click();
  await page.waitForTimeout(600);
});
await tapOutside();
await navTo('Abitudini');
await navTo('Salute');
await shot('06-salute');
await step('07-pasto-rapido', async () => {
  await page.locator('[title^="Tocca per inserire pasto rapido"]').first().click();
  await page.waitForTimeout(600);
});
await tapOutside();
await step('08-registro-pasti', async () => {
  await page.locator('[title^="Apri registro pasti"]').first().click();
  await page.waitForTimeout(600);
});
await tapOutside();
await navTo('Salute');
await step('09-spesa', async () => {});
await navTo('Opzioni');
// Opzioni con tutte le tessere chiuse: devono stare in una schermata (iPhone 6,1" ≈ 393×759 senza safe area)
await step('10a-opzioni', async () => {
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => {
    const groups = Array.from(document.querySelectorAll('#section-settings .opt-group'));
    const navs = Array.from(document.querySelectorAll('nav'));
    const nav = navs[navs.length - 1];
    const last = groups[groups.length - 1];
    if (!last || !nav) return null;
    return { groups: groups.length, lastBottom: Math.round(last.getBoundingClientRect().bottom), navTop: Math.round(nav.getBoundingClientRect().top) };
  });
  if (!m) throw new Error('tessere delle Opzioni non trovate');
  const over852 = m.lastBottom - m.navTop;
  report(`Opzioni: ${m.groups} tessere, ultima finisce a ${m.lastBottom}px, nav bar a ${m.navTop}px → sporgenza ${over852}px a 852px, circa ${over852 + 93}px a 759px`);
});
await step('10-opzioni-promemoria', async () => {
  const groupHeader = page.getByText('🎮 Gioco').first();
  await groupHeader.click();
  await page.waitForTimeout(400);
  await page.getByText('Promemoria scadenze').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
});

// Giornate tipo: una nuova azione con orario precedente si sposta da sola al posto giusto
await page.getByText('🎮 Gioco').first().click();
await page.waitForTimeout(300);
await step('17-giornata-tipo', async () => {
  await page.locator('.opt-chip').first().click();
  await page.waitForTimeout(500);
  await page.getByText('+ Aggiungi azione').click();
  await page.waitForTimeout(300);
  const rows = page.locator('.dt-step');
  const n = await rows.count();
  const last = rows.nth(n - 1);
  await last.locator('.dt-title').fill('Test prima di tutto');
  await last.locator('.dt-time').fill('05:30');
  await last.locator('.dt-title').click(); // lascia il campo dell'ora → riordino
  await page.waitForTimeout(400);
  const first = await page.locator('.dt-step').first().locator('.dt-title').inputValue();
  if (first !== 'Test prima di tutto') throw new Error(`Giornate tipo: dopo il riordino la prima azione è "${first}"`);
  report(`Giornate tipo: riordino per orario OK (${n} azioni)`);
});
await tapOutside();

// Registro errori: voci nel vecchio formato → raggruppate, filtrate, eliminabili, segnalabili su GitHub
try {
  await page.evaluate(() => {
    const legacy = (i, msg, name = 'ReferenceError') => ({
      id: `err_test_${i}`, timestamp: new Date(Date.now() - i * 60000).toISOString(), name, message: msg,
      stack: 'onClick@https://geko990.github.io/quest-life/assets/index-ABC.js:1:2',
      context: { type: 'uncaught_error', secret: 'non deve uscire' }
    });
    const list = [1, 2, 3, 4, 5].map(i => legacy(i, "Can't find variable: onToggleSubquest"));
    list.push(legacy(6, 'Invalid value "Pasta della nonna" for mario.rossi@example.com', 'TypeError'));
    localStorage.setItem('questlife_error_log', JSON.stringify(list));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.evaluate(() => { window.__openedUrl = null; window.open = (u) => { window.__openedUrl = u; return null; }; });
  await navTo('Opzioni');
  const panel = page.getByText('Registro Errori & Diagnostica').first();
  await panel.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const rootText = await page.locator('#root').innerText();
  if (!/5×/.test(rootText)) throw new Error('i 5 errori uguali non sono raggruppati');
  if (/Pasta della nonna|mario\.rossi/.test(rootText)) throw new Error('il filtro dei dati personali non ha funzionato');
  await page.getByText('🗑️ Svuota').first().scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 140));
  await page.waitForTimeout(300);
  await shot('12-registro-errori');
  await page.getByText('🐙 Segnala su GitHub').first().click();
  const url = await page.evaluate(() => window.__openedUrl);
  if (!url || !url.startsWith('https://github.com/geko990/quest-life/issues/new?')) throw new Error(`indirizzo GitHub non valido: ${url}`);
  const body = new URL(url).searchParams.get('body') || '';
  if (/non deve uscire|Pasta della nonna/.test(body) || !/onToggleSubquest/.test(body)) throw new Error('corpo della segnalazione non filtrato correttamente');
  page.once('dialog', d => d.accept());
  await page.locator('button[aria-label="Elimina questo errore (risolto)"]').first().click();
  await page.waitForTimeout(300);
  const left = await page.evaluate(() => JSON.parse(localStorage.getItem('questlife_error_log') || '[]').length);
  if (left !== 1) throw new Error(`dopo l'eliminazione restano ${left} voci invece di 1`);
  report(`Registro errori: raggruppamento, filtro, segnalazione GitHub (${url.length} caratteri) ed eliminazione OK`);
  await page.evaluate(() => localStorage.removeItem('questlife_error_log'));
} catch (e) {
  problems.push(`Gruppo 5 (registro errori): ${e.message}`);
}

// Tesoro: scheda del conto a forma di carta, sempre tra barra superiore e nav bar
try {
  await page.evaluate(() => {
    const raw = localStorage.getItem('questlife_state_v2');
    const st = raw ? JSON.parse(raw) : {};
    const d = (n) => { const x = new Date(); x.setDate(x.getDate() - n); return x.toISOString().slice(0, 10); };
    const tx = [];
    const notes = ['Spesa settimanale', 'Benzina', 'Pizza con amici', 'Libro', 'Casello autostrada', 'Farmacia', 'Regalo', 'Abbonamento palestra'];
    for (let i = 0; i < 40; i++) {
      tx.push({ id: `tx_test_${i}`, type: i % 9 === 0 ? 'income' : 'expense', amount: 5 + (i * 7) % 60, category: i % 9 === 0 ? 'stipendio' : 'cibo', account: 'sec_test', note: notes[i % notes.length], date: d(Math.floor(i / 2)), timestamp: Date.now() - i * 1000 });
    }
    tx.push({ id: 'tx_test_trf', type: 'transfer', amount: 200, category: 'trasferimento', sourceAccount: 'base', targetAccount: 'sec_test', account: 'base', note: 'Accantonamento', date: d(1), timestamp: Date.now() });
    st.finances = {
      ...(st.finances || {}), baseAccountName: 'Conto Base', balance: 1520.4, cashBalance: 85, monthlyBudget: 1000, hideBalances: false,
      secondaryAccounts: [{ id: 'sec_test', name: 'Conto Risparmi', emoji: '🛡️', balance: 2717.82, interestRate: 3, interestFrequency: 'monthly', lockPeriodMonths: 0 }],
      transactions: tx,
      recurringTransactions: [{ id: 'rec_test', type: 'expense', amount: 9.99, category: 'svago', account: 'sec_test', note: 'Streaming', dayOfMonth: 5, active: true }]
    };
    localStorage.setItem('questlife_state_v2', JSON.stringify(st));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await navTo('Opzioni');
  await navTo('Opzioni');
  await page.waitForTimeout(500);
  await shot('13-tesoro');
  const checkBounds = async (label) => {
    const r = await page.evaluate(() => {
      const sheet = document.querySelector('.acc-sheet')?.getBoundingClientRect();
      const visible = (sel) => [...document.querySelectorAll(sel)].map(e => e.getBoundingClientRect()).filter(b => b.height > 0);
      const header = visible('header')[0];
      const nav = visible('nav').pop();
      return sheet ? { top: sheet.top, bottom: sheet.bottom, headerBottom: header ? header.bottom : 0, navTop: nav ? nav.top : innerHeight } : null;
    });
    if (!r) throw new Error(`${label}: la scheda del conto non si è aperta`);
    if (r.top < r.headerBottom - 1 || r.bottom > r.navTop + 1) {
      throw new Error(`${label}: la scheda esce dalle barre (scheda ${Math.round(r.top)}–${Math.round(r.bottom)}, barre ${Math.round(r.headerBottom)}–${Math.round(r.navTop)})`);
    }
    return r;
  };
  await page.getByText('Conto Risparmi').first().click();
  await page.waitForTimeout(1600);
  const r1 = await checkBounds('Conto risparmi');
  const txt = await page.locator('.acc-sheet').innerText();
  if (!/Streaming/.test(txt)) throw new Error('la ricorrente del conto non compare');
  if (!/Accantonamento/.test(txt)) throw new Error('il trasferimento in entrata non compare nel conto di arrivo');
  await shot('14-conto-carta');
  await page.locator('.acc-body').evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await page.waitForTimeout(300);
  await shot('15-conto-carta-fondo');
  await tapOutside();
  await page.locator('div', { hasText: /^💳 Conto Base$/ }).last().click({ force: true });
  await page.waitForTimeout(1200);
  await checkBounds('Conto base');
  await shot('16-conto-base');
  await tapOutside();
  report(`Tesoro: schede dei conti entro le barre (scheda ${Math.round(r1.top)}–${Math.round(r1.bottom)}, barre ${Math.round(r1.headerBottom)}–${Math.round(r1.navTop)}), ricorrenti e trasferimenti OK`);
} catch (e) {
  problems.push(`Gruppo 6 (Tesoro): ${e.message}`);
}

// Inglese: imposto la lingua, ricarico e controllo le etichette
try {
  await page.evaluate(() => {
    const raw = localStorage.getItem('questlife_state_v2');
    const st = raw ? JSON.parse(raw) : {};
    st.settings = { ...(st.settings || {}), language: 'en' };
    localStorage.setItem('questlife_state_v2', JSON.stringify(st));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const navText = await page.locator('nav').last().innerText();
  if (!/Habits/.test(navText) || !/Missions/.test(navText)) throw new Error(`nav non tradotta: ${navText.replace(/\n/g, ' ')}`);
  const sample = [];
  for (const label of ['Habits', 'Missions', 'Health', 'Settings']) {
    await page.locator('button, [role="button"], div, span', { hasText: new RegExp(`^${label}$`) }).last().click({ force: true });
    await page.waitForTimeout(500);
    sample.push(`${label}: ${(await page.locator('#root').innerText()).replace(/\s+/g, ' ').slice(0, 160)}`);
  }
  await shot('11-inglese-impostazioni');
  report(`Inglese OK. ${sample.join(' || ')}`.slice(0, 900));
} catch (e) {
  problems.push(`Gruppo 5 (inglese): ${e.message}`);
}

// Controlli sul build
const css = fs.readdirSync('dist/assets').filter((f) => f.endsWith('.css'))
  .map((f) => fs.readFileSync(`dist/assets/${f}`, 'utf8')).join('');
if (!css.includes('[data-theme=')) problems.push('Temi mancanti nel CSS');
for (const f of ['sw.js', 'version.json', 'manifest.json', 'icon.png']) {
  const res = await page.request.get(BASE + f);
  if (res.status() !== 200) problems.push(`${f} mancante nel sito (${res.status()})`);
}
report(`Versione pubblicata: ${fs.readFileSync('dist/version.json', 'utf8').replace(/\s+/g, ' ')}`);

// Tastiera di iOS (#47): iOS non restringe la pagina, riduce solo lo "spazio visibile" (visualViewport).
// Lo si simula con un visualViewport finto: aprendo un campo nella finestra Giornate tipo l'app deve
// restare entro lo spazio sopra la tastiera, senza barra in basso, con il campo in vista.
try {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  await ctx.addInitScript(() => {
    const fake = new EventTarget();
    Object.assign(fake, { width: 393, height: window.innerHeight || 852, offsetTop: 0, offsetLeft: 0, pageTop: 0, pageLeft: 0, scale: 1 });
    Object.defineProperty(window, 'visualViewport', { value: fake, configurable: true });
    window.__setKeyboard = (h) => { fake.height = (window.innerHeight || 852) - h; fake.dispatchEvent(new Event('resize')); };
  });
  const p3 = await ctx.newPage();
  await p3.goto(BASE, { waitUntil: 'networkidle' });
  await p3.waitForFunction(() => document.querySelector('#root')?.children.length > 0, null, { timeout: 15000 });
  await p3.waitForTimeout(2500);
  await p3.mouse.click(6, 6); // chiude un'eventuale finestra del primo avvio
  await p3.waitForTimeout(400);
  await p3.locator('button, [role="button"], div, span', { hasText: /^Opzioni$/ }).last().click({ force: true });
  await p3.waitForTimeout(800);
  await p3.getByText('+ Nuova', { exact: true }).first().click();
  await p3.waitForTimeout(600);
  const field = p3.locator('.modal-content input[type="text"], .modal-content input:not([type])').last();
  await field.focus();
  await p3.evaluate(() => window.__setKeyboard(372)); // spazio visibile 480 px
  await p3.waitForTimeout(500);
  const kb = await p3.evaluate(() => {
    const ov = document.querySelector('.kb-overlay');
    const r = document.activeElement.getBoundingClientRect();
    const nav = document.querySelector('.app-bottom-nav');
    return {
      open: document.documentElement.getAttribute('data-keyboard'),
      overlay: ov ? Math.round(ov.getBoundingClientRect().height) : null,
      fieldTop: Math.round(r.top), fieldBottom: Math.round(r.bottom),
      nav: nav ? getComputedStyle(nav).display : 'assente',
      app: Math.round(document.querySelector('.app-container').getBoundingClientRect().height)
    };
  });
  await p3.screenshot({ path: `${SHOTS}/17-tastiera.png`, clip: { x: 0, y: 0, width: 393, height: 480 } });
  if (kb.open !== 'open') throw new Error('stato "tastiera aperta" non rilevato');
  if (kb.overlay === null || Math.abs(kb.overlay - 480) > 2) throw new Error(`finestra alta ${kb.overlay} px invece di 480`);
  if (kb.fieldTop < 0 || kb.fieldBottom > 480) throw new Error(`campo fuori dallo spazio visibile (${kb.fieldTop}–${kb.fieldBottom})`);
  if (kb.nav !== 'none') throw new Error('la barra in basso resta visibile con la tastiera');
  if (Math.abs(kb.app - 480) > 2) throw new Error(`app alta ${kb.app} px invece di 480`);
  await field.blur();
  await p3.evaluate(() => window.__setKeyboard(0));
  await p3.waitForTimeout(400);
  const closed = await p3.evaluate(() => ({ open: document.documentElement.getAttribute('data-keyboard'), ov: !!document.querySelector('.kb-overlay') }));
  if (closed.open || closed.ov) throw new Error('lo stato tastiera non si chiude');
  report(`Tastiera iOS simulata: app ${kb.app}px, finestra ${kb.overlay}px, campo a ${kb.fieldTop}–${kb.fieldBottom}px, barra nascosta`);
  await ctx.close();
} catch (e) {
  problems.push(`Tastiera iOS: ${e.message}`);
}

// Versione vecchia dopo una pubblicazione: il pezzo principale dell'app non si carica una volta
// ("Importing a module script failed"). L'app deve ripulire e ricaricarsi da sola, senza schermata vuota.
try {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, serviceWorkers: 'block' });
  const p2 = await ctx.newPage();
  let blocked = 0;
  // come dopo una pubblicazione: il file non esiste più finché la pagina non si ricarica dalla rete
  await p2.route(/\/assets\/bootApp-[^/]+\.js$/, (route) => {
    let pageUrl = '';
    try { pageUrl = route.request().frame().url(); } catch (_) {}
    if (!/[?&]v=\d+/.test(pageUrl)) { blocked++; return route.fulfill({ status: 404, body: 'Not found' }); }
    return route.continue();
  });
  const trail = [];
  p2.on('console', (m) => { if (m.type() === 'error') trail.push(m.text().slice(0, 120)); });
  p2.on('framenavigated', (f) => { if (f === p2.mainFrame()) trail.push(`→ ${f.url().replace(BASE, '/')}`); });
  await p2.goto(BASE, { waitUntil: 'load' });
  try {
    await p2.waitForFunction(() => /[?&]v=\d+/.test(location.search) && document.querySelector('#root')?.children.length > 0, null, { timeout: 15000, polling: 250 });
  } catch (e) {
    const root = await p2.evaluate(() => document.querySelector('#root')?.children.length).catch(() => '?');
    throw new Error(`app non ripartita (bloccati ${blocked}, url ${p2.url().replace(BASE, '/')}, root ${root}) — ${trail.join(' | ')}`);
  }
  if (blocked < 1) throw new Error('il pezzo bootApp non è stato intercettato');
  const logged = await p2.evaluate(() => localStorage.getItem('questlife_error_log'));
  if (logged && /Importing a module|dynamically imported module/i.test(logged)) throw new Error('il caricamento fallito è finito nel registro errori');
  report('Recupero da versione vecchia: caricamento fallito → pagina ricaricata, app avviata');
  await ctx.close();
} catch (e) {
  problems.push(`Recupero da versione vecchia: ${e.message}`);
}

await browser.close();
if (problems.length) {
  for (const p of problems) console.log(`::error::${p}`);
  process.exit(1);
}
report('Test di fumo superato: nessun errore');
