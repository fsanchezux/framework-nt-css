'use client'
import { forwardRef, useRef } from 'react'
import { LoaderCircle } from 'lucide-react'
import { cn } from '../lib/cn.js'
import { gsap, prefersReducedMotion } from '../motion/gsap.js'

const VARIANTS = {
  primary: 'bg-accent text-on-accent hover:bg-accent-strong shadow-[0_8px_24px_-12px_var(--nt-accent)]',
  secondary: 'bg-ink/[.07] text-ink hover:bg-ink/[.12]',
  outline: 'border border-ink/[.12] text-ink hover:border-ink/25 hover:bg-ink/[.04]',
  ghost: 'text-ink/60 hover:bg-ink/[.06] hover:text-ink',
  danger: 'bg-danger/15 text-danger hover:bg-danger/25'
}
const SIZES = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-12 gap-2.5 rounded-2xl px-6 text-[15px]'
}

// Feedback de pulsación con GSAP (se hunde y rebota). Compartido por Button e IconButton.
export function usePress() {
  const ref = useRef(null)
  const down = () => { if (!prefersReducedMotion()) gsap.to(ref.current, { scale: 0.96, duration: 0.12, ease: 'power2.out' }) }
  const up = () => { if (!prefersReducedMotion()) gsap.to(ref.current, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.45)' }) }
  return { ref, onPointerDown: down, onPointerUp: up, onPointerLeave: up }
}

const mergeRefs = (...refs) => (node) => refs.forEach((ref) => { if (typeof ref === 'function') ref(node); else if (ref) ref.current = node })

export const Button = forwardRef(function Button({ variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, loading = false, className, children, disabled, ...rest }, forwarded) {
  const press = usePress()
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16
  return <button type="button" {...rest} ref={mergeRefs(press.ref, forwarded)} onPointerDown={press.onPointerDown} onPointerUp={press.onPointerUp} onPointerLeave={press.onPointerLeave}
    disabled={disabled || loading}
    className={cn('inline-flex shrink-0 select-none items-center justify-center font-semibold transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50', VARIANTS[variant], SIZES[size], className)}>
    {loading ? <LoaderCircle size={iconSize} className="animate-spin"/> : Icon && <Icon size={iconSize}/>}
    {children}
    {IconRight && <IconRight size={iconSize}/>}
  </button>
})

// Botón de icono con su nombre en una etiqueta flotante (Hoopbase). `label` es obligatorio (accesibilidad).
export function IconButton({ label, icon: Icon, size = 'md', active = false, tooltip = 'bottom', className, children, ...rest }) {
  const press = usePress()
  const box = size === 'sm' ? 'h-7 w-7 rounded-lg' : size === 'lg' ? 'h-11 w-11 rounded-full' : 'h-9 w-9 rounded-lg'
  return <span className="group/tip relative inline-flex">
    <button type="button" aria-label={label} {...rest} {...press}
      className={cn('grid place-items-center transition-colors', box, active ? 'bg-paper text-ink shadow-[0_1px_2px_rgba(0,0,0,.08)]' : 'text-ink/50 hover:bg-ink/[.06] hover:text-ink', className)}>
      {Icon ? <Icon size={size === 'sm' ? 15 : 17}/> : children}
    </button>
    {tooltip && <span role="tooltip" className={cn('pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] font-semibold text-canvas opacity-0 shadow-lg transition-opacity delay-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100',
      tooltip === 'top' ? 'bottom-full left-1/2 mb-1.5 -translate-x-1/2' : tooltip === 'right' ? 'left-full top-1/2 ml-2 -translate-y-1/2' : 'right-0 top-full mt-1.5')}>{label}</span>}
  </span>
}
