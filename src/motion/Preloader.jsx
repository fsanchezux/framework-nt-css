'use client'
import { useEffect, useRef } from 'react'
import { gsap, MOTION, prefersReducedMotion } from './gsap.js'
import { markAppReady } from './ready.js'

// Precarga de la app. Recoge la pantalla de arranque que pinta el HTML (#nt-boot, la inyecta el plugin de Vite)
// y, cuando todo está listo, la saca con GSAP: la barra se completa, la marca sube y la cortina se levanta.
// "Listo" = fuentes cargadas + `ready` (p. ej. los datos iniciales) + un mínimo para que no sea un flash.
// Al terminar marca la app como lista: entonces empiezan las animaciones de entrada (plantilla y páginas).
export function Preloader({ ready = true, minDuration = 0.65 }) {
  const started = useRef(performance.now())
  const done = useRef(false)

  useEffect(() => {
    if (!ready || done.current) return undefined
    const boot = document.getElementById('nt-boot')
    if (!boot) { done.current = true; markAppReady(); return undefined }
    let cancelled = false
    const fonts = document.fonts?.ready || Promise.resolve()
    const wait = Math.max(0, minDuration * 1000 - (performance.now() - started.current))
    let timeline
    Promise.all([fonts, new Promise((resolve) => window.setTimeout(resolve, wait))]).then(() => {
      if (cancelled) return
      done.current = true
      // Se oculta en vez de borrarse: en Next.js #nt-boot lo pinta React (layout) y no se le pueden quitar nodos.
      const finish = () => { boot.style.display = 'none'; markAppReady() }
      if (prefersReducedMotion()) {
        timeline = gsap.to(boot, { autoAlpha: 0, duration: MOTION.fast, onComplete: finish })
        return
      }
      const bar = boot.querySelector('.nt-boot-bar > i')
      const mark = boot.querySelector('.nt-boot-mark')
      timeline = gsap.timeline({ onComplete: finish })
        .set(bar, { animation: 'none', xPercent: 0, x: 0, width: '0%' })
        .to(bar, { width: '100%', duration: 0.45, ease: 'power2.inOut' })
        .to(mark, { y: -16, autoAlpha: 0, duration: 0.4, ease: 'power3.in' }, '+=0.05')
        // La app empieza a entrar mientras la cortina se levanta.
        .add(markAppReady, '-=0.1')
        .to(boot, { yPercent: -100, duration: 0.75, ease: 'expo.inOut' }, '<')
    })
    return () => { cancelled = true; timeline?.kill() }
  }, [ready, minDuration])

  return null
}
