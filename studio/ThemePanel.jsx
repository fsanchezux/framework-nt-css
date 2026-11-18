import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Copy, LayoutTemplate, Palette, RotateCcw, Save, Send, X } from 'lucide-react'
import ntConfig from 'virtual:nt-config'
import { applyTheme, gsap, resolveTheme, TOKEN_GROUPS, TOKENS, useGSAP } from '../src/index.js'

// Panel del Theme Studio. Tiene estilo PROPIO (zinc, no los tokens) para que siga siendo legible
// aunque el tema que estás editando sea ilegible.
// - Cada token tiene selector de color + hex: cambia la página en vivo.
// - Guardar → escribe themes/<id>.json en el framework (POST /__nt/themes).
// - Si el studio se abrió con --project, "Usar en el proyecto" escribe el tema/plantilla en su .nt/nt.config.json.

const luminance = (hex) => {
  const value = hex.replace('#', '')
  const full = value.length === 3 ? value.split('').map((char) => char + char).join('') : value.slice(0, 6)
  const [r, g, b] = [0, 2, 4].map((index) => parseInt(full.slice(index, index + 2), 16) / 255)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }
const slug = (text) => text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'mi-tema'

function ContrastPill({ label, fg, bg }) {
  const ratio = contrast(fg, bg)
  const pass = ratio >= 4.5
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${pass ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
    {label} {ratio.toFixed(1)} {pass ? 'AA' : '⚠'}
  </span>
}

export function ThemePanel({ template, onTemplate, palette = [] }) {
  // Token que recibe el color al pulsar una muestra de la paleta del proyecto.
  const [active, setActive] = useState('accent')
  const [open, setOpen] = useState(() => new URLSearchParams(window.location.search).get('panel') !== 'closed')
  const [themes, setThemes] = useState([])
  const [project, setProject] = useState(null)
  const [theme, setTheme] = useState(() => ntConfig.resolvedTheme)
  const [name, setName] = useState('Mi tema')
  const [status, setStatus] = useState(null)
  const panel = useRef(null)

  useEffect(() => {
    fetch('/__nt/themes').then((res) => res.json()).then((data) => setThemes(data.themes || [])).catch(() => {})
    fetch('/__nt/project').then((res) => res.json()).then((data) => setProject(data.project)).catch(() => {})
  }, [])

  // Cada cambio se aplica en vivo a toda la página.
  useEffect(() => { applyTheme(theme) }, [theme])

  useGSAP(() => {
    if (!panel.current) return
    gsap.fromTo(panel.current, { x: 40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out' })
    gsap.from(panel.current.querySelectorAll('[data-row]'), { autoAlpha: 0, y: 8, stagger: 0.015, duration: 0.4, delay: 0.1 })
  }, { dependencies: [open] })

  const setColor = (key, value) => setTheme((current) => ({ ...current, colors: { ...current.colors, [key]: value } }))
  const loadPreset = (id) => {
    const preset = themes.find((item) => item.id === id)
    if (!preset) return
    setTheme(resolveTheme(preset))
    setName(preset.name)
  }
  const id = slug(name)
  const exported = useMemo(() => ({ id, name, scheme: theme.scheme, colors: theme.colors, font: theme.font, radius: theme.radius }), [id, name, theme])

  const flash = (text, tone = 'ok') => { setStatus({ text, tone }); setTimeout(() => setStatus(null), 3500) }
  const save = async () => {
    const res = await fetch('/__nt/themes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(exported) })
    const data = await res.json()
    if (!res.ok) return flash(data.error || 'No se pudo guardar', 'error')
    const list = await fetch('/__nt/themes').then((r) => r.json())
    setThemes(list.themes || [])
    return flash(`Guardado en ${data.file}`)
  }
  const useInProject = async () => {
    const saved = await fetch('/__nt/themes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(exported) })
    if (!saved.ok) return flash('Guarda un tema válido primero', 'error')
    const res = await fetch('/__nt/project', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ theme: id, template }) })
    return res.ok ? flash(`${project.name} usa ahora "${id}" + "${template}"`) : flash('No se pudo escribir .nt/nt.config.json', 'error')
  }
  const copy = async () => { await navigator.clipboard.writeText(JSON.stringify(exported, null, 2)); flash('JSON copiado') }

  if (!open) return <button type="button" onClick={() => setOpen(true)} aria-label="Abrir el editor de colores"
    className="fixed bottom-5 right-5 z-[100] grid h-12 w-12 place-items-center rounded-full bg-zinc-950 text-zinc-100 shadow-2xl ring-1 ring-white/10 transition hover:scale-105"><Palette size={20}/></button>

  const input = 'w-full rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 outline-none focus:border-white/30'
  return <aside ref={panel} aria-label="Editor de tema" style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
    className="fixed bottom-3 right-3 top-3 z-[100] flex w-[min(340px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl bg-zinc-950/95 text-zinc-100 shadow-[0_30px_80px_rgba(0,0,0,.6)] ring-1 ring-white/10 backdrop-blur-xl">
    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
      <div className="flex items-center gap-2"><Palette size={16} className="text-zinc-400"/><span className="text-sm font-semibold">Theme Studio</span></div>
      <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar el editor" className="rounded-md p-1 text-zinc-400 hover:bg-white/10 hover:text-white"><X size={16}/></button>
    </div>

    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
      <div data-row="" className="grid grid-cols-2 gap-2">
        <label className="text-[11px] text-zinc-400">Plantilla
          <select value={template} onChange={(event) => onTemplate(event.target.value)} className={`${input} mt-1`}>
            {ntConfig.templates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="text-[11px] text-zinc-400">Partir de
          <select value="" onChange={(event) => loadPreset(event.target.value)} className={`${input} mt-1`}>
            <option value="" disabled>Tema…</option>
            {themes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
      </div>

      <div data-row="" className="grid grid-cols-[1fr_auto] items-end gap-2">
        <label className="text-[11px] text-zinc-400">Nombre del tema
          <input value={name} onChange={(event) => setName(event.target.value)} className={`${input} mt-1`}/>
        </label>
        <div className="flex rounded-lg bg-zinc-900 p-0.5 ring-1 ring-white/10">
          {['dark', 'light'].map((scheme) => <button key={scheme} type="button" onClick={() => setTheme({ ...theme, scheme })}
            className={`rounded-md px-2 py-1 text-[11px] ${theme.scheme === scheme ? 'bg-white text-zinc-900' : 'text-zinc-400'}`}>{scheme === 'dark' ? 'Oscuro' : 'Claro'}</button>)}
        </div>
      </div>
      <p data-row="" className="-mt-3 text-[10px] text-zinc-500">Se guardará como <code className="text-zinc-300">themes/{id}.json</code></p>

      <div data-row="" className="flex flex-wrap gap-1.5">
        <ContrastPill label="Texto" fg={theme.colors.ink} bg={theme.colors.canvas}/>
        <ContrastPill label="Tarjeta" fg={theme.colors.ink} bg={theme.colors.paper}/>
        <ContrastPill label="Botón" fg={theme.colors['on-accent']} bg={theme.colors.accent}/>
      </div>

      {palette.length > 0 && <div data-row="">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[.14em] text-zinc-500">Colores del proyecto</p>
        <div className="flex flex-wrap gap-1.5">
          {palette.map(({ value, count }) => <button key={value} type="button" onClick={() => setColor(active, value)} title={`${value} · ${count} usos → ${active}`}
            aria-label={`Usar ${value} en ${active}`} className="h-6 w-6 rounded-md ring-1 ring-white/15 transition hover:scale-110" style={{ background: value }}/>)}
        </div>
        <p className="mt-1.5 text-[10px] text-zinc-500">Pulsa una muestra para asignarla a <code className="text-zinc-300">{active}</code> (elige el token en la lista).</p>
      </div>}

      {TOKEN_GROUPS.map((group) => <div key={group.id}>
        <p data-row="" className="mb-2 text-[10px] font-bold uppercase tracking-[.14em] text-zinc-500">{group.label}</p>
        <div className="space-y-1.5">
          {TOKENS.filter((token) => token.group === group.id).map((token) => <label key={token.key} data-row="" title={token.hint} onPointerDown={() => setActive(token.key)} onFocus={() => setActive(token.key)}
            className={`flex items-center gap-2.5 rounded-lg px-1.5 py-1 hover:bg-white/5 ${palette.length && active === token.key ? 'bg-white/[.07] ring-1 ring-white/10' : ''}`}>
            <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md ring-1 ring-white/15" style={{ background: theme.colors[token.key] }}>
              <input type="color" value={theme.colors[token.key].slice(0, 7)} onChange={(event) => setColor(token.key, event.target.value)} aria-label={token.label}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"/>
            </span>
            <span className="min-w-0 flex-1"><span className="block truncate text-xs text-zinc-200">{token.label}</span><span className="block text-[10px] text-zinc-500">{token.key}</span></span>
            <input value={theme.colors[token.key]} onChange={(event) => setColor(token.key, event.target.value)} spellCheck={false}
              className="w-[78px] rounded-md border border-white/10 bg-zinc-900 px-1.5 py-1 font-mono text-[11px] text-zinc-200 outline-none focus:border-white/30"/>
          </label>)}
        </div>
      </div>)}

      <label data-row="" className="block text-[11px] text-zinc-400">Tipografía (CSS font-family)
        <input value={theme.font} onChange={(event) => setTheme({ ...theme, font: event.target.value })} className={`${input} mt-1 font-mono`}/>
      </label>
    </div>

    <div className="space-y-2 border-t border-white/10 p-3">
      {status && <p className={`flex items-center gap-1.5 text-[11px] ${status.tone === 'error' ? 'text-amber-300' : 'text-emerald-300'}`}><Check size={12}/>{status.text}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={save} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-200"><Save size={14}/> Guardar tema</button>
        <button type="button" onClick={copy} aria-label="Copiar JSON" title="Copiar JSON" className="rounded-lg px-2.5 text-zinc-300 ring-1 ring-white/10 hover:bg-white/10"><Copy size={14}/></button>
        <button type="button" onClick={() => setTheme(ntConfig.resolvedTheme)} aria-label="Deshacer cambios" title="Deshacer cambios" className="rounded-lg px-2.5 text-zinc-300 ring-1 ring-white/10 hover:bg-white/10"><RotateCcw size={14}/></button>
      </div>
      {project && <button type="button" onClick={useInProject} className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-100 ring-1 ring-white/10 hover:bg-zinc-700">
        <Send size={13}/> Usar en <span className="truncate font-mono">{project.name}</span> <LayoutTemplate size={13} className="text-zinc-400"/>
      </button>}
    </div>
  </aside>
}
