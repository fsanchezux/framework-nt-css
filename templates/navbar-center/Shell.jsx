'use client'
import { useRef, useState } from 'react'
import { Menu as MenuIcon } from 'lucide-react'
import { cn } from '../../src/lib/cn.js'
import { gsap, prefersReducedMotion, useGSAP } from '../../src/motion/gsap.js'
import { onAppReady } from '../../src/motion/ready.js'
import { BrandLogo, NAV_PILL_CLASSES, NavSection } from '../../src/components/Nav.jsx'
import { SegmentedControl } from '../../src/components/SegmentedControl.jsx'
import { Drawer } from '../../src/components/Overlay.jsx'
import { UserButton } from '../../src/components/UserButton.jsx'

// Plantilla "navbar-center": cabecera fija con la navegación principal CENTRADA.
// - Izquierda: botón de menú (cajón con TODA la navegación, el panel y el pie) + marca.
// - Centro: la pastilla de entornos (modes). Si no hay modes, los elementos del primer apartado de nav.
// - Derecha: acciones + cuenta.
// - Si hay modes, debajo de la cabecera va una segunda fila centrada con el primer apartado de nav.
// Mismos slots que "sidebar": migrar entre las dos no requiere tocar el proyecto.
// Opciones (templateOptions["navbar-center"]): { contentWidth, gradient, subnav }
export default function NavbarCenterShell({ brand = {}, modes, mode, onModeChange, nav = [], activeId, onNavigate, panel, footer, user, actions, options = {}, children }) {
  const [drawer, setDrawer] = useState(false)
  const root = useRef(null)
  const contentWidth = options.contentWidth || 1180
  const primary = (nav[0]?.items || []).slice(0, 7)
  const hasModes = modes?.length > 0
  const centerItems = hasModes ? modes : primary
  const centerValue = hasModes ? mode : activeId
  const showSubnav = hasModes && options.subnav !== false && primary.length > 0

  const go = (id, item) => { setDrawer(false); onNavigate?.(id, item) }
  const onCenter = (id) => {
    if (hasModes) return onModeChange?.(id)
    const item = primary.find((candidate) => candidate.id === id)
    return item?.onSelect ? item.onSelect(item) : onNavigate?.(id, item)
  }

  // Entrada: la cabecera cae desde arriba, la pastilla central crece desde el centro y la subnavegación aparece.
  useGSAP((context, contextSafe) => {
    if (prefersReducedMotion()) return undefined
    gsap.set('[data-nt-shell="header"]', { yPercent: -100 })
    gsap.set('[data-nt-shell="center"]', { autoAlpha: 0, scale: 0.9 })
    gsap.set('[data-nt-shell="side"] > *', { autoAlpha: 0, y: -8 })
    gsap.set('[data-nt-shell="subnav"]', { autoAlpha: 0, y: -10 })
    return onAppReady(contextSafe(() => {
      gsap.timeline({ defaults: { ease: 'expo.out' } })
        .to('[data-nt-shell="header"]', { yPercent: 0, duration: 0.8 })
        .to('[data-nt-shell="center"]', { autoAlpha: 1, scale: 1, duration: 0.7, ease: 'back.out(1.6)' }, '-=0.5')
        .to('[data-nt-shell="side"] > *', { autoAlpha: 1, y: 0, stagger: 0.05, duration: 0.5 }, '-=0.55')
        .to('[data-nt-shell="subnav"]', { autoAlpha: 1, y: 0, duration: 0.6 }, '-=0.4')
    }))
  }, { scope: root })

  return <div ref={root} data-nt-template="navbar-center" className="min-h-screen text-ink">
    {options.gradient !== false && <div aria-hidden="true" className="nt-gradient pointer-events-none fixed inset-0 -z-10"/>}

    <header data-nt-shell="header" className="sticky top-0 z-40 border-b border-ink/[.07] bg-sidebar/80 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:px-5" style={{ maxWidth: contentWidth + 160 }}>
        <div data-nt-shell="side" className="flex min-w-0 flex-1 items-center gap-2">
          <button type="button" data-nt-action="drawer" onClick={() => setDrawer(true)} aria-label="Abrir el menú" aria-expanded={drawer}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink/60 transition hover:bg-ink/[.06] hover:text-ink"><MenuIcon size={19}/></button>
          <button type="button" data-nt-action="home" onClick={brand.onClick} aria-label="Ir al inicio" className="min-w-0 rounded-lg"><BrandLogo {...brand}/></button>
        </div>
        {centerItems.length > 0 && <div data-nt-shell="center" className="order-last flex w-full justify-center md:order-none md:w-auto">
          <SegmentedControl floating items={centerItems} value={centerValue} onChange={onCenter} label={hasModes ? 'Entorno' : 'Navegación'}/>
        </div>}
        <div data-nt-shell="side" className="flex flex-1 items-center justify-end gap-2">
          {actions}
          <UserButton user={user}/>
        </div>
      </div>
      {showSubnav && <nav data-nt-shell="subnav" aria-label={nav[0]?.label || 'Navegación'} className="nt-scroll overflow-x-auto border-t border-ink/[.05]">
        <div className="mx-auto flex w-max gap-1 px-3 py-1.5">
          {primary.map((item) => {
            const Icon = item.icon
            const active = item.id === activeId
            return <button key={item.id} type="button" data-nt-nav={item.id} onClick={() => (item.onSelect ? item.onSelect(item) : onNavigate?.(item.id, item))} aria-current={active ? 'page' : undefined}
              className={cn('relative flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] transition-colors', active ? NAV_PILL_CLASSES.active : NAV_PILL_CLASSES.idle)}>
              {Icon && <Icon size={14} className={active ? NAV_PILL_CLASSES.iconActive : NAV_PILL_CLASSES.iconIdle}/>}{item.label}
            </button>
          })}
        </div>
      </nav>}
    </header>

    {/* Cajón con TODA la navegación: así ningún slot se pierde respecto a la plantilla sidebar. */}
    <Drawer open={drawer} onClose={() => setDrawer(false)} label="Menú">
      <div className="flex h-full flex-col">
        <div data-nt-item="" className="px-4 pb-1 pt-5"><BrandLogo {...brand}/></div>
        <nav aria-label="Navegación" className="nt-scroll mt-2 min-h-0 flex-1 overflow-y-auto px-3 pb-6">
          {nav.map((section, index) => <NavSection key={section.id || index} section={section} activeId={activeId} onNavigate={go}/>)}
          {panel && <div data-nt-item="" className="mt-2">{panel}</div>}
        </nav>
        {footer && <div data-nt-item="" className="grid shrink-0 gap-2 border-t border-ink/[.07] px-3 pb-4 pt-3">{footer}</div>}
      </div>
    </Drawer>

    <main className="mx-auto px-5 lg:px-8" style={{ maxWidth: contentWidth }}>{children}</main>
  </div>
}
