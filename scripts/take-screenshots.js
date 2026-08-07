import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = '/Users/enrico/.gemini/antigravity/brain/cef1ec53-09f0-40a0-a1d3-d930869d36b9';

// Simple static file server serving dist/
const distDir = path.join(rootDir, 'dist');
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(distDir, 'index.html');
  }
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server Error');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(3456, async () => {
  console.log('🌐 Static preview server running at http://localhost:3456');

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 420, height: 860, deviceScaleFactor: 2 });

    const captureState = async (name, settingsOverride) => {
      await page.goto('http://localhost:3456', { waitUntil: 'networkidle0' });

      // Apply settings directly to LocalStorage & documentElement
      await page.evaluate((newSettings) => {
        const currentData = localStorage.getItem('rpg_life_data_v3');
        let state = currentData ? JSON.parse(currentData) : {};
        state.settings = { ...(state.settings || {}), ...newSettings };
        localStorage.setItem('rpg_life_data_v3', JSON.stringify(state));

        // Trigger root attributes
        const root = document.documentElement;
        const theme = newSettings.theme || 'standard';
        const mode = newSettings.themeMode === 'light' ? 'light' : 'dark';
        const accent = newSettings.accent || 'violet';

        root.className = `theme-${theme} accent-${accent}`;
        root.setAttribute('data-theme', theme);
        root.setAttribute('data-mode', mode);
        root.setAttribute('data-accent', accent);
      }, settingsOverride);

      // Reload to ensure full component state re-render
      await page.reload({ waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 600));

      const savePath = path.join(artifactDir, `${name}.png`);
      await page.screenshot({ path: savePath, fullPage: false });
      console.log(`📸 Screenshot saved: ${savePath}`);
    };

    // 1. Standard Theme - Dark Mode
    await captureState('theme_standard_dark', { theme: 'standard', themeMode: 'dark', accent: 'violet' });

    // 2. Standard Theme - Light Mode
    await captureState('theme_standard_light', { theme: 'standard', themeMode: 'light', accent: 'violet' });

    // 3. Accent Gold
    await captureState('accent_gold', { theme: 'standard', themeMode: 'dark', accent: 'gold' });

    // 4. Accent Emerald / Green
    await captureState('accent_emerald', { theme: 'standard', themeMode: 'dark', accent: 'emerald' });

    // 5. Accent Rose / Red
    await captureState('accent_rose', { theme: 'standard', themeMode: 'dark', accent: 'rose' });

    // 6. Accent Cyan
    await captureState('accent_cyan', { theme: 'standard', themeMode: 'dark', accent: 'cyan' });

    // 7. Fantasy Theme - Light Mode
    await captureState('theme_fantasy_light', { theme: 'fantasy', themeMode: 'light', accent: 'gold' });

    // 8. Fantasy Theme - Dark Mode
    await captureState('theme_fantasy_dark', { theme: 'fantasy', themeMode: 'dark', accent: 'gold' });

    // 9. D&D Theme - Light Mode
    await captureState('theme_dnd_light', { theme: 'dnd', themeMode: 'light', accent: 'red' });

    // 10. Futuristic Theme - Dark Mode
    await captureState('theme_futuristic_dark', { theme: 'futuristic', themeMode: 'dark', accent: 'cyan' });

    await browser.close();
    server.close();
    console.log('✨ All screenshots captured successfully!');
  } catch (err) {
    console.error('❌ Error during screenshot capture:', err);
    server.close();
    process.exit(1);
  }
});
