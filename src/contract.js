// CONTRATO DE PLANTILLAS — la clave para migrar entre plantillas sin tocar el proyecto.
//
// Un proyecto NUNCA monta su layout: le pasa a <NtApp> estos "slots" como datos/JSX
// y la plantilla activa decide dónde y cómo pintarlos. Toda plantilla debe colocar TODOS los slots
// (lo comprueba `nt doctor`), así que cambiar de plantilla nunca pierde nada.
//
// Módulo puro (sin React): lo importa también el CLI.

export const CONTRACT_VERSION = 1

export const SLOTS = {
  brand: 'Marca: { name, highlight?, logo?, onClick? }',
  modes: 'Entornos/espacios de primer nivel: [{ id, label, icon, badge? }] + mode + onModeChange(id)',
  nav: 'Navegación: [{ id, label?, collapsible?, action?: { label, icon, onClick }, empty?, items: [{ id, label, icon?, meta?, badge?, onSelect? }] }] + activeId + onNavigate(id, item)',
  panel: 'JSX libre de la navegación (p. ej. lista de conversaciones, filtros). Va debajo de nav.',
  footer: 'JSX del pie de la navegación (selector de liga, equipo, ajustes…).',
  user: 'Cuenta: { name, avatar?, meta?, menu?: [{ label, icon, onSelect, danger? }] }',
  actions: 'JSX de acciones globales arriba a la derecha (botones, buscador…).',
  content: 'children: la página activa (siempre dentro de <Page>).'
}

export const SLOT_KEYS = Object.keys(SLOTS)

// Validación de un template.json. Devuelve la lista de problemas (vacía = válido).
export function validateTemplateManifest(manifest, { hasShell = true } = {}) {
  const problems = []
  if (!manifest?.id || !/^[a-z0-9][a-z0-9-]*$/.test(manifest.id)) problems.push('"id" debe ser kebab-case.')
  if (!manifest?.name) problems.push('Falta "name".')
  if (!manifest?.description) problems.push('Falta "description" (la lee el agente para preguntar al usuario).')
  if (manifest?.contract !== CONTRACT_VERSION) problems.push(`"contract" debe ser ${CONTRACT_VERSION}.`)
  const slots = manifest?.slots || {}
  SLOT_KEYS.forEach((slot) => { if (!slots[slot]) problems.push(`El slot "${slot}" no tiene ubicación en "slots" (toda plantilla debe colocar todos los slots).`) })
  if (!hasShell) problems.push('Falta Shell.jsx en la carpeta de la plantilla.')
  return problems
}
