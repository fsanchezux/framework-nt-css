'use client'
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '../lib/cn.js'

// Logo: imagen opcional en pastilla + nombre. `highlight` pinta en color de acento esa parte del nombre
// (Hoopbase: name="esmaix" highlight="ai").
export function BrandLogo({ name = 'app', highlight, logo, className }) {
  const parts = highlight && name.includes(highlight) ? name.split(highlight) : null
  return <span className={cn('flex items-center gap-3', className)}>
    {logo && <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-black">
      {typeof logo === 'string' ? <img src={logo} alt="" className="h-full w-full"/> : logo}
    </span>}
    <span className="text-[17px] font-bold tracking-[-.04em]">
      {parts ? <>{parts[0]}<span className="text-accent">{highlight}</span>{parts.slice(1).join(highlight)}</> : name}
    </span>
  </span>
}

// Fila de navegación (barra lateral de Hoopbase). item: { id, label, icon, meta, badge, iconClassName }
// Clases del elemento activo / inactivo. Exportadas para que el kit (HTML sin React) marque la página activa igual.
export const NAV_ITEM_CLASSES = {
  active: 'bg-paper font-semibold text-ink shadow-[0_1px_2px_rgba(0,0,0,.08)]',
  idle: 'text-ink/70 hover:bg-ink/[.05] hover:text-ink',
  iconActive: 'text-accent-soft',
  iconIdle: 'text-ink/45 group-hover:text-ink/70'
}
// Pastillas de navegación horizontales (subnav de la plantilla navbar-center).
export const NAV_PILL_CLASSES = {
  active: 'bg-ink/[.08] font-semibold text-ink',
  idle: 'text-ink/55 hover:bg-ink/[.04] hover:text-ink',
  iconActive: 'text-accent-soft',
  iconIdle: ''
}

export function NavItem({ item, active, onSelect, className }) {
  const Icon = item.icon
  return <button type="button" data-nt-item="" data-nt-nav={item.id} onClick={() => onSelect?.(item)} aria-current={active ? 'page' : undefined}
    className={cn('group flex w-full items-center gap-2 rounded-lg px-2.5 py-[7px] text-left text-sm transition-colors',
      active ? NAV_ITEM_CLASSES.active : NAV_ITEM_CLASSES.idle, className)}>
    {Icon && <Icon size={15} className={cn('shrink-0', active ? NAV_ITEM_CLASSES.iconActive : NAV_ITEM_CLASSES.iconIdle, item.iconClassName)}/>}
    <span className="min-w-0 flex-1">
      <span className="block truncate">{item.label}</span>
      {item.meta && <span className="block truncate text-[11px] font-normal text-ink/40">{item.meta}</span>}
    </span>
    {item.badge != null && <span className="shrink-0 rounded-full bg-ink/[.07] px-1.5 text-[10px] font-semibold text-ink/50">{item.badge}</span>}
  </button>
}

// Apartado de navegación con cabecera (plegable si collapsible). section: { id, label, items, action, collapsible, empty }
export function NavSection({ section, activeId, onNavigate }) {
  const [open, setOpen] = useState(section.defaultOpen !== false)
  const Action = section.action?.icon
  const header = section.label && <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-sidebar pb-1 pt-3">
    {section.collapsible
      ? <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="group flex min-w-0 flex-1 items-center gap-1.5 rounded-lg py-1 pl-2 pr-1 text-left">
        <ChevronRight size={13} className={cn('shrink-0 text-ink/30 transition-transform duration-300 group-hover:text-ink/60', open && 'rotate-90')}/>
        <span className="truncate text-[11px] font-bold uppercase tracking-[.14em] text-ink/35 group-hover:text-ink/60">{section.label}</span>
        {!open && section.items?.length > 0 && <span className="shrink-0 rounded-full bg-ink/[.06] px-1.5 text-[10px] font-semibold text-ink/40">{section.items.length}</span>}
      </button>
      : <span className="px-2 text-[11px] font-bold uppercase tracking-[.14em] text-ink/35">{section.label}</span>}
    {section.action && <button type="button" onClick={section.action.onClick} aria-label={section.action.label} title={section.action.label}
      className="grid h-7 w-7 place-items-center rounded-lg text-ink/45 transition hover:bg-ink/[.06] hover:text-ink">{Action && <Action size={15}/>}</button>}
  </div>
  return <div data-nt-item="">
    {header}
    {open && <div className="space-y-0.5">
      {(section.items || []).map((item) => <NavItem key={item.id} item={item} active={item.id === activeId} onSelect={(selected) => (selected.onSelect ? selected.onSelect(selected) : onNavigate?.(selected.id, selected))}/>)}
      {!section.items?.length && section.empty && <p className="px-2.5 py-1.5 text-[11px] leading-5 text-ink/40">{section.empty}</p>}
    </div>}
  </div>
}
