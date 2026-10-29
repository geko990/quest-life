import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Il JSX dell'app passa da src/jsx/ (Fluent Emoji al posto delle emoji del telefono, #54)
    react({ jsxImportSource: 'quest-jsx' }),
    tailwindcss()
  ],
  resolve: {
    alias: [
      { find: /^quest-jsx\/jsx-runtime$/, replacement: fileURLToPath(new URL('./src/jsx/jsx-runtime.js', import.meta.url)) },
      { find: /^quest-jsx\/jsx-dev-runtime$/, replacement: fileURLToPath(new URL('./src/jsx/jsx-dev-runtime.js', import.meta.url)) }
    ]
  },
  base: './'
});
