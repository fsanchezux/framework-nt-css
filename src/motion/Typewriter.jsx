'use client'
import { useMemo, useRef, useState } from 'react'
import { cn } from '../lib/cn.js'
import { gsap, prefersReducedMotion, useGSAP } from './gsap.js'
import { onAppReady } from './ready.js'

const Caret = ({ light }) => <span aria-hidden="true" className={cn('-mr-[.1em] ml-[.04em] inline-block w-[.06em] translate-y-[.08em] animate-caret bg-accent', light ? 'h-[.95em]' : 'h-[.85em]')}/>

// Título de portada de Hoopbase hecho con GSAP: el título se escribe a máquina, se funde y en su sitio
// se escriben (y borran) ejemplos de preguntas; luego vuelve a empezar.
// lines: [{ text, className }] · prompts: ['…'] · highlight: RegExp de las partes en color de acento.
export function Typewriter({ lines, prompts = [], highlight = /(@[^@?]+?(?= con | en |$|\?))/g, className, typeSpeed = 0.055, promptSpeed = 0.038, eraseSpeed = 0.016, hold = 1.8 }) {
  const ref = useRef(null)
  const fullText = lines.map((line) => line.text).join(' ')
  const total = lines.reduce((sum, line) => sum + line.text.length, 0)
  const [state, setState] = useState({ phase: 'title', count: prefersReducedMotion() ? total : 0, prompt: 0 })

  useGSAP(() => {
    if (prefersReducedMotion()) return
    const counter = { n: 0 }
    const set = (patch) => setState((current) => ({ ...current, ...patch }))
    const tl = gsap.timeline({ repeat: -1, paused: true })
    tl.call(() => set({ phase: 'title', count: 0 }))
      .to(counter, { n: total, duration: total * typeSpeed, ease: `steps(${total})`, onUpdate: () => set({ count: Math.round(counter.n) }) })
      .call(() => set({ phase: 'titleHold' })).to({}, { duration: hold })
      .to(ref.current?.querySelector('[data-title]') || {}, { autoAlpha: 0, duration: 0.6 })
    prompts.forEach((prompt, index) => {
      tl.call(() => set({ phase: 'prompt', prompt: index, count: 0 }))
        .set(counter, { n: 0 })
        .to(counter, { n: prompt.length, duration: prompt.length * promptSpeed, ease: `steps(${prompt.length})`, onUpdate: () => set({ count: Math.round(counter.n) }) })
        .to({}, { duration: hold * 0.9 })
        .to(counter, { n: 0, duration: prompt.length * eraseSpeed, ease: `steps(${prompt.length})`, onUpdate: () => set({ count: Math.round(counter.n) }) })
        .to({}, { duration: 0.15 })
    })
    tl.set(ref.current?.querySelector('[data-title]') || {}, { autoAlpha: 1 })
    return onAppReady(() => tl.play())
  }, { scope: ref })

  const onTitle = state.phase === 'title' || state.phase === 'titleHold'
  let start = 0
  const titleLines = lines.map((line, index) => {
    const shown = line.text.slice(0, Math.max(0, state.count - start))
    const caret = onTitle && state.count >= start && (state.count < start + line.text.length || index === lines.length - 1)
    start += line.text.length
    return <span key={index} className={cn('block', line.className)}>{shown || '​'}{caret && !prefersReducedMotion() && <Caret/>}</span>
  })
  const prompt = (prompts[state.prompt] || '').slice(0, onTitle ? 0 : state.count)
  const parts = useMemo(() => prompt.split(highlight), [prompt, highlight])

  return <h1 ref={ref} aria-label={fullText} className={cn('relative mx-auto grid max-w-[760px] text-[clamp(40px,7vw,72px)] font-medium leading-[1.02] tracking-[-.06em] [&>*]:col-start-1 [&>*]:row-start-1', className)}>
    <span aria-hidden="true" className="invisible">{lines.map((line, index) => <span key={index} className="block">{line.text}</span>)}</span>
    <span aria-hidden="true" data-title="" className={onTitle ? '' : 'hidden'}>{titleLines}</span>
    {!onTitle && <span aria-hidden="true" className="flex items-center justify-center px-2 text-[clamp(24px,3.8vw,40px)] font-light leading-[1.18] tracking-[-.035em] text-ink/85">
      <span>{parts.map((part, index) => (index % 2 ? <span key={index} className="text-accent-soft">{part}</span> : <span key={index}>{part}</span>))}<Caret light/></span>
    </span>}
  </h1>
}
