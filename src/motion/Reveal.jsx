'use client'
import { useRef } from 'react'
import { gsap, MOTION, prefersReducedMotion, ScrollTrigger, useGSAP } from './gsap.js'
import { onAppReady } from './ready.js'

// Animación de entrada: los hijos directos (o los que casen con `selector`) aparecen subiendo, escalonados.
// - Espera a que termine la precarga de la app.
// - scroll: true → cada elemento entra al aparecer en pantalla (ScrollTrigger.batch).
// - Respeta "reducir movimiento" (aparecen sin animación).
// Para repetir la animación (cambio de página), dale un `key` distinto.
export function Reveal({ as: Tag = 'div', selector, scroll = false, y = MOTION.y, x = 0, scale = 1, stagger = MOTION.stagger, delay = 0, duration = MOTION.base * 1.3, className, children, ...rest }) {
  const ref = useRef(null)

  useGSAP((context, contextSafe) => {
    const root = ref.current
    const targets = gsap.utils.toArray(selector ? root.querySelectorAll(selector) : root.children)
    gsap.set(root, { visibility: 'visible' })
    if (!targets.length) return undefined
    if (prefersReducedMotion()) { gsap.set(targets, { autoAlpha: 1 }); return undefined }
    gsap.set(targets, { autoAlpha: 0, y, x, scale })
    const to = { autoAlpha: 1, y: 0, x: 0, scale: 1, duration, ease: MOTION.ease, clearProps: 'transform' }
    // contextSafe: lo que se anima más tarde (al acabar la precarga) también se limpia al desmontar.
    const play = contextSafe(() => {
      if (scroll) {
        ScrollTrigger.batch(targets, { start: 'top 92%', once: true, onEnter: (batch) => gsap.to(batch, { ...to, stagger }) })
        ScrollTrigger.refresh()
      } else {
        gsap.to(targets, { ...to, stagger, delay })
      }
    })
    return onAppReady(play)
  }, { scope: ref })

  return <Tag ref={ref} data-nt-reveal="" className={className} {...rest}>{children}</Tag>
}
