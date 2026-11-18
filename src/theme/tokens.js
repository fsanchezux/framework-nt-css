// Fuente única de los tokens de color. La usan:
// - el plugin de Vite (inyecta el tema en index.html antes de pintar),
// - el runtime (applyTheme, para cambiar colores en vivo),
// - el Theme Studio (un selector por token) y el CLI (validación).
// Módulo puro (sin React ni DOM): se puede importar desde Node.
//
// Añadir un token = añadir una entrada aquí + usarlo en src/styles/index.css (@theme inline).

export const TOKEN_GROUPS = [
  { id: 'surface', label: 'Superficies' },
  { id: 'text', label: 'Texto' },
  { id: 'brand', label: 'Marca' },
  { id: 'state', label: 'Estados' },
  { id: 'gradient', label: 'Degradado de fondo' }
]

// key: nombre del token (clase Tailwind: bg-<key>, text-<key>, border-<key>…) · var: variable CSS.
export const TOKENS = [
  { key: 'canvas', group: 'surface', label: 'Fondo de página', hint: 'Detrás de todo el contenido.' },
  { key: 'sidebar', group: 'surface', label: 'Barra lateral / navbar', hint: 'Fondo de la navegación principal.' },
  { key: 'paper', group: 'surface', label: 'Tarjetas y paneles', hint: 'Cards, menús, diálogos, inputs.' },
  { key: 'ink', group: 'text', label: 'Texto y líneas', hint: 'Se usa con opacidad (ink/45, ink/[.08]) para jerarquía y bordes.' },
  { key: 'muted', group: 'text', label: 'Texto secundario', hint: 'Descripciones y metadatos.' },
  { key: 'accent', group: 'brand', label: 'Acento', hint: 'Botón principal, pestaña activa, selección.' },
  { key: 'accent-strong', group: 'brand', label: 'Acento (hover)', hint: 'Estado hover/pressed del acento.' },
  { key: 'accent-soft', group: 'brand', label: 'Acento suave', hint: 'Iconos, menciones, cifras destacadas.' },
  { key: 'on-accent', group: 'brand', label: 'Texto sobre acento', hint: 'Texto encima de un fondo de acento.' },
  { key: 'success', group: 'state', label: 'Éxito' },
  { key: 'warning', group: 'state', label: 'Aviso' },
  { key: 'danger', group: 'state', label: 'Error / peligro' },
  { key: 'glow-base', group: 'gradient', label: 'Base del degradado', hint: 'Color de arriba del fondo de marca.' },
  { key: 'glow-deep', group: 'gradient', label: 'Fondo del degradado', hint: 'Color de abajo antes del brillo.' },
  { key: 'glow', group: 'gradient', label: 'Brillo', hint: 'Luz de color que enciende el fondo.' }
]

export const TOKEN_KEYS = TOKENS.map((token) => token.key)
export const cssVar = (key) => `--nt-${key}`

// Valores por defecto = tema "esmaix" (Hoopbase). Si un tema no define un token, se usa este.
export const DEFAULT_COLORS = {
  canvas: '#101010',
  sidebar: '#0a0a0a',
  paper: '#1b1b1b',
  ink: '#f4f4f2',
  muted: '#9a9a96',
  accent: '#ff6129',
  'accent-strong': '#fc3b00',
  'accent-soft': '#ff7145',
  'on-accent': '#ffffff',
  success: '#2f9e57',
  warning: '#f5b031',
  danger: '#ff4d3d',
  'glow-base': '#000000',
  'glow-deep': '#2a0b03',
  glow: '#fc3b00'
}

export const DEFAULT_FONT = "'Helvetica Neue', Helvetica, Arial, ui-sans-serif, system-ui, sans-serif"
export const DEFAULT_RADIUS = '16px'

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

// Normaliza un tema (JSON de /themes) rellenando lo que falte con los valores por defecto.
export function resolveTheme(theme = {}, overrides = {}) {
  const colors = { ...DEFAULT_COLORS, ...(theme.colors || {}), ...(overrides.colors || {}) }
  return {
    id: theme.id || 'custom',
    name: theme.name || theme.id || 'Custom',
    scheme: overrides.scheme || theme.scheme || 'dark',
    colors,
    font: overrides.font || theme.font || DEFAULT_FONT,
    radius: overrides.radius || theme.radius || DEFAULT_RADIUS
  }
}

// Lista de problemas de un tema (vacía = válido).
export function validateTheme(theme) {
  const problems = []
  if (!theme || typeof theme !== 'object') return ['El tema no es un objeto JSON.']
  if (!theme.id || !/^[a-z0-9][a-z0-9-]*$/.test(theme.id)) problems.push('"id" debe ser kebab-case (a-z, 0-9, -).')
  for (const [key, value] of Object.entries(theme.colors || {})) {
    if (!TOKEN_KEYS.includes(key)) problems.push(`Token desconocido: "${key}".`)
    else if (!HEX.test(value)) problems.push(`"${key}" debe ser un color hex (#rrggbb), no "${value}".`)
  }
  if (theme.scheme && !['dark', 'light'].includes(theme.scheme)) problems.push('"scheme" debe ser "dark" o "light".')
  return problems
}

// Declaraciones CSS de un tema resuelto: "--nt-canvas: #101010; …".
export function themeDeclarations(resolved) {
  const lines = TOKEN_KEYS.map((key) => `${cssVar(key)}: ${resolved.colors[key]};`)
  lines.push(`--nt-font: ${resolved.font};`, `--nt-radius: ${resolved.radius};`, `color-scheme: ${resolved.scheme};`)
  return lines.join(' ')
}

export const themeToCss = (resolved, selector = ':root') => `${selector} { ${themeDeclarations(resolved)} }`
