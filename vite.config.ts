import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'

/**
 * Génère public/sw.js au build en y injectant la liste des fichiers produits,
 * pour que l'application fonctionne hors ligne dès le premier chargement.
 */
function serviceWorker(): Plugin {
  return {
    name: 'pocket-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const assets = Object.keys(bundle).map((file) => `/${file}`)
      const template = readFileSync(fileURLToPath(new URL('./src/sw-template.js', import.meta.url)), 'utf8')
      const version = Date.now().toString(36)
      const source = template
        .replace('__PRECACHE__', JSON.stringify(['/', '/manifest.webmanifest', '/icon.svg', ...assets]))
        .replace('__VERSION__', version)
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), serviceWorker()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
