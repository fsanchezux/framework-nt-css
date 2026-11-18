// nt apply: lleva la plantilla + el tema elegidos al proyecto con el ADAPTADOR de su tecnología.
//
// Regla de oro: apply solo escribe dentro de .nt/ (código generado, se regenera siempre). Los cambios en el código
// del propio proyecto (dependencia, config del bundler, layout) se describen en .nt/INTEGRATION.md como una lista
// de pasos con su estado (hecho / pendiente): los hace el agente o la persona, una vez y con su visto bueno.
//
// Adaptadores:
// - next        → componentes React del framework dentro del layout (NtShell generado + CSS compilado).
// - react-vite  → plugin de Vite del framework + NtShell generado (Tailwind del framework escanea el proyecto).
// - kit         → cualquier otra tecnología: CSS compilado + HTML de la plantilla + JS de animaciones (ver kit.js).
import fs from 'node:fs'
import path from 'node:path'
import { FRAMEWORK_ROOT, loadProjectConfig, projectPaths, readJson } from './catalog.js'
import { buildFrameworkCss } from './css.js'
import { connectProject, effectiveProject } from './scan.js'
import { exportKit } from './kit.js'

export const ADAPTERS = ['next', 'react-vite', 'kit']

const json = (value) => JSON.stringify(value, null, 2)
const posix = (p) => p.split(path.sep).join('/')
const relImport = (fromDir, file) => { const r = posix(path.relative(fromDir, file)); return r.startsWith('.') ? r : `./${r}` }
const read = (file) => { try { return fs.readFileSync(file, 'utf8') } catch { return '' } }
const commonAncestor = (a, b) => {
  const pa = path.resolve(a).split(path.sep)
  const pb = path.resolve(b).split(path.sep)
  let i = 0
  while (i < pa.length && i < pb.length && pa[i].toLowerCase() === pb[i].toLowerCase()) i++
  return pa.slice(0, i).join(path.sep) || path.sep
}
const firstFile = (root, list) => list.map((f) => path.join(root, f)).find((f) => fs.existsSync(f))

const HEADER = (adapter) => `// GENERADO por framework-nt-css (nt apply · adaptador ${adapter}). No lo edites a mano:
// cambia .nt/project.json ("overrides") o .nt/nt.config.json y vuelve a ejecutar \`nt apply\`.`

// Datos de navegación que comparten todos los adaptadores (ids, rutas, iconos, páginas sin plantilla).
export function navModel(project) {
  const pages = project.pages.map(({ id, route, label, shell, icon }) => ({ id, route, label, shell: shell !== false, icon }))
  const nav = project.nav.map((section) => ({ id: section.id, label: section.label, items: section.items.map((p) => ({ id: p.id, label: p.label, icon: p.icon || 'Circle', meta: p.route })) }))
  const icons = [...new Set(nav.flatMap((s) => s.items.map((i) => i.icon)))].sort()
  return { pages, nav, icons, brand: { name: project.brand.name, highlight: project.brand.highlight } }
}

// Código JS común: tabla de páginas y búsqueda de la página activa por ruta (con segmentos dinámicos [id], :id, {id}).
const routingSource = (pages) => `const PAGES = ${json(pages)}

// Ruta → expresión regular ([id] / :id / {id} = un segmento, [...x] = varios).
const toRegex = (route) => new RegExp('^' + route.replace(/\\[\\.\\.\\.[^\\]]+\\]/g, '.+').replace(/\\[[^\\]]+\\]|:[^/]+|\\{[^}]+\\}/g, '[^/]+').replace(/\\/$/, '') + '/?$')
// Página activa: coincidencia exacta o, si no, la ruta padre más larga (así /lists/42 marca "Lists").
export function matchPage(pathname) {
  const exact = PAGES.find((p) => toRegex(p.route).test(pathname))
  if (exact) return exact
  return PAGES.filter((p) => p.route !== '/' && pathname.startsWith(p.route.replace(/\\/$/, '') + '/')).sort((a, b) => b.route.length - a.route.length)[0]
}
export const routeOf = (id) => PAGES.find((p) => p.id === id)?.route`

const navSource = (nav) => `const NAV = [
${nav.map((s) => `  { id: ${JSON.stringify(s.id)}, label: ${JSON.stringify(s.label)}, items: [
${s.items.map((i) => `    { id: ${JSON.stringify(i.id)}, label: ${JSON.stringify(i.label)}, icon: ${i.icon}, meta: ${JSON.stringify(i.meta)} }`).join(',\n')}
  ] }`).join(',\n')}
]`

// ---------------------------------------------------------------- next
function nextFiles({ project, config, model, ts }) {
  const ext = ts ? 'tsx' : 'jsx'
  const nocheck = ts ? '// @ts-nocheck — el framework es JavaScript; este archivo solo hace de puente.\n' : ''
  // @ts-nocheck va ANTES de 'use client': TypeScript solo lo respeta si precede a cualquier sentencia.
  const shell = `${nocheck}'use client'
${HEADER('next')}
import { usePathname, useRouter } from 'next/navigation'
import { NtApp, Preloader } from 'framework-nt-css'
import { ${model.icons.join(', ')} } from 'framework-nt-css/icons'

// nt.config.json (plantilla, opciones) — Next no tiene el plugin de Vite, así que la config llega como prop.
const CONFIG = ${json({ ...config, dev: false })}
const BRAND = ${json(model.brand)}
${navSource(model.nav)}
${routingSource(model.pages)}

// Envuelve TODAS las páginas (se usa en app/layout). Props opcionales desde el layout:
// user (slot de usuario: { name, meta, avatar, menu }), actions (botones arriba a la derecha), ready (precarga).
export default function NtShell({ children, user = undefined, actions = undefined, ready = true }) {
  const pathname = usePathname() || '/'
  const router = useRouter()
  const page = matchPage(pathname)
  // Páginas sin plantilla (login…): solo la precarga y el contenido.
  if (page && !page.shell) return <><Preloader ready={ready}/>{children}</>
  return <NtApp config={CONFIG} ready={ready}
    brand={{ ...BRAND, onClick: () => router.push('/') }}
    nav={NAV} activeId={page?.id} onNavigate={(id) => { const route = routeOf(id); if (route) router.push(route) }}
    user={user} actions={actions}>
    {children}
  </NtApp>
}
`
  // Pantalla de arranque: debe venir en el HTML del servidor para que se vea antes de hidratar (sin 'use client').
  const boot = `${HEADER('next')}
// Pantalla de arranque (#nt-boot) + clase nt-js. Va la PRIMERA dentro de <body>; <Preloader> la retira con GSAP.
export default function NtBoot() {
  return <>
    <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('nt-js')" }}/>
    <div id="nt-boot" aria-hidden="true"><div className="nt-boot-mark"><span className="nt-boot-name">${model.brand.name.replace(/[<>{}]/g, '')}</span><span className="nt-boot-bar"><i/></span></div></div>
  </>
}
`
  return [
    { rel: `next/NtShell.${ext}`, content: shell },
    { rel: `next/NtBoot.${ext}`, content: boot }
  ]
}

function nextSteps(dir, { frameworkDep, ntDir, theme }) {
  const pkg = readJson(path.join(dir, 'package.json'), {})
  const layout = firstFile(dir, ['app/layout.tsx', 'app/layout.jsx', 'app/layout.js', 'src/app/layout.tsx', 'src/app/layout.jsx', 'src/app/layout.js'])
  const nextConfig = firstFile(dir, ['next.config.ts', 'next.config.mjs', 'next.config.js', 'next.config.cjs'])
  const layoutSrc = read(layout)
  const configSrc = read(nextConfig)
  const layoutDir = layout ? path.dirname(layout) : path.join(dir, 'app')
  const imp = (file) => relImport(layoutDir, path.join(ntDir, file))
  const ext = layout?.endsWith('.tsx') ? 'tsx' : 'jsx'
  // Carpeta común al proyecto y al framework (Turbopack no lee nada fuera de su raíz).
  const up = JSON.stringify(posix(path.relative(dir, commonAncestor(dir, FRAMEWORK_ROOT))) || '.')
  return [
    {
      title: 'Dependencia del framework y regeneración automática',
      done: Boolean(pkg.dependencies?.['framework-nt-css']) && /nt apply/.test(pkg.scripts?.predev || ''),
      file: 'package.json',
      body: `En "dependencies":\n\n\`\`\`json\n"framework-nt-css": "${frameworkDep}"\n\`\`\`\n\nEn "scripts" (regenera .nt/ al arrancar, así el proyecto sigue siempre al framework):\n\n\`\`\`json\n"predev": "nt apply --quiet",\n"prebuild": "nt apply --quiet"\n\`\`\`\n\nLuego \`npm install\`.`
    },
    {
      title: 'Next.js: compilar el framework (está fuera de la carpeta del proyecto)',
      done: /framework-nt-css/.test(configSrc) && /turbopack/.test(configSrc),
      file: nextConfig ? posix(path.relative(dir, nextConfig)) : 'next.config.ts',
      body: `Dentro del objeto de config (y \`import path from "node:path"\` arriba):\n\n\`\`\`ts\ntranspilePackages: ["framework-nt-css"],\n// El framework se enlaza con file: desde otra carpeta: Turbopack necesita ver la carpeta común a los dos.\nturbopack: { root: path.resolve(process.cwd(), ${up}) },\noutputFileTracingRoot: path.resolve(process.cwd(), ${up}),\n\`\`\``
    },
    {
      title: 'Layout raíz: CSS, pantalla de arranque y plantilla',
      done: /\.nt\/nt\.css/.test(layoutSrc) && /NtShell/.test(layoutSrc),
      file: layout ? posix(path.relative(dir, layout)) : 'app/layout.tsx',
      body: `Imports (el CSS del framework DESPUÉS del CSS global del proyecto):\n\n\`\`\`${ext}\nimport '${imp('nt.css')}'\nimport NtBoot from '${imp('next/NtBoot')}'\nimport NtShell from '${imp('next/NtShell')}'\n\`\`\`\n\nY en \`<body>\`: \`<NtBoot/>\` como primer hijo y el contenido envuelto:\n\n\`\`\`${ext}\n<body>\n  <NtBoot/>\n  <NtShell>{children}</NtShell>\n</body>\n\`\`\`\n\nOpcional: \`<NtShell user={{ name, meta, menu }} actions={…}>\` con la sesión real (p. ej. de Supabase en el servidor).\nColor del navegador: \`export const viewport = { themeColor: '${theme.colors.canvas}', colorScheme: '${theme.scheme}' }\`.`
    },
    {
      title: 'Páginas: quitar el chrome propio que ahora pone la plantilla',
      done: false,
      manual: true,
      body: 'La plantilla ya pinta marca, navegación, usuario y fondo. En cada página, quita cabeceras/sidebars/navbars propios y usa los componentes del framework (`Page`, `PageTitle`, `Section`, `Card`, `Button`…: `import { Page } from "framework-nt-css"`). Hazlo página a página, comprobando cada una.'
    }
  ]
}

// ---------------------------------------------------------------- react-vite
function reactViteFiles({ model }) {
  const shell = `${HEADER('react-vite')}
import { NtApp } from 'framework-nt-css'
import { ${model.icons.join(', ')} } from 'framework-nt-css/icons'

const BRAND = ${json(model.brand)}
${navSource(model.nav)}
${routingSource(model.pages)}

// Envuelve la app. Si el proyecto tiene router propio, pásale activeId/onNavigate; si no, navega por URL.
// La config (plantilla y tema) la inyecta el plugin de Vite del framework en index.html.
export default function NtShell({ children, activeId, onNavigate, user, actions, ready = true }) {
  const page = matchPage(window.location.pathname)
  const navigate = onNavigate || ((id) => { const route = routeOf(id); if (route) window.location.assign(route) })
  if (page && !page.shell) return children
  return <NtApp ready={ready} brand={BRAND} nav={NAV} activeId={activeId ?? page?.id} onNavigate={navigate} user={user} actions={actions}>
    {children}
  </NtApp>
}
`
  return [{ rel: 'react/NtShell.jsx', content: shell }]
}

function reactViteSteps(dir, { frameworkDep, ntDir }) {
  const pkg = readJson(path.join(dir, 'package.json'), {})
  const viteConfig = firstFile(dir, ['vite.config.js', 'vite.config.mjs', 'vite.config.ts'])
  const main = firstFile(dir, ['src/main.jsx', 'src/main.tsx', 'src/main.js', 'src/index.jsx', 'src/index.tsx'])
  const mainSrc = read(main)
  const mainDir = main ? path.dirname(main) : path.join(dir, 'src')
  return [
    { title: 'Dependencia del framework', done: Boolean(pkg.dependencies?.['framework-nt-css']), file: 'package.json', body: `\`"framework-nt-css": "${frameworkDep}"\` en "dependencies" y \`npm install\`.` },
    {
      title: 'Plugin de Vite del framework (incluye React y Tailwind)',
      done: /framework-nt-css\/vite/.test(read(viteConfig)),
      file: viteConfig ? posix(path.relative(dir, viteConfig)) : 'vite.config.js',
      body: '```js\nimport nt from \'framework-nt-css/vite\'\nexport default defineConfig({ plugins: [nt()] })\n```\n\nQuita `react()` y `tailwindcss()` si estaban: `nt()` ya los incluye (duplicarlos rompe el HMR).'
    },
    {
      title: 'Entrada: estilos y plantilla',
      done: /framework-nt-css\/styles\.css/.test(mainSrc) && /NtShell/.test(mainSrc),
      file: main ? posix(path.relative(dir, main)) : 'src/main.jsx',
      body: `\`\`\`jsx\nimport 'framework-nt-css/styles.css'\nimport NtShell from '${relImport(mainDir, path.join(ntDir, 'react/NtShell.jsx'))}'\n// …\n<NtShell><App/></NtShell>\n\`\`\`\n\nSi la app tiene router, pasa \`activeId\` y \`onNavigate\` a NtShell. Quita el CSS global antiguo que pinte fondo, tipografía o layout.`
    },
    { title: 'Páginas: usar componentes del framework', done: false, manual: true, body: 'Quita el layout propio (sidebar, header) y usa `Page`, `PageTitle`, `Card`, `Button`… de `framework-nt-css`.' }
  ]
}

// ---------------------------------------------------------------- INTEGRATION.md
function integrationDoc({ project, adapter, steps, files, config }) {
  const pending = steps.filter((s) => !s.done)
  const lines = [
    `# Integración de framework-nt-css en ${project.name}`,
    '',
    `> Generado por \`nt apply\`. Tecnología: **${project.tech.label}** · adaptador **${adapter}** · plantilla **${config.template}** · tema **${config.theme}**.`,
    '> Este archivo se regenera: los pasos marcados [x] se detectan solos en el código del proyecto.',
    '',
    '## Qué hay en .nt/',
    '',
    ...files.map((f) => `- \`.nt/${f}\``),
    '',
    `## Pasos (${steps.length - pending.length}/${steps.length} hechos)`,
    ''
  ]
  steps.forEach((step, index) => {
    lines.push(`### ${step.done ? '[x]' : '[ ]'} ${index + 1}. ${step.title}${step.file ? ` — \`${step.file}\`` : ''}`, '', step.body, '')
  })
  lines.push('## Cambiar después', '', '- Colores / plantilla: `nt preview` (elige y pulsa «Usar en el proyecto») y luego `nt apply`.', '- Migrar de plantilla: `nt migrate . --template <id>` + `nt apply`. No hay que tocar las páginas.', '- Etiquetas, iconos, orden del menú o páginas sin plantilla: `.nt/project.json` → "overrides" y `nt apply`.', '')
  return lines.join('\n')
}

// ---------------------------------------------------------------- entrada
export async function applyProject(dir, { dryRun = false, adapter: forced, quiet = false, log = console } = {}) {
  const paths = projectPaths(dir)
  // Se reescanea siempre (conserva overrides): páginas nuevas aparecen solas en la navegación.
  const snapshot = dryRun && fs.existsSync(paths.project) ? readJson(paths.project) : connectProject(dir, paths.project)
  const project = effectiveProject(snapshot)
  const { config, theme, exists } = loadProjectConfig(dir)
  if (!exists && !dryRun) {
    fs.writeFileSync(paths.config, JSON.stringify({ template: config.template, theme: config.theme }, null, 2) + '\n')
  }
  const adapter = forced || project.tech.adapter
  if (!ADAPTERS.includes(adapter)) throw new Error(`Adaptador desconocido "${adapter}" (${ADAPTERS.join(' | ')}).`)

  const model = navModel(project)
  const frameworkDep = `file:${posix(path.relative(dir, FRAMEWORK_ROOT))}`
  const ts = project.tech.language === 'ts'
  const outputs = []
  let steps = []

  if (adapter === 'next') {
    outputs.push({ rel: 'nt.css', content: await buildFrameworkCss({ theme }) })
    outputs.push(...nextFiles({ project, config, model, ts }))
    steps = nextSteps(dir, { frameworkDep, ntDir: paths.dir, theme })
  } else if (adapter === 'react-vite') {
    outputs.push(...reactViteFiles({ model }))
    steps = reactViteSteps(dir, { frameworkDep, ntDir: paths.dir })
  } else {
    const kit = await exportKit({ dir, project, config, theme, model })
    outputs.push(...kit.files)
    steps = kit.steps
  }

  const fileList = [...outputs.map((o) => o.rel), 'INTEGRATION.md']
  outputs.push({ rel: 'INTEGRATION.md', content: integrationDoc({ project, adapter, steps, files: fileList, config }) })

  if (!dryRun) {
    // Las carpetas de los adaptadores son 100 % generadas: se vacían para no dejar archivos de una versión anterior.
    for (const generated of ['next', 'react', 'kit']) fs.rmSync(path.join(paths.dir, generated), { recursive: true, force: true })
    for (const out of outputs) {
      const file = path.join(paths.dir, out.rel)
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, out.content)
    }
  }

  const pending = steps.filter((s) => !s.done)
  if (!quiet) {
    log.ok?.(`${dryRun ? 'Simulación' : 'Aplicado'}: ${project.tech.label} → adaptador ${adapter} · plantilla ${config.template} · tema ${config.theme}`)
    for (const rel of fileList) log.info?.(`  .nt/${rel}`)
    if (pending.length) {
      log.info?.('')
      log.warn?.(`Pasos pendientes en el código del proyecto (${pending.length}/${steps.length}), detallados en .nt/INTEGRATION.md:`)
      pending.forEach((s) => log.info?.(`  [ ] ${s.title}${s.file ? `  (${s.file})` : ''}`))
    } else log.ok?.('Integración completa: todos los pasos están hechos.')
  }
  return { adapter, files: fileList, steps, pending }
}
