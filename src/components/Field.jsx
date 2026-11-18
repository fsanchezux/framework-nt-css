'use client'
import { forwardRef } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { cn } from '../lib/cn.js'

const base = 'w-full rounded-xl border border-ink/[.1] bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-accent/60 focus:ring-4 focus:ring-accent/15'

export const Label = ({ children, hint, className }) => <span className={cn('mb-1.5 block text-xs font-semibold text-ink/60', className)}>{children}{hint && <span className="ml-1 font-normal text-ink/35">{hint}</span>}</span>

const Wrap = ({ label, hint, className, children }) => (label
  ? <label className={cn('block', className)}><Label hint={hint}>{label}</Label>{children}</label>
  : children)

export const Input = forwardRef(function Input({ label, hint, className, ...rest }, ref) {
  return <Wrap label={label} hint={hint} className={className}><input ref={ref} className={cn(base, !label && className)} {...rest}/></Wrap>
})

export const Textarea = forwardRef(function Textarea({ label, hint, className, rows = 4, ...rest }, ref) {
  return <Wrap label={label} hint={hint} className={className}><textarea ref={ref} rows={rows} className={cn(base, 'resize-y leading-6', !label && className)} {...rest}/></Wrap>
})

// options: ['A', 'B'] o [{ value, label }]
export function Select({ label, hint, options = [], className, ...rest }) {
  return <Wrap label={label} hint={hint} className={className}>
    <span className={cn('relative block', !label && className)}>
      <select className={cn(base, 'appearance-none pr-9')} {...rest}>
        {options.map((option) => (typeof option === 'string'
          ? <option key={option} value={option}>{option}</option>
          : <option key={option.value} value={option.value}>{option.label}</option>))}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/40"/>
    </span>
  </Wrap>
}

// Buscador en pastilla (barra lateral de Hoopbase). Escape borra.
export function SearchField({ value, onChange, placeholder = 'Buscar…', className, ...rest }) {
  return <label className={cn('flex items-center gap-2 rounded-xl bg-ink/[.05] px-3 py-2 text-sm text-ink/45 ring-ink/15 transition focus-within:bg-paper focus-within:ring-1', className)}>
    <Search size={15} className="shrink-0"/>
    <input value={value} onChange={(event) => onChange?.(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') onChange?.('') }} placeholder={placeholder} aria-label={placeholder}
      className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink/40" {...rest}/>
    {value && <button type="button" onClick={() => onChange?.('')} aria-label="Borrar la búsqueda" className="shrink-0 rounded p-0.5 hover:text-ink"><X size={14}/></button>}
  </label>
}
