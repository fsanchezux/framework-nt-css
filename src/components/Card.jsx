'use client'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '../lib/cn.js'
import { Counter } from '../motion/Counter.jsx'

// Tarjeta base. interactive: se eleva al pasar el cursor (y se renderiza como botón si hay onClick).
export function Card({ as, interactive, onClick, className, children, ...rest }) {
  const Tag = as || (onClick ? 'button' : 'div')
  return <Tag onClick={onClick} {...(Tag === 'button' ? { type: 'button' } : {})} {...rest}
    className={cn('min-w-0 rounded-2xl border border-ink/[.08] bg-paper p-5 text-left', (interactive || onClick) && 'transition duration-300 ease-nt hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,.6)]', className)}>
    {children}
  </Tag>
}

export const CardHeader = ({ title, description, actions, className }) => <div className={cn('flex items-start justify-between gap-4', className)}>
  <div className="min-w-0"><h3 className="font-semibold tracking-[-.02em]">{title}</h3>{description && <p className="mt-1 text-xs leading-5 text-muted">{description}</p>}</div>
  {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
</div>

// Cifra destacada (Hoopbase StatCard). El valor cuenta hasta su número al aparecer.
export function StatCard({ icon: Icon, label, value, note, accent, onClick, className }) {
  return <Card onClick={onClick} className={cn('group w-full p-4 sm:p-5', className)}>
    <div className="flex items-center justify-between text-ink/35">
      <span className="flex min-w-0 items-center gap-2 truncate text-[10px] font-bold uppercase tracking-[.1em] sm:text-[11px]">{Icon && <Icon size={14}/>}{label}</span>
      {onClick && <ArrowUpRight size={15} className="shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/>}
    </div>
    <p className={cn('mt-4 text-2xl font-semibold tracking-[-.07em] sm:mt-6 sm:text-3xl', accent && 'text-accent-soft')}><Counter value={value}/></p>
    {note && <p className="mt-1 text-xs text-ink/40">{note}</p>}
  </Card>
}
