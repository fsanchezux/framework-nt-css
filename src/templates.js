// Registro de plantillas. Crear una plantilla = carpeta templates/<id>/ con template.json + Shell.jsx
// y regenerar el registro (lo hace `nt new-template`; a mano: `node scripts/nt.mjs registry`).
import { REGISTRY } from './templates.registry.js'

export const TEMPLATES = REGISTRY.map(({ manifest, Shell }) => ({ ...manifest, Shell }))

export const DEFAULT_TEMPLATE = 'sidebar'

export const getTemplate = (id) => TEMPLATES.find((template) => template.id === id)
  || TEMPLATES.find((template) => template.id === DEFAULT_TEMPLATE)
  || TEMPLATES[0]
