// Renderiza la plantilla (los MISMOS componentes React que usan Next y Vite) a HTML estático para el kit.
// Lo ejecuta src/node/kit.js en Node a través de Vite (ssrLoadModule). Las clases de aquí las escanea Tailwind.
import { renderToStaticMarkup } from 'react-dom/server'
import * as Icons from 'lucide-react'
import { getTemplate } from '../templates.js'
import { BrandLogo, NAV_ITEM_CLASSES, NAV_PILL_CLASSES, NavSection } from '../components/Nav.jsx'

const SLOT = 'NT_CONTENT_SLOT'

export function renderKit({ template, options = {}, brand, nav }) {
  const withIcons = nav.map((section) => ({ ...section, items: section.items.map((item) => ({ ...item, icon: Icons[item.icon] || Icons.Circle })) }))
  const resolved = getTemplate(template)
  const { Shell } = resolved
  // El contenido de cada página va donde queda el comentario <!-- nt:content -->.
  const shell = renderToStaticMarkup(<Shell brand={brand} nav={withIcons} options={options}>{SLOT}</Shell>).replace(SLOT, '<!-- nt:content -->')
  // Contenido del cajón (móvil en sidebar, siempre en navbar-center): marca + toda la navegación.
  const drawer = renderToStaticMarkup(<div className="flex h-full flex-col">
    <div data-nt-item="" className="flex items-center justify-between gap-2 px-4 pb-1 pt-5">
      <button type="button" data-nt-action="home" aria-label="Ir al inicio" className="rounded-lg"><BrandLogo {...brand}/></button>
      <button type="button" data-nt-action="close" aria-label="Cerrar el menú" className="rounded-lg p-2 text-ink/40 hover:bg-ink/5 hover:text-ink"><Icons.X size={18}/></button>
    </div>
    <nav aria-label="Navegación" className="nt-scroll mt-2 min-h-0 flex-1 overflow-y-auto px-3 pb-6">
      {withIcons.map((section, index) => <NavSection key={section.id || index} section={section}/>)}
    </nav>
  </div>)
  return { template: resolved.id, shell, drawer, classes: { item: NAV_ITEM_CLASSES, pill: NAV_PILL_CLASSES } }
}
