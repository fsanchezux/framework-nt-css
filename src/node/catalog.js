// Catálogo del framework para Node (CLI y plugin de Vite): rutas, plantillas, temas y config de proyectos.
// Sin dependencias: el CLI arranca rápido y no carga Vite.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveTheme } from '../theme/tokens.js'

export const FRAMEWORK_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const THEMES_DIR = path.join(FRAMEWORK_ROOT, 'themes')
export const TEMPLATES_DIR = path.join(FRAMEWORK_ROOT, 'templates')
export const STARTER_DIR = path.join(FRAMEWORK_ROOT, 'starter')

export const readJson = (file, fallback = null) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) } catch { return fallback }
}
export const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n')

export function listThemes() {
  if (!fs.existsSync(THEMES_DIR)) return []
  return fs.readdirSync(THEMES_DIR).filter((file) => file.endsWith('.json'))
    .map((file) => ({ ...readJson(path.join(THEMES_DIR, file)), file: `themes/${file}` })).filter((theme) => theme.id)
    .sort((a, b) => (a.id === 'esmaix' ? -1 : b.id === 'esmaix' ? 1 : a.id.localeCompare(b.id)))
}

export function listTemplates() {
  if (!fs.existsSync(TEMPLATES_DIR)) return []
  return fs.readdirSync(TEMPLATES_DIR, { withFileTypes: true }).filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = path.join(TEMPLATES_DIR, entry.name)
      const manifest = readJson(path.join(dir, 'template.json'))
      return manifest && { ...manifest, folder: entry.name, dir, hasShell: fs.existsSync(path.join(dir, 'Shell.jsx')) }
    }).filter(Boolean)
    .sort((a, b) => (a.id === 'sidebar' ? -1 : b.id === 'sidebar' ? 1 : a.id.localeCompare(b.id)))
}

// Registro estático de plantillas (src/templates.registry.js). Se genera para que funcione en cualquier
// bundler (Vite, Next/Turbopack, webpack): import.meta.glob solo existe en Vite.
export const REGISTRY_FILE = path.join(FRAMEWORK_ROOT, 'src', 'templates.registry.js')
export function templateRegistrySource() {
  const templates = listTemplates().filter((template) => template.hasShell)
  const name = (id) => id.replace(/(^|-)([a-z0-9])/g, (_, __, char) => char.toUpperCase())
  const lines = ['// GENERADO por `node scripts/nt.mjs registry` (lo ejecutan también new-template y doctor --fix). No editar a mano.']
  templates.forEach((t) => {
    lines.push(`import ${name(t.id)}Manifest from '../templates/${t.folder}/template.json'`)
    lines.push(`import ${name(t.id)}Shell from '../templates/${t.folder}/Shell.jsx'`)
  })
  lines.push('', 'export const REGISTRY = [')
  templates.forEach((t) => lines.push(`  { manifest: ${name(t.id)}Manifest, Shell: ${name(t.id)}Shell },`))
  lines.push(']', '')
  return lines.join('\n')
}
export const registryInSync = () => fs.existsSync(REGISTRY_FILE) && fs.readFileSync(REGISTRY_FILE, 'utf8') === templateRegistrySource()
export const writeTemplateRegistry = () => fs.writeFileSync(REGISTRY_FILE, templateRegistrySource())

export const findTheme = (id) => listThemes().find((theme) => theme.id === id)
export const findTemplate = (id) => listTemplates().find((template) => template.id === id)

// Todo lo del framework dentro de un proyecto vive en <proyecto>/.nt/:
//   .nt/nt.config.json  → elecciones (plantilla, tema, opciones)
//   .nt/project.json    → instantánea de la estructura del proyecto (nt connect)
//   .nt/kit/            → kit exportado para tecnologías sin adaptador directo (nt apply)
export const NT_DIR = '.nt'
export const projectPaths = (root) => {
  const dir = path.join(root, NT_DIR)
  const legacy = path.join(root, 'nt.config.json')
  return {
    dir,
    // Compatibilidad: proyectos antiguos con nt.config.json en la raíz.
    config: !fs.existsSync(path.join(dir, 'nt.config.json')) && fs.existsSync(legacy) ? legacy : path.join(dir, 'nt.config.json'),
    project: path.join(dir, 'project.json'),
    kit: path.join(dir, 'kit')
  }
}

// Configuración efectiva de un proyecto (.nt/nt.config.json + tema resuelto).
export function loadProjectConfig(root) {
  const file = projectPaths(root).config
  const config = readJson(file, {})
  const themeId = config.theme || 'esmaix'
  const theme = resolveTheme(findTheme(themeId) || findTheme('esmaix') || {}, config.themeOverrides || {})
  return { file, exists: fs.existsSync(file), config: { template: 'sidebar', ...config, theme: themeId }, theme }
}
