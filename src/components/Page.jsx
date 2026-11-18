'use client'
import { cn } from '../lib/cn.js'
import { Reveal } from '../motion/Reveal.jsx'

// Contenedor de TODA página. Sus hijos directos entran escalonados (y otra vez al cambiar de página, porque se remonta).
export function Page({ className, children, ...rest }) {
  return <Reveal className={cn('pb-20', className)} {...rest}>{children}</Reveal>
}

// Cabecera de página de Hoopbase: antetítulo en mayúsculas, título grande con tracking apretado, descripción y acciones.
// media: imagen/avatar opcional a la izquierda del título.
export function PageTitle({ eyebrow, title, description, media, actions, children, className }) {
  return <div className={cn('border-b border-ink/[.08] pb-6 pt-10 sm:pb-8 sm:pt-14 lg:pt-20', className)}>
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div className="flex min-w-0 items-end gap-4 sm:gap-6">
        {media}
        <div className="min-w-0">
          {eyebrow && <p className="mb-3 text-[11px] font-bold uppercase tracking-[.16em] text-ink/35">{eyebrow}</p>}
          <h1 className="break-words text-[34px] font-semibold leading-[1.05] tracking-[-.07em] sm:text-5xl">{title}</h1>
          {description && <p className="mt-3 max-w-xl text-sm leading-6 text-muted">{description}</p>}
        </div>
      </div>
      {(actions || children) && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}{children}</div>}
    </div>
  </div>
}

// Bloque de contenido con título pequeño.
export function Section({ title, description, actions, className, children }) {
  return <section className={cn('mt-10', className)}>
    {(title || actions) && <div className="mb-4 flex items-end justify-between gap-4">
      <div>{title && <h2 className="text-lg font-semibold tracking-[-.04em]">{title}</h2>}{description && <p className="mt-1 text-xs text-muted">{description}</p>}</div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>}
    {children}
  </section>
}

// Rejilla responsive para cards: <Grid cols={4}>…</Grid>
const COLS = { 1: 'grid-cols-1', 2: 'grid-cols-1 sm:grid-cols-2', 3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3', 4: 'grid-cols-2 lg:grid-cols-4' }
export const Grid = ({ cols = 3, className, children }) => <div className={cn('grid gap-3 sm:gap-4', COLS[cols], className)}>{children}</div>
