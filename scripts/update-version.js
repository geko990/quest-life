import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

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
