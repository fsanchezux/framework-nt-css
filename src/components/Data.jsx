'use client'
import { useState } from 'react'
import { cn } from '../lib/cn.js'
import { Reveal } from '../motion/Reveal.jsx'

// Avatar: foto o, si no hay/no carga, la inicial sobre un color.
const AVATAR_SIZES = { xs: 'h-6 w-6 text-[10px]', sm: 'h-8 w-8 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-20 w-20 text-2xl sm:h-24 sm:w-24' }
export function Avatar({ src, name = '?', color, size = 'sm', className }) {
  const [failed, setFailed] = useState(false)
  const box = cn(AVATAR_SIZES[size], 'shrink-0 overflow-hidden rounded-full', className)
  if (src && !failed) return <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className={cn(box, 'bg-ink/[.06] object-cover object-top')}/>
  return <span aria-hidden="true" className={cn(box, 'grid place-items-center font-bold text-white', !color && 'bg-accent text-on-accent')} style={color ? { backgroundColor: color } : undefined}>{String(name)[0]?.toUpperCase()}</span>
}

// Panel vacío con el degradado de marca (Hoopbase EmptyPanel).
export function EmptyState({ eyebrow = 'Sin datos', title, text, action, className }) {
  return <div className={cn('nt-gradient flex min-h-[230px] flex-col justify-center rounded-2xl p-6 text-ink sm:p-8', className)}>
    <p className="text-[11px] font-bold uppercase tracking-[.16em] text-accent">{eyebrow}</p>
    <h2 className="mt-3 text-2xl font-semibold tracking-[-.05em]">{title}</h2>
    {text && <p className="mt-3 max-w-xs text-sm leading-6 text-ink/55">{text}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
}

// Tabla simple. columns: [{ key, label, align, render(row) }] · rows: [] · onRowClick(row)
// Las filas entran escalonadas (y al hacer scroll si la tabla es larga).
export function Table({ columns, rows, onRowClick, rowKey = 'id', className, empty = 'Nada que mostrar.' }) {
  return <div className={cn('overflow-x-auto rounded-2xl border border-ink/[.08] bg-paper', className)}>
    <table className="min-w-full text-left text-sm">
      <thead><tr className="border-b border-ink/[.08]">
        {columns.map((column) => <th key={column.key} className={cn('whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-[.08em] text-ink/40', column.align === 'right' && 'text-right')}>{column.label}</th>)}
      </tr></thead>
      <Reveal as="tbody" y={8} stagger={0.03} scroll={rows.length > 12}>
        {rows.map((row, index) => <tr key={row[rowKey] ?? index} onClick={onRowClick ? () => onRowClick(row) : undefined}
          className={cn('border-b border-ink/[.05] last:border-0', onRowClick && 'cursor-pointer transition-colors hover:bg-ink/[.03]')}>
          {columns.map((column) => <td key={column.key} className={cn('whitespace-nowrap px-4 py-3 text-ink/75', column.align === 'right' && 'text-right tabular-nums')}>{column.render ? column.render(row) : row[column.key]}</td>)}
        </tr>)}
      </Reveal>
    </table>
    {!rows.length && <p className="px-4 py-6 text-center text-sm text-ink/40">{empty}</p>}
  </div>
}
