// Compila el CSS del framework a un archivo CSS normal (sin Tailwind en el proyecto).
// Es la pieza que hace al framework independiente de la tecnología: Next, ASP.NET, Laravel, HTML estático…
// todos consumen el mismo CSS, compilado aquí con el Tailwind del propio framework.
import fs from 'node:fs'
import path from 'node:path'
import { compile, optimize } from '@tailwindcss/node'
import { Scanner } from '@tailwindcss/oxide'
import { FRAMEWORK_ROOT } from './catalog.js'
import { themeDeclarations } from '../theme/tokens.js'

export const STANDALONE_CSS = path.join(FRAMEWORK_ROOT, 'src', 'styles', 'standalone.css')

// theme: tema resuelto (resolveTheme). Se antepone como :root { --nt-*: … } para no depender de inyección en runtime.
// extraSources: carpetas extra que escanear (p. ej. el HTML de la plantilla exportada en el kit).
export async function buildFrameworkCss({ theme, minify = true, extraSources = [] } = {}) {
  const input = fs.readFileSync(STANDALONE_CSS, 'utf8')
  const compiler = await compile(input, { base: path.dirname(STANDALONE_CSS), onDependency() {} })
  const root = compiler.root && compiler.root !== 'none' ? [{ ...compiler.root, negated: false }] : []
  const extra = extraSources.map((dir) => ({ base: path.resolve(dir), pattern: '**/*', negated: false }))
  const scanner = new Scanner({ sources: [...root, ...compiler.sources, ...extra] })
  const css = compiler.build(scanner.scan())
  const head = theme ? `/* tema: ${theme.id || 'custom'} (generado por framework-nt-css) */\n:root { ${themeDeclarations(theme)} }\n` : ''
  const result = optimize(head + css, { minify })
  return typeof result === 'string' ? result : result.code
}
