// Escáner de proyectos: el framework se "conecta" a un proyecto de CUALQUIER tecnología y saca lo que
// necesita para la vista previa y para aplicar el diseño: tecnología, marca, páginas/rutas, navegación,
// usuario y colores actuales. Resultado → <proyecto>/.nt/project.json
//
// project.json tiene dos partes:
//   scan       → lo detectado automáticamente (se reescribe en cada `nt connect`)
//   overrides  → correcciones del usuario o del agente (NUNCA se tocan al reescanear)
// effectiveProject() combina las dos. Así el agente puede refinar etiquetas, iconos, orden, entornos…
import fs from 'node:fs'
import path from 'node:path'
import { readJson } from './catalog.js'

export const PROJECT_SCHEMA_VERSION = 1
const IGNORE = new Set(['node_modules', '.git', '.next', '.nuxt', '.svelte-kit', '.astro', '.output', 'dist', 'build', 'out', '.nt', 'bin', 'obj', 'vendor', 'coverage', '.vercel', '.turbo', '.cache', 'public', 'storage', '__pycache__', '.venv', 'venv'])

function walk(root, { max = 4000, test = () => true } = {}) {
  const files = []
  const visit = (dir) => {
    let entries = []
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const entry of entries) {
      if (files.length >= max) return
      if (entry.name.startsWith('.') && entry.name !== '.') { if (entry.isDirectory()) continue }
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) { if (!IGNORE.has(entry.name)) visit(full) } else if (test(full)) files.push(full)
    }
  }
  visit(root)
  return files
}
const rel = (root, file) => path.relative(root, file).split(path.sep).join('/')
const read = (file, limit = 200000) => { try { return fs.readFileSync(file, 'utf8').slice(0, limit) } catch { return '' } }
const exists = (root, ...parts) => fs.existsSync(path.join(root, ...parts))
const firstExisting = (root, candidates) => candidates.find((candidate) => exists(root, candidate))

// ---------- tecnología ----------
// adapter: cómo se aplica el diseño → 'react-vite' | 'next' (componentes del framework directamente) | 'kit' (exporta CSS+HTML+JS+spec)
export function detectTech(root) {
  const pkg = readJson(path.join(root, 'package.json'), null)
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const has = (name) => Boolean(deps[name])
  const ts = exists(root, 'tsconfig.json')
  const tailwind = deps.tailwindcss ? { version: String(deps.tailwindcss).replace(/[^\d.]/g, '').split('.')[0] } : null
  const base = { language: ts ? 'ts' : 'js', packageManager: exists(root, 'pnpm-lock.yaml') ? 'pnpm' : exists(root, 'yarn.lock') ? 'yarn' : exists(root, 'bun.lockb') ? 'bun' : pkg ? 'npm' : null, tailwind, usesFramework: has('framework-nt-css') }

  if (pkg) {
    if (has('next')) return { ...base, id: 'next', label: `Next.js ${deps.next}`, family: 'react', adapter: 'next', router: firstExisting(root, ['app', 'src/app']) ? 'app' : 'pages' }
    if (has('@remix-run/react') || has('@react-router/dev')) return { ...base, id: 'react-router', label: 'React Router / Remix', family: 'react', adapter: 'kit' }
    if (has('nuxt')) return { ...base, id: 'nuxt', label: `Nuxt ${deps.nuxt}`, family: 'vue', adapter: 'kit' }
    if (has('@sveltejs/kit')) return { ...base, id: 'sveltekit', label: 'SvelteKit', family: 'svelte', adapter: 'kit' }
    if (has('astro')) return { ...base, id: 'astro', label: 'Astro', family: 'astro', adapter: 'kit' }
    if (has('@angular/core')) return { ...base, id: 'angular', label: `Angular ${deps['@angular/core']}`, family: 'angular', adapter: 'kit' }
    if (has('vue')) return { ...base, id: 'vue', label: 'Vue', family: 'vue', adapter: 'kit' }
    if (has('svelte')) return { ...base, id: 'svelte', label: 'Svelte', family: 'svelte', adapter: 'kit' }
    if (has('solid-js')) return { ...base, id: 'solid', label: 'SolidJS', family: 'solid', adapter: 'kit' }
    if (has('react') && (has('vite') || has('@vitejs/plugin-react'))) return { ...base, id: 'react-vite', label: 'React + Vite', family: 'react', adapter: 'react-vite' }
    if (has('react')) return { ...base, id: 'react', label: 'React', family: 'react', adapter: 'kit' }
  }
  const files = walk(root, { max: 400, test: (file) => /\.(csproj|cshtml|razor|php|py|rb|html)$|composer\.json$|Gemfile$|manage\.py$/.test(file) })
  const any = (re) => files.some((file) => re.test(file))
  if (any(/\.csproj$|\.cshtml$|\.razor$/)) return { ...base, id: 'aspnet', label: 'ASP.NET', family: 'server', adapter: 'kit' }
  if (any(/artisan$|\.blade\.php$/) || exists(root, 'artisan')) return { ...base, id: 'laravel', label: 'Laravel', family: 'server', adapter: 'kit' }
  if (any(/\.php$/)) return { ...base, id: 'php', label: 'PHP', family: 'server', adapter: 'kit' }
  if (any(/manage\.py$/)) return { ...base, id: 'django', label: 'Django', family: 'server', adapter: 'kit' }
  if (any(/Gemfile$/)) return { ...base, id: 'rails', label: 'Ruby on Rails', family: 'server', adapter: 'kit' }
  if (any(/\.html$/)) return { ...base, id: 'static', label: 'HTML estático', family: 'static', adapter: 'kit' }
  return { ...base, id: 'unknown', label: 'Desconocida', family: 'unknown', adapter: 'kit' }
}

// ---------- páginas ----------
const humanize = (segment) => {
  const clean = segment.replace(/^\[+\.{0,3}|\]+$/g, '').replace(/[-_]+/g, ' ').trim()
  return clean ? clean[0].toUpperCase() + clean.slice(1) : 'Inicio'
}
const SYSTEM = /(^|\/)(_[^/]*|error|not-found|404|500|loading|layout|template|default)(\.|$)/
function kindOf(route) {
  if (route === '/') return 'landing'
  if (/(login|signin|sign-in|signup|register|auth|callback|logout|forgot|reset)/i.test(route)) return 'auth'
  if (/\[|:|\{/.test(route)) return 'detail'
  if (/(new|create|edit|invite|settings|profile|account)/i.test(route)) return 'form'
  return 'list'
}
// Título de la página si se puede leer: metadata title, <title>, ViewData["Title"] o el primer <h1>.
function titleIn(text) {
  const patterns = [
    /metadata[^=]*=\s*\{[^]*?title:\s*(?:\{\s*default:\s*)?['"`]([^'"`{}]{2,60})['"`]/, // Next.js metadata
    /useHead\(\s*\{[^]*?title:\s*['"`]([^'"`{}]{2,60})['"`]/, // Nuxt
    /<title>([^<{]{2,60})<\/title>/i,
    /ViewData\["Title"\]\s*=\s*"([^"]{2,60})"/,
    /<h1[^>]*>\s*([^<{]{2,60}?)\s*</i
  ]
  for (const re of patterns) { const match = text.match(re); if (match) return match[1].trim() }
  return null
}
const page = (root, route, file) => {
  const clean = ('/' + route.split('/').filter(Boolean).join('/')).replace(/\/index$/, '') || '/'
  const id = clean === '/' ? 'home' : clean.slice(1).replace(/[[\]{}:.]/g, '').replace(/\//g, '-') || 'home'
  const last = clean.split('/').filter(Boolean).at(-1) || ''
  return { id, route: clean, label: humanize(last), title: file ? titleIn(read(file, 20000)) : null, file: file ? rel(root, file) : null, dynamic: /\[|:|\{/.test(clean), kind: kindOf(clean) }
}

function scanPages(root, tech) {
  const routes = []
  const add = (route, file) => { if (!routes.some((r) => r.route === page(root, route, file).route)) routes.push(page(root, route, file)) }
  const fromDir = (dir, re, toRoute) => walk(path.join(root, dir), { test: (file) => re.test(file) }).forEach((file) => {
    const route = toRoute(rel(path.join(root, dir), file))
    if (route !== null && !SYSTEM.test(rel(path.join(root, dir), file))) add(route, file)
  })

  if (tech.id === 'next') {
    const app = firstExisting(root, ['app', 'src/app'])
    if (app) fromDir(app, /[\\/]page\.(t|j)sx?$|^page\.(t|j)sx?$|[\\/]page\.mdx$/, (file) => {
      if (/(^|\/)api\//.test(file)) return null
      return '/' + file.split('/').slice(0, -1).filter((s) => !/^\(.*\)$/.test(s) && !s.startsWith('@')).join('/')
    })
    const pages = firstExisting(root, ['pages', 'src/pages'])
    if (pages) fromDir(pages, /\.(t|j)sx?$/, (file) => (/^(api\/|_)/.test(file) ? null : '/' + file.replace(/\.(t|j)sx?$/, '')))
  } else if (tech.id === 'nuxt') {
    const dir = firstExisting(root, ['pages', 'app/pages'])
    if (dir) fromDir(dir, /\.vue$/, (file) => '/' + file.replace(/\.vue$/, ''))
  } else if (tech.id === 'sveltekit') {
    fromDir('src/routes', /\+page\.svelte$/, (file) => '/' + file.split('/').slice(0, -1).filter((s) => !/^\(.*\)$/.test(s)).join('/'))
  } else if (tech.id === 'astro') {
    fromDir('src/pages', /\.(astro|md|mdx)$/, (file) => '/' + file.replace(/\.(astro|md|mdx)$/, ''))
  } else if (tech.id === 'aspnet') {
    if (exists(root, 'Pages')) fromDir('Pages', /\.cshtml$/, (file) => (/(^|\/)_/.test(file) ? null : '/' + file.replace(/\.cshtml$/, '')))
    if (exists(root, 'Views')) fromDir('Views', /\.cshtml$/, (file) => (/(^|\/)_|^Shared\//.test(file) ? null : '/' + file.replace(/\.cshtml$/, '').replace(/\/Index$/i, '')))
  } else if (tech.id === 'laravel') {
    read(path.join(root, 'routes/web.php')).replace(/Route::(?:get|view)\(\s*['"]([^'"]+)['"]/g, (_, route) => { add(route.replace(/\{(\w+)\??\}/g, '[$1]'), null); return '' })
  } else if (tech.id === 'django') {
    walk(root, { test: (file) => /urls\.py$/.test(file) }).forEach((file) => read(file).replace(/path\(\s*['"]([^'"]*)['"]/g, (_, route) => { add(route.replace(/<(?:\w+:)?(\w+)>/g, '[$1]'), file); return '' }))
  } else if (tech.id === 'static' || tech.id === 'php') {
    walk(root, { max: 300, test: (file) => /\.(html|php)$/.test(file) }).forEach((file) => add('/' + rel(root, file).replace(/\.(html|php)$/, ''), file))
  }

  // Routers declarados en código (React Router, Vue Router, Angular, Solid, nuestro useHashRoute…).
  if (!routes.length) {
    const sources = walk(path.join(root, exists(root, 'src') ? 'src' : '.'), { max: 600, test: (file) => /\.(t|j)sx?$|\.vue$|\.svelte$/.test(file) })
    for (const file of sources) {
      const text = read(file)
      text.replace(/<Route[^>]*\spath=["'`]([^"'`]+)["'`]/g, (_, route) => { add(route, file); return '' })
      text.replace(/\bpath:\s*["'`]([^"'`]*)["'`]/g, (_, route) => { if (!route.includes('*') && !route.includes('.')) add(route.replace(/:(\w+)/g, '[$1]'), file); return '' })
      // Apps de framework-nt-css: const PAGES = { home: Home, overview: Overview }
      const pagesMap = text.match(/const PAGES\s*=\s*\{([^}]+)\}/)
      if (pagesMap) pagesMap[1].split(',').map((entry) => entry.split(':')[0].trim()).filter(Boolean).forEach((key) => add(key === 'home' ? '/' : `/${key}`, file))
    }
  }
  // Último recurso: carpetas pages/ o views/.
  if (!routes.length) {
    const dir = firstExisting(root, ['src/pages', 'src/views', 'pages', 'views'])
    if (dir) fromDir(dir, /\.(t|j)sx?$|\.vue$|\.svelte$/, (file) => '/' + file.replace(/\.\w+$/, '').replace(/(^|\/)(index|home)$/i, ''))
  }
  return routes.sort((a, b) => (a.route === '/' ? -1 : b.route === '/' ? 1 : a.route.localeCompare(b.route)))
}

// ---------- marca, usuario y colores ----------
function scanBrand(root, tech) {
  const pkg = readJson(path.join(root, 'package.json'), null)
  const candidates = ['app/layout.tsx', 'app/layout.jsx', 'src/app/layout.tsx', 'index.html', 'src/index.html', 'app.html', 'src/app.html', 'nuxt.config.ts', 'Pages/Shared/_Layout.cshtml', 'Views/Shared/_Layout.cshtml', 'resources/views/layouts/app.blade.php']
  let title = null
  for (const candidate of candidates) { const found = titleIn(read(path.join(root, candidate), 40000)); if (found) { title = found; break } }
  const name = (title || pkg?.name || path.basename(root)).split(/[·|–—-]/)[0].trim()
  return { name: name || path.basename(root), title, package: pkg?.name || null, techLabel: tech.label }
}

const AUTH = { '@supabase/supabase-js': 'supabase', 'next-auth': 'next-auth', '@auth/core': 'auth.js', '@clerk/nextjs': 'clerk', '@clerk/clerk-react': 'clerk', firebase: 'firebase', 'lucia': 'lucia', 'better-auth': 'better-auth' }
function scanUser(root, pages) {
  const pkg = readJson(path.join(root, 'package.json'), {})
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  const provider = Object.entries(AUTH).find(([name]) => deps[name])?.[1] || null
  return { enabled: Boolean(provider || pages.some((p) => p.kind === 'auth')), provider }
}

function scanColors(root) {
  const counts = new Map()
  const vars = new Set()
  walk(root, { max: 200, test: (file) => /\.(css|scss|sass|less)$/.test(file) }).forEach((file) => {
    const text = read(file)
    for (const match of text.matchAll(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
      let hex = match[0].toLowerCase()
      if (hex.length === 4) hex = '#' + hex.slice(1).split('').map((c) => c + c).join('')
      counts.set(hex, (counts.get(hex) || 0) + 1)
    }
    for (const match of text.matchAll(/--(color-[a-z0-9-]+|[a-z0-9-]*(?:bg|background|primary|accent|brand|text|surface)[a-z0-9-]*)\s*:/gi)) vars.add(match[1])
  })
  const palette = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 16).map(([value, count]) => ({ value, count }))
  return { palette, cssVariables: [...vars].slice(0, 40) }
}

// Icono por defecto (nombre de lucide-react) según la ruta. La vista previa lo traduce; el agente puede cambiarlo en overrides.
const ICONS = [[/^\/$/, 'Home'], [/list|wish/i, 'List'], [/setting|config/i, 'Settings'], [/profile|account|user/i, 'User'], [/dashboard|panel|overview/i, 'LayoutGrid'], [/calendar|event/i, 'CalendarDays'], [/chat|message/i, 'MessageSquare'], [/team|people|member|player/i, 'Users'], [/invite|share/i, 'Send'], [/report|doc|blog|post/i, 'FileText'], [/shop|cart|product|order/i, 'ShoppingBag'], [/stat|analytic|chart/i, 'BarChart3']]
const iconFor = (route) => ICONS.find(([re]) => re.test(route))?.[1] || 'Circle'

// ---------- instantánea ----------
export function scanProject(root) {
  const tech = detectTech(root)
  const pages = scanPages(root, tech).map((p) => ({ ...p, icon: iconFor(p.route) }))
  const navPages = pages.filter((p) => !p.dynamic && p.kind !== 'auth')
  return {
    tech,
    brand: scanBrand(root, tech),
    pages,
    nav: [{ id: 'main', label: 'Navegación', items: navPages.map((p) => p.id) }],
    modes: [],
    user: scanUser(root, pages),
    detected: scanColors(root)
  }
}

// Combina scan + overrides. overrides admite: brand, nav, modes, user, pages: { <id>: { label, icon, kind, hidden, shell } }.
// shell: false = la página se pinta SIN la plantilla (login, onboarding…). Por defecto, las de tipo auth.
export function effectiveProject(snapshot) {
  if (!snapshot?.scan) return null
  const { scan, overrides = {} } = snapshot
  const pages = scan.pages.map((p) => ({ ...p, shell: p.kind !== 'auth', ...(overrides.pages?.[p.id] || {}) })).filter((p) => !p.hidden)
  const byId = Object.fromEntries(pages.map((p) => [p.id, p]))
  const nav = (overrides.nav || scan.nav).map((section) => ({ ...section, items: section.items.map((id) => byId[id]).filter(Boolean) }))
  return {
    name: snapshot.name,
    tech: scan.tech,
    brand: { ...scan.brand, ...(overrides.brand || {}) },
    pages,
    nav,
    modes: overrides.modes || scan.modes,
    user: { ...scan.user, ...(overrides.user || {}) },
    detected: scan.detected
  }
}

// Escanea y guarda .nt/project.json conservando los overrides existentes.
export function connectProject(root, file) {
  const previous = readJson(file, {})
  const snapshot = {
    version: PROJECT_SCHEMA_VERSION,
    name: path.basename(root),
    connectedAt: previous.connectedAt || new Date().toISOString(),
    scannedAt: new Date().toISOString(),
    scan: scanProject(root),
    overrides: previous.overrides || {}
  }
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(snapshot, null, 2) + '\n')
  return snapshot
}
