// Plugin de Vite del framework. Un proyecto solo necesita:
//
//   import { defineConfig } from 'vite'
//   import nt from 'framework-nt-css/vite'
//   export default defineConfig({ plugins: [nt()] })
//
// Qué hace:
// - Añade React y Tailwind v4 (desde el framework: el proyecto no los configura).
// - Lee nt.config.json del proyecto (plantilla + tema) y lo expone como `virtual:nt-config`.
// - Inyecta el tema en index.html ANTES de pintar (sin parpadeo) y la pantalla de arranque (#nt-boot).
// - Deduplica React (el framework se enlaza con file:, así hay una sola copia).
// - En el Theme Studio (studio: true) monta la API para listar/guardar temas.
import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { themeDeclarations, validateTheme } from '../theme/tokens.js'
import { FRAMEWORK_ROOT, listTemplates, listThemes, loadProjectConfig, projectPaths, readJson, THEMES_DIR, writeJson } from '../node/catalog.js'
import { effectiveProject } from '../node/scan.js'

export { FRAMEWORK_ROOT }

const VIRTUAL_ID = 'virtual:nt-config'
const RESOLVED_ID = '\0' + VIRTUAL_ID

const escapeHtml = (text) => String(text).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]))

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => { data += chunk; if (data.length > 1e6) reject(new Error('Body demasiado grande')) })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

const sendJson = (res, status, body) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)) }

// API del Theme Studio (solo en desarrollo local).
function studioApi(project) {
  return async (req, res, next) => {
    if (!req.url?.startsWith('/__nt/')) return next()
    try {
      const url = new URL(req.url, 'http://localhost')
      if (req.method === 'GET' && url.pathname === '/__nt/themes') return sendJson(res, 200, { themes: listThemes() })
      if (req.method === 'GET' && url.pathname === '/__nt/templates') return sendJson(res, 200, { templates: listTemplates() })
      if (req.method === 'GET' && url.pathname === '/__nt/project') {
        if (!project) return sendJson(res, 200, { project: null })
        return sendJson(res, 200, { project: { path: project, name: path.basename(project), ...loadProjectConfig(project).config } })
      }
      if (req.method === 'POST' && url.pathname === '/__nt/themes') {
        const theme = JSON.parse(await readBody(req))
        const problems = validateTheme(theme)
        if (problems.length) return sendJson(res, 400, { error: problems.join(' ') })
        const clean = { $schema: '../references/theme.schema.json', id: theme.id, name: theme.name || theme.id, description: theme.description || '', scheme: theme.scheme || 'dark', colors: theme.colors, font: theme.font, radius: theme.radius }
        writeJson(path.join(THEMES_DIR, `${theme.id}.json`), clean)
        return sendJson(res, 200, { ok: true, file: `themes/${theme.id}.json` })
      }
      // Aplica tema y/o plantilla al proyecto desde el que se abrió el studio (nt theme --project <dir>).
      if (req.method === 'POST' && url.pathname === '/__nt/project') {
        if (!project) return sendJson(res, 400, { error: 'El studio no se abrió con --project.' })
        const body = JSON.parse(await readBody(req))
        const file = projectPaths(project).config
        fs.mkdirSync(path.dirname(file), { recursive: true })
        const current = readJson(file, {})
        const next = { ...current, ...(body.theme ? { theme: body.theme } : {}), ...(body.template ? { template: body.template } : {}) }
        writeJson(file, next)
        return sendJson(res, 200, { ok: true, config: next })
      }
      return sendJson(res, 404, { error: 'Ruta desconocida' })
    } catch (error) {
      return sendJson(res, 500, { error: error.message })
    }
  }
}

export default function nt(options = {}) {
  let root = process.cwd()
  let isServe = true
  const isStudio = Boolean(options.studio)
  const projectOption = options.project || process.env.NT_PROJECT
  const project = projectOption ? path.resolve(projectOption) : null
  // En el studio abierto desde un proyecto se parte del tema y la plantilla de ese proyecto.
  const configRoot = () => (isStudio && project ? project : root)

  const core = {
    name: 'framework-nt-css',
    enforce: 'pre',
    config(userConfig) {
      root = path.resolve(userConfig.root || process.cwd())
      return {
        resolve: { dedupe: ['react', 'react-dom', 'gsap', '@gsap/react'] },
        server: { fs: { allow: [FRAMEWORK_ROOT, root] } }
      }
    },
    // La raíz definitiva (incluye `vite <dir>` y --root) solo se conoce aquí.
    configResolved(resolved) { root = resolved.root; isServe = resolved.command === 'serve' },
    resolveId(id) { if (id === VIRTUAL_ID) return RESOLVED_ID },
    load(id) {
      if (id !== RESOLVED_ID) return
      const { file, config, theme } = loadProjectConfig(configRoot())
      if (!isStudio) this.addWatchFile(file)
      const templates = listTemplates().map(({ id: templateId, name }) => ({ id: templateId, name }))
      // En el studio abierto desde un proyecto conectado: su estructura (para la vista previa).
      const connected = isStudio && project ? effectiveProject(readJson(projectPaths(project).project, null)) : null
      return `export default ${JSON.stringify({ ...config, resolvedTheme: theme, templates, studio: isStudio, project: connected })}`
    },
    configureServer(server) {
      // El studio edita en vivo: no se recarga solo al guardar.
      if (isStudio) { server.middlewares.use(studioApi(project)); return }
      // Cambiar nt.config.json (p. ej. al migrar de plantilla) o un tema del framework recarga la app.
      const configFile = projectPaths(root).config
      server.watcher.add([configFile, THEMES_DIR])
      server.watcher.on('change', (changed) => {
        const file = path.resolve(changed)
        if (file === configFile || file.startsWith(THEMES_DIR)) {
          const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
          if (mod) server.moduleGraph.invalidateModule(mod)
          server.ws.send({ type: 'full-reload' })
        }
      })
    },
    transformIndexHtml: {
      order: 'pre',
      handler() {
        const { config, theme } = loadProjectConfig(configRoot())
        const brand = escapeHtml(config.app?.name || 'app')
        // Config para <NtApp> (no depende de Vite: en Next.js llega como prop desde getNtConfig()).
        const runtimeConfig = JSON.stringify({ ...config, resolvedTheme: theme, dev: isServe }).replace(/</g, '\\u003c')
        return [
          { tag: 'script', children: `window.__NT_CONFIG__ = ${runtimeConfig}`, injectTo: 'head' },
          { tag: 'style', attrs: { id: 'nt-theme' }, children: `:root { ${themeDeclarations(theme)} }`, injectTo: 'head-prepend' },
          { tag: 'meta', attrs: { name: 'theme-color', content: theme.colors.canvas }, injectTo: 'head' },
          { tag: 'meta', attrs: { name: 'color-scheme', content: theme.scheme }, injectTo: 'head' },
          { tag: 'script', children: "document.documentElement.classList.add('nt-js')", injectTo: 'head' },
          { tag: 'div', attrs: { id: 'nt-boot', 'aria-hidden': 'true' }, children: `<div class="nt-boot-mark"><span class="nt-boot-name">${brand}</span><span class="nt-boot-bar"><i></i></span></div>`, injectTo: 'body-prepend' }
        ]
      }
    }
  }

  return [core, react(), tailwindcss()]
}
