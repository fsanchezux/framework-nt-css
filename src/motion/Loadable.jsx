'use client'
import { useRef } from 'react'
import { cn } from '../lib/cn.js'
import { gsap, MOTION, useGSAP } from './gsap.js'

// Skeleton con brillo: lo que se ve mientras algo carga. Toma la forma que le des con className (h-4 w-32…).
export function Skeleton({ className, rounded = 'rounded-lg', ...rest }) {
  return <span aria-hidden="true" className={cn('relative block overflow-hidden bg-ink/[.07]', rounded, className)} {...rest}>
    <span className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-ink/[.07] to-transparent"/>
  </span>
}

// Bloques típicos de skeleton para no tener que montarlos a mano.
export function SkeletonText({ lines = 3, className }) {
  return <span className={cn('grid gap-2', className)}>{Array.from({ length: lines }, (_, index) => <Skeleton key={index} className={cn('h-3', index === lines - 1 ? 'w-2/3' : 'w-full')}/>)}</span>
}
export function SkeletonCard({ className }) {
  return <div className={cn('rounded-2xl border border-ink/[.08] bg-paper p-5', className)}>
    <Skeleton className="h-3 w-24"/><Skeleton className="mt-6 h-8 w-20"/><Skeleton className="mt-2 h-3 w-32"/>
  </div>
}

// Todo lo que carga datos pasa por aquí: mientras `loading`, el skeleton; al terminar, el skeleton se funde
// y el contenido entra escalonado con GSAP (regla del framework: nada aparece "de golpe").
export function Loadable({ loading, skeleton, children, className, stagger = MOTION.stagger }) {
  const ref = useRef(null)
  useGSAP(() => {
    if (loading) return
    const items = gsap.utils.toArray(ref.current?.querySelector('[data-nt-content]')?.children || [])
    if (items.length) gsap.from(items, { autoAlpha: 0, y: 10, duration: MOTION.base, stagger, ease: MOTION.ease, clearProps: 'transform' })
  }, { scope: ref, dependencies: [loading] })

  return <div ref={ref} className={className} aria-busy={loading || undefined}>
    {loading ? (skeleton ?? <SkeletonText/>) : <div data-nt-content="" className="contents">{children}</div>}
  </div>
}
