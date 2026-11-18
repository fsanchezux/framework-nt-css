'use client'
import { useLayoutEffect, useRef } from 'react'
import { cn } from '../lib/cn.js'
import { gsap, prefersReducedMotion } from '../motion/gsap.js'

// Pastilla con indicador deslizante (la de los entornos de Hoopbase). El indicador se mueve con GSAP
// hasta el botón activo, con un pequeño estiramiento al viajar.
// items: [{ id, label, icon, badge }] · value · onChange(id) · iconOnlyBelow: ancho (px) bajo el que solo se ven los iconos.
export function SegmentedControl({ items, value, onChange, size = 'md', className, label = 'Secciones', floating = false }) {
  const root = useRef(null)
  const indicator = useRef(null)
  const first = useRef(true)

  useLayoutEffect(() => {
    const place = (animate) => {
      const active = root.current?.querySelector('[aria-selected="true"]')
      if (!active || !indicator.current) return
      const to = { x: active.offsetLeft, width: active.offsetWidth }
      if (!animate || prefersReducedMotion()) gsap.set(indicator.current, to)
      else gsap.timeline({ overwrite: true })
        .to(indicator.current, { ...to, duration: 0.55, ease: 'expo.out' })
        .fromTo(indicator.current, { scaleY: 0.86 }, { scaleY: 1, duration: 0.45, ease: 'back.out(3)' }, 0)
    }
    place(!first.current)
    first.current = false
    const observer = new ResizeObserver(() => place(false))
    observer.observe(root.current)
    return () => observer.disconnect()
  }, [value, items.length])

  const height = size === 'sm' ? 'h-9' : 'h-11'
  return <div ref={root} role="tablist" aria-label={label}
    className={cn('relative inline-flex rounded-full border border-ink/[.08] p-1', height, floating ? 'bg-paper/80 shadow-[0_6px_24px_rgba(0,0,0,.08)] backdrop-blur-xl' : 'bg-ink/[.04]', className)}>
    <span ref={indicator} aria-hidden="true" className="absolute bottom-1 left-0 top-1 rounded-full bg-accent"/>
    {items.map((item) => {
      const Icon = item.icon
      const active = item.id === value
      return <button key={item.id} type="button" role="tab" data-nt-value={item.id} aria-selected={active} aria-label={item.label} onClick={() => onChange?.(item.id)}
        className={cn('relative z-10 flex items-center justify-center gap-1.5 rounded-full px-3 text-[12px] font-semibold transition-colors duration-300 sm:px-4 sm:text-[13px]', active ? 'text-on-accent' : 'text-ink/50 hover:text-ink/80')}>
        {Icon && <Icon size={15}/>}
        <span className={cn(Icon && 'hidden min-[380px]:inline')}>{item.label}</span>
        {item.badge ? <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-accent/50"/> : null}
      </button>
    })}
  </div>
}
