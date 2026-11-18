'use client'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

// Punto único de configuración de GSAP: todos los componentes importan gsap desde aquí.
gsap.registerPlugin(useGSAP, ScrollTrigger)
gsap.defaults({ ease: 'expo.out', duration: 0.7 })

// Ritmo común de toda la UI (segundos). Cambiarlo aquí cambia todas las apps.
export const MOTION = {
  fast: 0.25,
  base: 0.55,
  slow: 0.9,
  stagger: 0.06,
  y: 18,
  ease: 'expo.out',
  easeInOut: 'power3.inOut'
}

export const REDUCED = '(prefers-reduced-motion: reduce)'
export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.(REDUCED).matches

export { gsap, ScrollTrigger, useGSAP }
