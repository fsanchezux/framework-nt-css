import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Convención RareUI / shadcn: combina clases condicionales y resuelve conflictos de Tailwind
// (cn('px-4', props.className) deja ganar al className del proyecto).
export const cn = (...inputs) => twMerge(clsx(inputs))
