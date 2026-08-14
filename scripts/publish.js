import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const customMsg = args.filter(arg => !arg.startsWith('--')).join(' ');
const noBump = args.includes('--no-bump');

try {
  const nodeDir = path.dirname(process.execPath);
  const execOpts = { stdio: 'inherit', cwd: rootDir, env: { ...process.env, PATH: `${nodeDir}:${process.env.PATH || ''}` } };

  console.log('🚀 Avvio processo di rilascio PWA su GitHub Pages...\n');

  // 1. Build project & bump version if needed
  console.log('📦 1/4 Aggiornamento versione e build dell\'applicazione...');
  const bumpFlag = noBump ? '' : ' --bump';
  execSync(`node scripts/update-version.js${bumpFlag}`, execOpts);
  execSync(`npx vite build`, execOpts);
  execSync(`cp -r dist/* .`, execOpts);
  execSync(`node scripts/update-version.js --post`, execOpts);

  // Read updated version
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  const version = pkg.version;

  // 2. Stage files in Git
  console.log('\n📂 2/4 Aggiunta file a Git...');
  execSync('git add .', execOpts);

  // 3. Commit
  const commitMsg = customMsg ? `release v${version}: ${customMsg}` : `release v${version}: aggiornamento PWA`;
  console.log(`\n📝 3/4 Creazione commit: "${commitMsg}"...`);
  try {
    execSync(`git commit -m "${commitMsg}"`, execOpts);
  } catch (e) {
    console.log('⚠️ Nessuna nuova modifica da committare.');
  }

  // 4. Push to GitHub main
  console.log('\n⬆️ 4/4 Invio modifiche a GitHub (branch main)...');
  execSync('git push origin main', execOpts);

  console.log(`\n✅ RILASCIO COMPLETATO CON SUCCESSO! 🎉`);
  console.log(`📌 Versione: v${version}`);
  console.log(`🌐 Repository: https://github.com/geko990/quest-life`);
  console.log(`📱 GitHub Pages si aggiornerà automaticamente tra 1-2 minuti.`);
  console.log(`💡 Apri l'app sul cellulare per caricare la nuova versione!\n`);
} catch (err) {
  console.error('\n❌ Errore durante il rilascio:', err.message);
  process.exit(1);
}
