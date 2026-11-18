'use client'
import { X } from 'lucide-react'
import { cn } from '../lib/cn.js'

const TONES = {
  neutral: 'bg-ink/[.07] text-ink/60',
  accent: 'bg-accent/15 text-accent-soft',
  solid: 'bg-accent text-on-accent',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger'
}

export function Badge({ tone = 'neutral', icon: Icon, className, children }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.06em]', TONES[tone], className)}>
    {Icon && <Icon size={11}/>}{children}
  </span>
}

const NOTICE = { success: 'bg-success/20 text-success', warning: 'bg-warning/15 text-warning', danger: 'bg-danger/15 text-danger' }

// Aviso en línea (éxito / aviso / error) como el de Hoopbase.
export function Notice({ tone = 'success', onClose, className, children }) {
  return <div role="status" className={cn('flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm', NOTICE[tone], className)}>
    <span>{children}</span>
    {onClose && <button type="button" onClick={onClose} aria-label="Cerrar" className="opacity-70 hover:opacity-100"><X size={16}/></button>}
  </div>
}
