#!/usr/bin/env node
// nt — CLI de framework-nt-css. Sin dependencias (solo Node >= 20).
// Pensado para humanos Y agentes: todo comando de listado acepta --json, y `init` falla con
// la lista de opciones si falta --template/--theme y no hay terminal interactiva (el agente debe preguntar al usuario).
import fs from 'node:fs'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import os from 'node:os'
import { FRAMEWORK_ROOT, STARTER_DIR, TEMPLATES_DIR, THEMES_DIR, findTemplate, findTheme, listTemplates, listThemes, loadProjectConfig, projectPaths, readJson, registryInSync, writeJson, writeTemplateRegistry } from '../src/node/catalog.js'
import { connectProject, effectiveProject, scanProject } from '../src/node/scan.js'
import { applyProject } from '../src/node/apply.js'
import { validateTheme } from '../src/theme/tokens.js'
import { SLOT_KEYS, validateTemplateManifest } from '../src/contract.js'

const HELP = `nt — framework-nt-css

Uso: node scripts/nt.mjs <comando> [opciones]

  templates [--json]                    Lista las plantillas (formatos) disponibles.
  themes [--json]                       Lista los temas de color.
  init <dir> --template <id> --theme <id> [--name "Mi app"] [--install] [--force]
                                        Crea un proyecto nuevo a partir del starter.
  theme [--project <dir>] [--port 5180] [--no-open]
                                        Abre el Theme Studio: vista previa en vivo, editar cada color y guardar.
  connect <dir> [--print] [--template <id>] [--theme <id>]
                                        Conecta un proyecto existente (cualquier tecnología): lo escanea y crea .nt/.
  preview <dir> [--port 5180] [--no-open]
                                        Abre el Studio con la estructura de ESE proyecto para elegir plantilla y colores.
  apply <dir> [--dry-run] [--adapter next|react-vite|kit] [--quiet]
                                        Genera en .nt/ la integración para su tecnología + .nt/INTEGRATION.md con los pasos.
  migrate <dir> --template <id> [--theme <id>] [--dry-run]
                                        Cambia la plantilla (y/o tema) de un proyecto. No toca su código.
  doctor [dir] [--json] [--fix]         Valida el framework (sin dir) o un proyecto.
  registry                              Regenera src/templates.registry.js (tras añadir una plantilla a mano).
  sync <dir>                            Alinea las versiones de dependencias del proyecto con el framework.
  new-template <id> [--from sidebar] [--name "…"]
                                        Crea una plantilla nueva copiando otra.
  new-theme <id> [--from esmaix] [--name "…"]
                                        Crea un tema nuevo copiando otro.
  install-skill [--target claude|agents|all]
                                        Enlaza este skill en ~/.claude/skills y/o ~/.agents/skills.
`

// ---------- utilidades ----------
function parseArgs(argv) {
  const args = { _: [] }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg.startsWith('--')) {
      const [key, inline] = arg.slice(2).split('=')
      if (inline !== undefined) args[key] = inline
      else if (argv[i + 1] && !argv[i + 1].startsWith('--')) { args[key] = argv[i + 1]; i += 1 } else args[key] = true
    } else args._.push(arg)
  }
  return args
}
const c = { bold: (t) => `\x1b[1m${t}\x1b[0m`, dim: (t) => `\x1b[2m${t}\x1b[0m`, green: (t) => `\x1b[32m${t}\x1b[0m`, yellow: (t) => `\x1b[33m${t}\x1b[0m`, red: (t) => `\x1b[31m${t}\x1b[0m`, accent: (t) => `\x1b[38;5;208m${t}\x1b[0m` }
const fail = (message, code = 1) => { console.error(c.red(`✖ ${message}`)); process.exit(code) }
const ok = (message) => console.log(c.green(`✔ ${message}`))
const warn = (message) => console.log(c.yellow(`! ${message}`))
const toPosix = (p) => p.split(path.sep).join('/')
const slug = (text) => String(text).toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const interactive = () => process.stdin.isTTY && process.stdout.isTTY && !process.env.CI

async function choose(question, options) {
  console.log(`\n${c.bold(question)}`)
  options.forEach((option, index) => console.log(`  ${c.accent(index + 1)}. ${c.bold(option.name)} ${c.dim(`(${option.id})`)}\n     ${c.dim(option.description || '')}`))
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    for (;;) {
      const answer = (await rl.question(`Elige 1-${options.length}: `)).trim()
      const picked = options[Number(answer) - 1] || options.find((option) => option.id === answer)
      if (picked) return picked.id
    }
  } finally { rl.close() }
}

function printTemplates(list) {
  list.forEach((t) => {
    console.log(`${c.accent('■')} ${c.bold(t.name)} ${c.dim(`— id: ${t.id} · v${t.version}`)}`)
    console.log(`  ${t.description}`)
    if (t.bestFor?.length) console.log(`  ${c.dim('Ideal para:')} ${t.bestFor.join(', ')}`)
  })
}
function printThemes(list) {
  list.forEach((t) => {
    const swatch = ['canvas', 'paper', 'ink', 'accent'].map((key) => t.colors?.[key]).filter(Boolean).join(' ')
    console.log(`${c.accent('●')} ${c.bold(t.name)} ${c.dim(`— id: ${t.id} · ${t.scheme}`)}  ${c.dim(swatch)}`)
    if (t.description) console.log(`  ${t.description}`)
  })
}

function copyDir(from, to, replace) {
  fs.mkdirSync(to, { recursive: true })
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name)
    const target = path.join(to, entry.name === '_gitignore' ? '.gitignore' : entry.name)
    if (entry.isDirectory()) copyDir(source, target, replace)
    else if (/\.(jsx?|json|html|md|css|mjs|txt)$|_gitignore$/.test(entry.name)) fs.writeFileSync(target, replace(fs.readFileSync(source, 'utf8')))
    else fs.copyFileSync(source, target)
  }
}

// Dependencias que un proyecto necesita en su propio node_modules (React se deduplica desde ahí).
function projectDependencies() {
  const pkg = readJson(path.join(FRAMEWORK_ROOT, 'package.json'))
  const all = { ...pkg.dependencies, ...pkg.devDependencies }
  const pick = (names) => Object.fromEntries(names.map((name) => [name, all[name]]))
  return {
    dependencies: pick(['react', 'react-dom', 'gsap', '@gsap/react', 'lucide-react', 'clsx', 'tailwind-merge']),
    devDependencies: pick(['vite'])
  }
}

// ---------- comandos ----------
const commands = {
  help() { console.log(HELP) },

  templates(args) {
    const list = listTemplates().map(({ dir, hasShell, folder, ...rest }) => rest)
    if (args.json) return console.log(JSON.stringify(list, null, 2))
    return printTemplates(list)
  },

  themes(args) {
    const list = listThemes()
    if (args.json) return console.log(JSON.stringify(list, null, 2))
    return printThemes(list)
  },

  async init(args) {
    const dir = args._[1]
    if (!dir) fail('Falta el directorio: nt init <dir> --template <id> --theme <id>')
    const target = path.resolve(dir)
    if (fs.existsSync(target) && fs.readdirSync(target).length && !args.force) fail(`${target} no está vacío (usa --force para escribir encima).`)

    const templates = listTemplates()
    const themes = listThemes()
    let template = args.template
    let theme = args.theme
    if (!template || !theme) {
      if (!interactive()) {
        console.error(c.red('✖ Faltan opciones. Pregunta al usuario qué plantilla y qué tema quiere y vuelve a ejecutar con --template y --theme.'))
        console.error(JSON.stringify({ missing: [!template && 'template', !theme && 'theme'].filter(Boolean), templates: templates.map(({ id, name, description }) => ({ id, name, description })), themes: themes.map(({ id, name, description }) => ({ id, name, description })) }, null, 2))
        process.exit(2)
      }
      if (!template) template = await choose('¿Qué plantilla (formato) quieres?', templates)
      if (!theme) theme = await choose('¿Qué tema de colores?', [...themes, { id: '__studio', name: 'Crear uno nuevo en el Theme Studio', description: 'Se abre la vista previa para elegir cada color.' }])
    }
    if (!findTemplate(template)) fail(`Plantilla desconocida "${template}". Disponibles: ${templates.map((t) => t.id).join(', ')}`)
    const openStudio = theme === '__studio'
    if (openStudio) theme = 'esmaix'
    if (!findTheme(theme)) fail(`Tema desconocido "${theme}". Disponibles: ${themes.map((t) => t.id).join(', ')}`)

    const name = args.name || path.basename(target)
    const frameworkPath = toPosix(path.relative(target, FRAMEWORK_ROOT)) || '.'
    const replace = (text) => text.replaceAll('__NAME__', slug(name) || 'app').replaceAll('__TITLE__', name).replaceAll('__BRAND__', name.toLowerCase()).replaceAll('__FRAMEWORK__', frameworkPath)
    copyDir(STARTER_DIR, target, replace)

    const pkgFile = path.join(target, 'package.json')
    const pkg = readJson(pkgFile)
    const deps = projectDependencies()
    pkg.dependencies = { ...pkg.dependencies, ...deps.dependencies }
    pkg.devDependencies = { ...pkg.devDependencies, ...deps.devDependencies }
    writeJson(pkgFile, pkg)
    fs.mkdirSync(path.join(target, '.nt'), { recursive: true })
    writeJson(projectPaths(target).config, { $schema: `../${frameworkPath}/references/nt-config.schema.json`, template, theme, app: { name }, templateOptions: {} })

    ok(`Proyecto creado en ${target}`)
    console.log(`  plantilla: ${c.bold(template)} · tema: ${c.bold(theme)} · framework: ${c.dim(frameworkPath)}`)
    if (args.install) {
      const result = spawnSync('npm', ['install'], { cwd: target, stdio: 'inherit', shell: process.platform === 'win32' })
      if (result.status !== 0) fail('npm install ha fallado.')
    }
    console.log(`\nSiguiente:\n  cd ${dir}\n  ${args.install ? '' : 'npm install\n  '}npm run dev\n  npm run theme   ${c.dim('# editor de colores en vivo')}`)
    if (openStudio) { console.log(''); return commands.theme({ _: [], project: target }) }
    return undefined
  },

  // Conecta un proyecto de cualquier tecnología: lee su estructura y la guarda en .nt/project.json.
  connect(args) {
    const dir = path.resolve(args._[1] || '.')
    if (!fs.existsSync(dir)) fail(`No existe ${dir}`)
    const paths = projectPaths(dir)
    if (args.print) return console.log(JSON.stringify(scanProject(dir), null, 2))
    const snapshot = connectProject(dir, paths.project)
    if (!fs.existsSync(paths.config)) writeJson(paths.config, { template: args.template || 'sidebar', theme: args.theme || 'esmaix', app: { name: snapshot.scan.brand.name }, templateOptions: {} })
    if (args.json) return console.log(JSON.stringify(effectiveProject(snapshot), null, 2))
    if (args.quiet) return undefined
    const project = effectiveProject(snapshot)
    const { config } = loadProjectConfig(dir)
    ok(`Conectado: ${dir}`)
    console.log(`  tecnología: ${c.bold(project.tech.label)} ${c.dim(`→ adaptador "${project.tech.adapter}"`)}${project.tech.language === 'ts' ? c.dim(' · TypeScript') : ''}${project.tech.tailwind ? c.dim(` · Tailwind ${project.tech.tailwind.version}`) : ''}`)
    console.log(`  marca: ${c.bold(project.brand.name)} · usuario: ${project.user.enabled ? `sí (${project.user.provider || 'login propio'})` : 'no'}`)
    console.log(`  páginas (${project.pages.length}):`)
    project.pages.forEach((p) => console.log(`   ${p.route.padEnd(28)} ${c.dim(`${p.kind.padEnd(8)} ${p.label}${p.file ? ` · ${p.file}` : ''}`)}`))
    if (project.detected.palette.length) console.log(`  colores actuales: ${c.dim(project.detected.palette.slice(0, 8).map((p) => p.value).join(' '))}`)
    console.log(`  plantilla: ${c.bold(config.template)} · tema: ${c.bold(config.theme)}`)
    console.log(`\n  ${c.dim('Guardado en')} .nt/project.json ${c.dim('(edita "overrides" para corregir etiquetas, iconos, navegación o entornos)')}`)
    console.log(`  Siguiente: ${c.bold(`nt preview ${args._[1] || '.'}`)} → elegir plantilla y colores viendo TU proyecto · luego ${c.bold(`nt apply ${args._[1] || '.'}`)}`)
    return undefined
  },

  // Vista previa del proyecto conectado en el Studio (tecnología propia del framework).
  preview(args) {
    const dir = path.resolve(args._[1] || '.')
    if (!fs.existsSync(projectPaths(dir).project)) commands.connect({ _: ['connect', dir], quiet: true })
    return commands.theme({ ...args, project: dir })
  },

  // Aplica plantilla + tema al proyecto con el adaptador de su tecnología.
  async apply(args) {
    const dir = path.resolve(args._[1] || '.')
    return applyProject(dir, { dryRun: Boolean(args['dry-run']), adapter: args.adapter, quiet: Boolean(args.quiet), log: { ok, warn, info: (m) => console.log(m), c } })
  },

  theme(args) {
    const port = String(args.port || 5180)
    const project = args.project ? path.resolve(String(args.project)) : null
    if (project && !fs.existsSync(projectPaths(project).project) && !fs.existsSync(projectPaths(project).config)) {
      // Proyecto aún no conectado: se conecta ahora para que la vista previa use su estructura.
      commands.connect({ _: ['connect', project], quiet: true })
    }
    const vite = path.join(FRAMEWORK_ROOT, 'node_modules', 'vite', 'bin', 'vite.js')
    if (!fs.existsSync(vite)) fail(`Faltan las dependencias del framework. Ejecuta: cd "${FRAMEWORK_ROOT}" && npm install`)
    const viteArgs = [vite, '--config', 'studio/vite.config.js', '--port', port]
    if (!args['no-open']) viteArgs.push('--open')
    console.log(`${c.accent('◆')} Theme Studio en ${c.bold(`http://localhost:${port}`)}${project ? ` · proyecto: ${c.bold(path.basename(project))}` : ''}`)
    console.log(c.dim('  Cambia cada color en el panel, mira el resultado en vivo y pulsa "Guardar tema". Ctrl+C para cerrar.'))
    const child = spawn(process.execPath, viteArgs, { cwd: FRAMEWORK_ROOT, stdio: 'inherit', env: { ...process.env, NT_PROJECT: project || '', NT_PORT: port } })
    child.on('exit', (code) => process.exit(code ?? 0))
  },

  migrate(args) {
    const dir = path.resolve(args._[1] || '.')
    const { file, exists, config } = loadProjectConfig(dir)
    if (!exists) fail(`${dir} no tiene .nt/nt.config.json. Conéctalo primero: nt connect ${args._[1] || '.'}`)
    if (!args.template && !args.theme) fail('Indica --template <id> y/o --theme <id>.')
    const from = findTemplate(config.template)
    const to = args.template ? findTemplate(args.template) : from
    if (!to) fail(`Plantilla desconocida "${args.template}". Disponibles: ${listTemplates().map((t) => t.id).join(', ')}`)
    if (args.theme && !findTheme(args.theme)) fail(`Tema desconocido "${args.theme}". Disponibles: ${listThemes().map((t) => t.id).join(', ')}`)
    const problems = validateTemplateManifest(to, { hasShell: to.hasShell })
    if (problems.length) fail(`La plantilla "${to.id}" no cumple el contrato:\n  - ${problems.join('\n  - ')}`)

    console.log(`${c.bold('Migración')} ${c.dim(dir)}`)
    if (args.template) {
      console.log(`  plantilla: ${from?.id || config.template} → ${c.accent(to.id)}`)
      console.log(c.dim('  Dónde va cada slot (el código del proyecto no cambia):'))
      SLOT_KEYS.forEach((slot) => console.log(`   ${slot.padEnd(8)} ${c.dim(from?.slots?.[slot] || '—')}\n   ${''.padEnd(8)} → ${to.slots[slot]}`))
      const fromOptions = Object.keys(config.templateOptions?.[from?.id] || {})
      const unknown = fromOptions.filter((key) => !to.options?.[key])
      if (unknown.length) warn(`Opciones de "${from.id}" que "${to.id}" no usa: ${unknown.join(', ')} (se conservan, no molestan).`)
    }
    if (args.theme) console.log(`  tema: ${config.theme} → ${c.accent(args.theme)}`)
    if (args['dry-run']) return console.log(c.dim('\n(dry-run: no se ha escrito nada)'))
    const raw = readJson(file, {})
    writeJson(file, { ...raw, ...(args.template ? { template: to.id } : {}), ...(args.theme ? { theme: args.theme } : {}) })
    ok('nt.config.json actualizado. Si el servidor de desarrollo está abierto, se recarga solo.')
    return undefined
  },

  doctor(args) {
    const report = { errors: [], warnings: [] }
    const dirArg = args._[1]
    if (!dirArg) {
      // Framework: plantillas y temas válidos.
      for (const template of listTemplates()) {
        validateTemplateManifest(template, { hasShell: template.hasShell }).forEach((p) => report.errors.push(`templates/${template.folder}: ${p}`))
        if (template.folder !== template.id) report.errors.push(`templates/${template.folder}: la carpeta debe llamarse igual que el id ("${template.id}").`)
      }
      for (const theme of listThemes()) {
        validateTheme(theme).forEach((p) => report.errors.push(`${theme.file}: ${p}`))
        if (path.basename(theme.file, '.json') !== theme.id) report.errors.push(`${theme.file}: el archivo debe llamarse <id>.json`)
      }
      if (!registryInSync()) {
        if (args.fix) { writeTemplateRegistry(); report.warnings.push('src/templates.registry.js estaba desactualizado: regenerado.') } else report.errors.push('src/templates.registry.js no coincide con templates/ (ejecuta: nt registry, o nt doctor --fix).')
      }
      if (!fs.existsSync(path.join(FRAMEWORK_ROOT, 'node_modules'))) report.warnings.push('Faltan node_modules del framework: ejecuta npm install.')
    } else {
      const dir = path.resolve(dirArg)
      const { exists, config } = loadProjectConfig(dir)
      if (!exists) report.errors.push('No hay nt.config.json.')
      if (!findTemplate(config.template)) report.errors.push(`Plantilla "${config.template}" no existe en el framework.`)
      if (!findTheme(config.theme)) report.errors.push(`Tema "${config.theme}" no existe en el framework.`)
      const pkg = readJson(path.join(dir, 'package.json'))
      if (pkg && !dir.startsWith(FRAMEWORK_ROOT + path.sep + 'studio')) {
        if (!pkg.dependencies?.['framework-nt-css']) report.errors.push('package.json no depende de framework-nt-css.')
        const wanted = projectDependencies()
        for (const [name, version] of Object.entries({ ...wanted.dependencies, ...wanted.devDependencies })) {
          const have = pkg.dependencies?.[name] || pkg.devDependencies?.[name]
          if (!have) report.warnings.push(`Falta la dependencia ${name}@${version} (nt sync ${dirArg}).`)
          else if (have !== version) report.warnings.push(`${name}: el proyecto usa ${have} y el framework ${version} (nt sync ${dirArg}).`)
        }
      }
      // Reglas de estilo: el estilo vive en el framework.
      const src = path.join(dir, 'src')
      const walk = (folder) => (fs.existsSync(folder) ? fs.readdirSync(folder, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? walk(path.join(folder, entry.name)) : [path.join(folder, entry.name)])) : [])
      for (const file of walk(src)) {
        const rel = toPosix(path.relative(dir, file))
        if (file.endsWith('.css')) report.warnings.push(`${rel}: CSS propio en el proyecto. El estilo debería vivir en el framework.`)
        if (/\.(jsx?|tsx?)$/.test(file)) {
          const text = fs.readFileSync(file, 'utf8')
          if (/(?:bg|text|border|ring|from|to|via)-\[#[0-9a-f]{3,8}\]/i.test(text)) report.warnings.push(`${rel}: colores hex en clases de Tailwind. Usa tokens (bg-paper, text-accent…).`)
        }
      }
      if (fs.existsSync(path.join(dir, 'tailwind.config.js'))) report.warnings.push('tailwind.config.js en el proyecto: Tailwind lo configura el framework.')
    }
    if (args.json) return console.log(JSON.stringify(report, null, 2))
    report.errors.forEach((e) => console.log(c.red(`✖ ${e}`)))
    report.warnings.forEach((w) => warn(w))
    if (!report.errors.length && !report.warnings.length) ok('Todo correcto.')
    if (report.errors.length) process.exit(1)
    return undefined
  },

  registry() {
    writeTemplateRegistry()
    ok('src/templates.registry.js regenerado.')
  },

  sync(args) {
    const dir = path.resolve(args._[1] || '.')
    const file = path.join(dir, 'package.json')
    const pkg = readJson(file)
    if (!pkg) fail(`No hay package.json en ${dir}`)
    const deps = projectDependencies()
    pkg.dependencies = { ...pkg.dependencies, ...deps.dependencies }
    pkg.devDependencies = { ...pkg.devDependencies, ...deps.devDependencies }
    writeJson(file, pkg)
    ok('Versiones alineadas con el framework. Ejecuta npm install en el proyecto.')
  },

  'new-template'(args) {
    const id = slug(args._[1] || '')
    if (!id) fail('Uso: nt new-template <id> [--from sidebar] [--name "…"]')
    const from = findTemplate(args.from || 'sidebar')
    if (!from) fail(`No existe la plantilla base "${args.from}".`)
    const target = path.join(TEMPLATES_DIR, id)
    if (fs.existsSync(target)) fail(`Ya existe templates/${id}.`)
    copyDir(from.dir, target, (text) => text.replaceAll(`data-nt-template="${from.id}"`, `data-nt-template="${id}"`))
    const manifestFile = path.join(target, 'template.json')
    const manifest = readJson(manifestFile)
    writeJson(manifestFile, { ...manifest, id, name: args.name || id, version: '0.1.0', description: `TODO: describe la plantilla (basada en ${from.id}).` })
    writeTemplateRegistry()
    ok(`Plantilla creada en templates/${id}/ (copia de ${from.id}).`)
    console.log(`  1. Edita templates/${id}/Shell.jsx (layout + animaciones de entrada).\n  2. Actualiza "description" y "slots" en template.json.\n  3. Pruébala en el studio (selector Plantilla) o con ?nt-template=${id} en cualquier proyecto.\n  4. nt doctor`)
  },

  'new-theme'(args) {
    const id = slug(args._[1] || '')
    if (!id) fail('Uso: nt new-theme <id> [--from esmaix] [--name "…"]')
    const from = findTheme(args.from || 'esmaix')
    if (!from) fail(`No existe el tema base "${args.from}".`)
    const file = path.join(THEMES_DIR, `${id}.json`)
    if (fs.existsSync(file)) fail(`Ya existe themes/${id}.json.`)
    const { file: _ignored, ...rest } = from
    writeJson(file, { ...rest, id, name: args.name || id, description: `Basado en ${from.id}.` })
    ok(`Tema creado en themes/${id}.json. Edítalo en vivo con: nt theme`)
  },

  'install-skill'(args) {
    const target = args.target || 'all'
    const homes = { claude: path.join(os.homedir(), '.claude', 'skills'), agents: path.join(os.homedir(), '.agents', 'skills') }
    const chosen = target === 'all' ? Object.keys(homes) : [target]
    for (const key of chosen) {
      if (!homes[key]) fail(`Destino desconocido "${key}" (claude | agents | all).`)
      const link = path.join(homes[key], 'framework-nt-css')
      fs.mkdirSync(homes[key], { recursive: true })
      if (fs.existsSync(link)) { warn(`${link} ya existe, no se toca.`); continue }
      fs.symlinkSync(FRAMEWORK_ROOT, link, 'junction')
      ok(`Skill enlazado: ${link} → ${FRAMEWORK_ROOT}`)
    }
  }
}

const args = parseArgs(process.argv.slice(2))
const name = args._[0] || 'help'
if (args.help || args.h) commands.help()
else if (!commands[name]) { console.error(c.red(`Comando desconocido: ${name}`)); commands.help(); process.exit(1) } else await commands[name](args)
