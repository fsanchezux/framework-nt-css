import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import nt from '../src/vite/plugin.js'

// NT Studio: app de muestra de TODO el framework + editor de colores en vivo.
// Se abre con `node scripts/nt.mjs theme` (o `npm run studio`).
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [nt({ studio: true })],
  server: { port: Number(process.env.NT_PORT) || 5180 }
})
