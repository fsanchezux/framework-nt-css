'use client'
import { useRef, useState } from 'react'
import { PanelLeft, X } from 'lucide-react'
import { cn } from '../../src/lib/cn.js'
import { gsap, prefersReducedMotion, useGSAP } from '../../src/motion/gsap.js'
import { onAppReady } from '../../src/motion/ready.js'
import { BrandLogo, NavSection } from '../../src/components/Nav.jsx'
import { SegmentedControl } from '../../src/components/SegmentedControl.jsx'
import { Drawer } from '../../src/components/Overlay.jsx'
import { UserButton } from '../../src/components/UserButton.jsx'

// Plantilla "sidebar" = la estructura de Hoopbase:
// - Barra lateral fija a la izquierda (estilo Zen Browser): marca arriba, navegación, panel libre y pie con la cuenta.
// - Sin cabecera: arriba solo flota, centrada, la pastilla de entornos (modes) y a la derecha las acciones.
// - Fondo de página = degradado de marca fijo detrás de todo.
// - En el móvil la barra lateral es un cajón que se abre con el botón flotante de arriba a la izquierda.
// Opciones (nt.config.json → templateOptions.sidebar): { width, gradient, contentWidth }
export default function SidebarShell({ brand = {}, modes, mode, onModeChange, nav = [], activeId, onNavigate, panel, footer, user, actions, options = {}, children }) {
  const [drawer, setDrawer] = useState(false)
  const root = useRef(null)
  const width = options.width || 272
  const contentWidth = options.contentWidth || 1180

  // Entrada de la plantilla (tras la precarga): la barra entra desde la izquierda y su contenido escalonado;
  // la pastilla baja desde arriba.
  useGSAP((context, contextSafe) => {
    if (prefersReducedMotion()) return undefined
    gsap.set('[data-nt-shell="aside"]', { autoAlpha: 0, x: -28 })
    gsap.set('[data-nt-shell="aside"] [data-nt-item]', { autoAlpha: 0, x: -10 })
    gsap.set('[data-nt-shell="top"] > *', { autoAlpha: 0, y: -16 })
    return onAppReady(contextSafe(() => {
      gsap.timeline({ defaults: { ease: 'expo.out' } })
        .to('[data-nt-shell="aside"]', { autoAlpha: 1, x: 0, duration: 0.8 })
        .to('[data-nt-shell="aside"] [data-nt-item]', { autoAlpha: 1, x: 0, stagger: 0.035, duration: 0.6 }, '-=0.55')
        .to('[data-nt-shell="top"] > *', { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.7 }, 0.15)
    }))
  }, { scope: root })

  // Al cambiar de entorno, la navegación vuelve a entrar con un pequeño desplazamiento (como en Hoopbase).
  const firstMode = useRef(true)
  useGSAP(() => {
    if (firstMode.current) { firstMode.current = false; return }
    if (prefersReducedMotion()) return
    gsap.fromTo('[data-nt-shell="nav"] [data-nt-item]', { autoAlpha: 0, x: 10 }, { autoAlpha: 1, x: 0, stagger: 0.025, duration: 0.4, ease: 'power3.out' })
  }, { scope: root, dependencies: [mode] })

  const go = (id, item) => { setDrawer(false); onNavigate?.(id, item) }

  const sidebar = (onClose) => <div className="flex h-full flex-col">
    <div data-nt-item="" className="flex items-center justify-between gap-2 px-4 pb-1 pt-5">
      <button type="button" data-nt-action="home" onClick={brand.onClick} aria-label="Ir al inicio" className="rounded-lg"><BrandLogo {...brand}/></button>
      {onClose && <button type="button" onClick={onClose} aria-label="Cerrar barra lateral" className="rounded-lg p-2 text-ink/40 hover:bg-ink/5 hover:text-ink"><X size={18}/></button>}
    </div>
    <nav data-nt-shell="nav" aria-label="Navegación" className="nt-scroll mt-2 min-h-0 flex-1 overflow-y-auto px-3 pb-6">
      {nav.map((section, index) => <NavSection key={section.id || index} section={section} activeId={activeId} onNavigate={go}/>)}
      {panel && <div data-nt-item="" className="mt-2">{panel}</div>}
    </nav>
    {(footer || user) && <div data-nt-item="" className="grid shrink-0 gap-2 border-t border-ink/[.07] px-3 pb-4 pt-3">
      {footer}
      {user && <div className={cn(footer && 'border-t border-ink/[.07] pt-2.5')}><UserButton user={user} showName/></div>}
    </div>}
  </div>

  return <div ref={root} data-nt-template="sidebar" className="min-h-screen text-ink" style={{ '--nt-sidebar-width': `${width}px` }}>
    {options.gradient !== false && <div aria-hidden="true" className="nt-gradient pointer-events-none fixed inset-0 -z-10"/>}

    <aside data-nt-shell="aside" className="fixed inset-y-0 left-0 z-40 hidden w-(--nt-sidebar-width) border-r border-ink/[.07] bg-sidebar lg:block">{sidebar()}</aside>
    <Drawer open={drawer} onClose={() => setDrawer(false)} label="Menú lateral">{sidebar(() => setDrawer(false))}</Drawer>

    <button type="button" data-nt-action="drawer" onClick={() => setDrawer(true)} aria-label="Abrir el menú lateral" aria-expanded={drawer}
      className="fixed left-3 top-3 z-40 grid h-11 w-11 place-items-center rounded-full border border-ink/[.08] bg-paper/80 text-ink/70 shadow-[0_6px_24px_rgba(0,0,0,.08)] backdrop-blur-xl transition hover:text-ink lg:hidden"><PanelLeft size={19}/></button>

    <div className="min-h-screen lg:pl-(--nt-sidebar-width)">
      {(modes?.length > 0 || actions) && <div data-nt-shell="top" className="pointer-events-none sticky top-0 z-30 flex items-center justify-center gap-2 pb-1 pl-16 pr-3 pt-3 lg:px-8">
        {modes?.length > 0 && <div className="pointer-events-auto"><SegmentedControl floating items={modes} value={mode} onChange={onModeChange} label="Entorno"/></div>}
        {actions && <div className="pointer-events-auto absolute right-3 top-3 flex items-center gap-2 lg:right-8">{actions}</div>}
      </div>}
      <main className="mx-auto px-5 lg:px-8" style={{ maxWidth: contentWidth }}>{children}</main>
    </div>
  </div>
}
