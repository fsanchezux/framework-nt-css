'use client'
import { useRef } from 'react'
import { gsap, prefersReducedMotion, useGSAP } from './gsap.js'
import { onAppReady } from './ready.js'

// Número que cuenta hasta su valor al aparecer (cifras de StatCard, marcadores…).
// Los valores no numéricos ("—", "12-4") se muestran tal cual.
export function Counter({ value, decimals, duration = 1.2, format }) {
  const ref = useRef(null)
  const numeric = typeof value === 'number' || (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value))
  const target = numeric ? Number(value) : 0
  const places = decimals ?? (String(value).split('.')[1]?.length || 0)
  const show = (n) => (format ? format(n) : n.toFixed(places))

  useGSAP((context, contextSafe) => {
    if (!numeric || !ref.current) return undefined
    if (prefersReducedMotion()) { ref.current.textContent = show(target); return undefined }
    const state = { n: 0 }
    ref.current.textContent = show(0)
    return onAppReady(contextSafe(() => gsap.to(state, { n: target, duration, ease: 'power3.out', onUpdate: () => { if (ref.current) ref.current.textContent = show(state.n) } })))
  }, { dependencies: [value] })

  // Si es numérico, el texto lo escribe GSAP (React no gestiona ese nodo de texto, para no pisarse).
  return <span ref={ref} className="tabular-nums">{numeric ? null : value}</span>
}
