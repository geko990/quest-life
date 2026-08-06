import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isPostBuild = process.argv.includes('--post');

const cleanIndexHtml = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>RPG Life</title>
  
  <!-- PWA Setup -->
  <link rel="manifest" href="./manifest.json">
  <link rel="apple-touch-icon" href="./icon.png">
  <link rel="icon" type="image/png" href="./icon.png">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="theme-color" content="#0f0f1a">

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Orbitron:wght@400;700&family=Outfit:wght@300;400;500;600;700&family=Patrick+Hand&display=swap" rel="stylesheet">
</head>
<body class="bg-[#0f0f1a] text-slate-100 min-h-screen">
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
`;

if (isPostBuild) {
  // Post build step: ensure root index.html stays clean for future Vite builds
  fs.writeFileSync(path.join(rootDir, 'index.html'), cleanIndexHtml, 'utf8');
  console.log('[Version Updater] Post-build: Cleaned root index.html for next build.');
  process.exit(0);
}

// Pre-build step
fs.writeFileSync(path.join(rootDir, 'index.html'), cleanIndexHtml, 'utf8');

const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const version = pkg.version || '1.0.0';
const now = new Date();
const buildTime = now.toISOString();
const timestamp = now.getTime();
const cacheName = `rpg-life-v${version}-${timestamp}`;

console.log(`[Version Updater] Syncing RPG Life v${version} (Build: ${buildTime}, Cache: ${cacheName})`);

const versionJsonContent = JSON.stringify({ version, buildTime, timestamp }, null, 2) + '\n';

// 1. Update version.json everywhere (root, public, dist)
const targetDirs = [rootDir, path.join(rootDir, 'public'), path.join(rootDir, 'dist')];

targetDirs.forEach((dir) => {
  if (fs.existsSync(dir)) {
    fs.writeFileSync(path.join(dir, 'version.json'), versionJsonContent, 'utf8');
  }
});

// 2. Update src/utils/constants.js
const constantsPath = path.join(rootDir, 'src', 'utils', 'constants.js');
if (fs.existsSync(constantsPath)) {
  let constantsContent = fs.readFileSync(constantsPath, 'utf8');

  constantsContent = constantsContent.replace(
    /export const APP_VERSION = ['"].*?['"];/,
    `export const APP_VERSION = '${version}';`
  );

  if (constantsContent.includes('export const BUILD_TIME')) {
    constantsContent = constantsContent.replace(
      /export const BUILD_TIME = ['"].*?['"];/,
      `export const BUILD_TIME = '${buildTime}';`
    );
  } else {
    constantsContent = `export const BUILD_TIME = '${buildTime}';\n` + constantsContent;
  }

  fs.writeFileSync(constantsPath, constantsContent, 'utf8');
}

// 3. Update sw.js everywhere (root, public, dist)
const updateSWFile = (swPath) => {
  if (!fs.existsSync(swPath)) return;
  let swContent = fs.readFileSync(swPath, 'utf8');

  swContent = swContent.replace(
    /const CACHE_NAME = ['"].*?['"];/,
    `const CACHE_NAME = '${cacheName}';`
  );

  if (swContent.includes('const SW_VERSION')) {
    swContent = swContent.replace(
      /const SW_VERSION = ['"].*?['"];/,
      `const SW_VERSION = '${version}';`
    );
  } else {
    swContent = swContent.replace(
      `const CACHE_NAME = '${cacheName}';`,
      `const CACHE_NAME = '${cacheName}';\nconst SW_VERSION = '${version}';`
    );
  }

  fs.writeFileSync(swPath, swContent, 'utf8');
};

targetDirs.forEach((dir) => {
  updateSWFile(path.join(dir, 'sw.js'));
});

console.log('[Version Updater] Successfully updated all version strings and cache keys across root, public, and dist.');
