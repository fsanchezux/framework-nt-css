// Genera los JSON Schema de references/ a partir de tokens.js y contract.js (fuente única).
// node scripts/gen-schemas.mjs
import path from 'node:path'
import { TOKENS } from '../src/theme/tokens.js'
import { SLOTS, CONTRACT_VERSION } from '../src/contract.js'
import { FRAMEWORK_ROOT, writeJson } from '../src/node/catalog.js'

const out = (name, schema) => writeJson(path.join(FRAMEWORK_ROOT, 'references', name), schema)
const hex = { type: 'string', pattern: '^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$' }

out('theme.schema.json', {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'framework-nt-css theme',
  type: 'object',
  required: ['id', 'name', 'colors'],
  properties: {
    $schema: { type: 'string' },
    id: { type: 'string', pattern: '^[a-z0-9][a-z0-9-]*$' },
    name: { type: 'string' },
    description: { type: 'string' },
    scheme: { enum: ['dark', 'light'] },
    colors: { type: 'object', additionalProperties: false, properties: Object.fromEntries(TOKENS.map((t) => [t.key, { ...hex, description: `${t.label}${t.hint ? ` — ${t.hint}` : ''}` }])) },
    font: { type: 'string', description: 'CSS font-family' },
    radius: { type: 'string' }
  }
})

out('template.schema.json', {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'framework-nt-css template manifest',
  type: 'object',
  required: ['id', 'name', 'version', 'contract', 'description', 'slots'],
  properties: {
    $schema: { type: 'string' },
    id: { type: 'string', pattern: '^[a-z0-9][a-z0-9-]*$' },
    name: { type: 'string' },
    version: { type: 'string' },
    contract: { const: CONTRACT_VERSION },
    description: { type: 'string' },
    bestFor: { type: 'array', items: { type: 'string' } },
    layout: { type: 'string' },
    mobile: { type: 'string' },
    slots: { type: 'object', required: Object.keys(SLOTS), properties: Object.fromEntries(Object.entries(SLOTS).map(([k, d]) => [k, { type: 'string', description: d }])) },
    options: { type: 'object', additionalProperties: { type: 'object', properties: { type: { type: 'string' }, default: {}, description: { type: 'string' } } } },
    motion: { type: 'string' }
  }
})

out('nt-config.schema.json', {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'framework-nt-css project config (nt.config.json)',
  type: 'object',
  properties: {
    $schema: { type: 'string' },
    template: { type: 'string', description: 'id de templates/<id>' },
    theme: { type: 'string', description: 'id de themes/<id>.json' },
    app: { type: 'object', properties: { name: { type: 'string' } } },
    templateOptions: { type: 'object', description: 'Opciones por plantilla: { "<id>": { … } }' },
    themeOverrides: { type: 'object', properties: { colors: { type: 'object', properties: Object.fromEntries(TOKENS.map((t) => [t.key, hex])) }, font: { type: 'string' }, radius: { type: 'string' }, scheme: { enum: ['dark', 'light'] } } }
  }
})
console.log('schemas ok')

// Tipos mínimos para proyectos TypeScript (Next con strict): el framework es JS y, sin esto, TS infiere props
// obligatorias de los componentes. Todo es `any` a propósito: la API se documenta en references/.
{
  const fs = await import('node:fs')
  const src = fs.readFileSync(new URL('../src/index.js', import.meta.url), 'utf8')
  const names = [...src.matchAll(/export \{([^}]+)\} from/g)].flatMap((m) => m[1].split(',').map((n) => n.trim()).filter(Boolean))
  fs.writeFileSync(new URL('../src/index.d.ts', import.meta.url), `// GENERADO por scripts/gen-schemas.mjs a partir de src/index.js.\n${names.map((n) => `export declare const ${n}: any`).join('\n')}\n`)
  fs.writeFileSync(new URL('../src/icons.d.ts', import.meta.url), "export * from 'lucide-react'\n")
  console.log(`tipos ok (${names.length} exports)`)
}
