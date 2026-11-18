import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { DEFAULT_COLORS, TOKEN_KEYS, resolveTheme, validateTheme, themeDeclarations } from '../src/theme/tokens.js'
import { SLOT_KEYS, validateTemplateManifest } from '../src/contract.js'
import { FRAMEWORK_ROOT, listTemplates, listThemes, readJson } from '../src/node/catalog.js'

const nt = (...args) => spawnSync(process.execPath, [path.join(FRAMEWORK_ROOT, 'scripts/nt.mjs'), ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

test('todos los temas son válidos y definen todos los tokens', () => {
  const themes = listThemes()
  assert.ok(themes.length >= 1)
  for (const theme of themes) {
    assert.deepEqual(validateTheme(theme), [], theme.id)
    assert.deepEqual(Object.keys(theme.colors).sort(), [...TOKEN_KEYS].sort(), `${theme.id} debe definir todos los tokens`)
  }
})

test('resolveTheme rellena lo que falta con los valores por defecto', () => {
  const resolved = resolveTheme({ id: 'x', colors: { accent: '#123456' } })
  assert.equal(resolved.colors.accent, '#123456')
  assert.equal(resolved.colors.canvas, DEFAULT_COLORS.canvas)
  assert.match(themeDeclarations(resolved), /--nt-accent: #123456;/)
})

test('validateTheme detecta tokens desconocidos y colores no hex', () => {
  const problems = validateTheme({ id: 'bad', colors: { nope: '#fff', accent: 'red' } })
  assert.equal(problems.length, 2)
})

test('todas las plantillas cumplen el contrato', () => {
  for (const template of listTemplates()) {
    assert.deepEqual(validateTemplateManifest(template, { hasShell: template.hasShell }), [], template.id)
    assert.equal(template.folder, template.id)
  }
})

test('los schemas están sincronizados con tokens y slots', () => {
  const theme = readJson(path.join(FRAMEWORK_ROOT, 'references/theme.schema.json'))
  assert.deepEqual(Object.keys(theme.properties.colors.properties).sort(), [...TOKEN_KEYS].sort())
  const template = readJson(path.join(FRAMEWORK_ROOT, 'references/template.schema.json'))
  assert.deepEqual(template.properties.slots.required, SLOT_KEYS)
})

test('cada token tiene utilidad de Tailwind y valor de reserva en el CSS', () => {
  const css = fs.readFileSync(path.join(FRAMEWORK_ROOT, 'src/styles/framework.css'), 'utf8')
  for (const key of TOKEN_KEYS) {
    assert.match(css, new RegExp(`--nt-${key}:`), `falta el valor de reserva de ${key}`)
    if (!key.startsWith('glow-')) assert.match(css, new RegExp(`--color-${key}: var\\(--nt-${key}\\)`), `falta --color-${key}`)
  }
})

test('nt init sin opciones (no interactivo) sale con 2 y lista las opciones', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nt-init-'))
  const result = nt('init', path.join(dir, 'app'))
  assert.equal(result.status, 2)
  const json = JSON.parse(result.stderr.slice(result.stderr.indexOf('{')))
  assert.deepEqual(json.missing, ['template', 'theme'])
  assert.ok(json.templates.some((t) => t.id === 'sidebar'))
  fs.rmSync(dir, { recursive: true, force: true })
})

test('nt init + migrate escriben .nt/nt.config.json sin tocar el código', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nt-init-'))
  const app = path.join(dir, 'app')
  assert.equal(nt('init', app, '--template', 'sidebar', '--theme', 'esmaix', '--name', 'Test App').status, 0)
  const before = fs.readFileSync(path.join(app, 'src/App.jsx'), 'utf8')
  assert.equal(readJson(path.join(app, '.nt', 'nt.config.json')).template, 'sidebar')
  assert.ok(readJson(path.join(app, 'package.json')).dependencies['framework-nt-css'].startsWith('file:'))
  assert.ok(fs.existsSync(path.join(app, '.gitignore')))

  assert.equal(nt('migrate', app, '--template', 'navbar-center', '--theme', 'midnight').status, 0)
  const config = readJson(path.join(app, '.nt', 'nt.config.json'))
  assert.equal(config.template, 'navbar-center')
  assert.equal(config.theme, 'midnight')
  assert.equal(fs.readFileSync(path.join(app, 'src/App.jsx'), 'utf8'), before)

  assert.notEqual(nt('migrate', app, '--template', 'no-existe').status, 0)
  assert.equal(nt('doctor', app).status, 0)
  fs.rmSync(dir, { recursive: true, force: true })
})
