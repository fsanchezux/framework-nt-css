'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../lib/cn.js'
import { gsap, prefersReducedMotion, useGSAP } from '../motion/gsap.js'

// Mantiene montado un overlay mientras anima su salida: open=false → anima → desmonta.
function usePresence(open) {
  const [mounted, setMounted] = useState(open)
  useEffect(() => { if (open) setMounted(true) }, [open])
  return [mounted, () => setMounted(false)]
}

// Diálogo modal: fondo difuminado + panel que entra escalando con GSAP. Escape o clic fuera lo cierran.
export function Dialog({ open, onClose, title, description, children, footer, size = 'md', className }) {
  const [mounted, unmount] = usePresence(open)
  const backdrop = useRef(null)
  const panel = useRef(null)

  useGSAP(() => {
    if (!mounted) return
    const fast = prefersReducedMotion()
    if (open) {
      gsap.fromTo(backdrop.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: fast ? 0 : 0.3 })
      gsap.fromTo(panel.current, { autoAlpha: 0, y: 24, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: fast ? 0 : 0.55, ease: 'expo.out' })
    } else {
      gsap.to(panel.current, { autoAlpha: 0, y: 12, scale: 0.98, duration: fast ? 0 : 0.2, ease: 'power2.in' })
      gsap.to(backdrop.current, { autoAlpha: 0, duration: fast ? 0 : 0.25, onComplete: unmount })
    }
  }, { dependencies: [open, mounted] })

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => { if (event.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!mounted) return null
  const width = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-4xl' }[size]
  return createPortal(<div className="fixed inset-0 z-[80] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
    <div ref={backdrop} className="invisible absolute inset-0 bg-black/45 backdrop-blur-sm" onMouseDown={onClose}/>
    <div ref={panel} className={cn('invisible relative max-h-[90vh] w-full overflow-auto rounded-2xl border border-ink/[.08] bg-canvas p-5 text-ink shadow-2xl sm:p-7', width, className)}>
      {(title || onClose) && <div className="flex items-start justify-between gap-4">
        <div>{title && <h2 className="text-2xl font-semibold tracking-[-.06em]">{title}</h2>}{description && <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{description}</p>}</div>
        {onClose && <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-ink/40 hover:bg-ink/5 hover:text-ink"><X size={19}/></button>}
      </div>}
      <div className={cn(title && 'mt-6')}>{children}</div>
      {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
    </div>
  </div>, document.body)
}

// Panel lateral deslizante (menú móvil de las plantillas, filtros…). side: left | right.
export function Drawer({ open, onClose, side = 'left', width = 'w-[min(300px,85vw)]', className, label = 'Menú', children }) {
  const [mounted, unmount] = usePresence(open)
  const backdrop = useRef(null)
  const panel = useRef(null)

  useGSAP(() => {
    if (!mounted) return
    const fast = prefersReducedMotion()
    const from = side === 'left' ? -100 : 100
    if (open) {
      gsap.fromTo(backdrop.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: fast ? 0 : 0.3 })
      gsap.fromTo(panel.current, { xPercent: from }, { xPercent: 0, duration: fast ? 0 : 0.6, ease: 'expo.out' })
      gsap.from(panel.current.querySelectorAll('[data-nt-item]'), { autoAlpha: 0, x: side === 'left' ? -12 : 12, stagger: 0.03, duration: fast ? 0 : 0.45, delay: 0.1 })
    } else {
      gsap.to(panel.current, { xPercent: from, duration: fast ? 0 : 0.35, ease: 'power3.in' })
      gsap.to(backdrop.current, { autoAlpha: 0, duration: fast ? 0 : 0.35, onComplete: unmount })
    }
  }, { dependencies: [open, mounted] })

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => { if (event.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!mounted) return null
  return createPortal(<div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={label}>
    <div ref={backdrop} className="invisible absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
    <aside ref={panel} className={cn('absolute inset-y-0 bg-sidebar shadow-2xl', side === 'left' ? 'left-0' : 'right-0', width, className)}>{children}</aside>
  </div>, document.body)
}

// Menú contextual flotante anclado a un botón (fuera del contenedor para que el scroll no lo recorte).
export function Menu({ anchor, onClose, align = 'end', className, children }) {
  const panel = useRef(null)
  useEffect(() => {
    const close = (event) => { if (!panel.current?.contains(event.target) && !anchor?.contains(event.target)) onClose() }
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onClose)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', onKey); window.removeEventListener('resize', onClose) }
  }, [anchor, onClose])
  useGSAP(() => {
    if (prefersReducedMotion()) return
    gsap.from(panel.current, { autoAlpha: 0, y: -6, scale: 0.97, transformOrigin: 'top right', duration: 0.3, ease: 'expo.out' })
    gsap.from(panel.current.children, { autoAlpha: 0, y: -4, stagger: 0.02, duration: 0.25 })
  })
  if (!anchor) return null
  const rect = anchor.getBoundingClientRect()
  const up = rect.bottom + 320 > window.innerHeight
  const left = align === 'start' ? rect.left : rect.right - 224
  const style = { left: Math.max(8, Math.min(left, window.innerWidth - 232)), ...(up ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }) }
  return createPortal(<div ref={panel} role="menu" style={style} onClick={(event) => event.stopPropagation()}
    className={cn('fixed z-[90] max-h-[60vh] w-56 overflow-y-auto rounded-xl border border-ink/10 bg-paper p-1.5 text-sm text-ink shadow-xl', className)}>{children}</div>, document.body)
}

export function MenuItem({ icon: Icon, onClick, danger, checked, children }) {
  return <button type="button" role="menuitem" onClick={onClick} className={cn('flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left', danger ? 'text-danger hover:bg-danger/15' : 'hover:bg-ink/[.05]')}>
    {Icon && <Icon size={14} className={cn('shrink-0', !danger && 'text-ink/45')}/>}
    <span className="min-w-0 flex-1 truncate">{children}</span>
    {checked && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent"/>}
  </button>
}
export const MenuLabel = ({ children }) => <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold text-ink/35">{children}</p>
export const MenuDivider = () => <div className="my-1 h-px bg-ink/[.07]"/>
