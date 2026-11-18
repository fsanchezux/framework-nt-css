# Componentes

Todo se importa de `framework-nt-css`. Todos aceptan `className` (se fusiona con `cn()` = clsx + tailwind-merge,
convención de RareUI/shadcn: el `className` del proyecto gana en conflictos).

## Estructura de página
| Componente | Props | Notas |
|---|---|---|
| `Page` | `className`, props de `Reveal` | Raíz de TODA página. Hijos directos entran escalonados. |
| `PageTitle` | `eyebrow, title, description, media, actions` | Cabecera de Hoopbase (antetítulo en mayúsculas + título grande). |
| `Section` | `title, description, actions` | Bloque con título pequeño. |
| `Grid` | `cols` (1-4) | Rejilla responsive. |

## Contenido
| Componente | Props |
|---|---|
| `Card` | `as, interactive, onClick` (con onClick es botón y se eleva al hover) |
| `CardHeader` | `title, description, actions` |
| `StatCard` | `icon, label, value, note, accent, onClick` — la cifra cuenta con GSAP |
| `Table` | `columns: [{ key, label, align, render }], rows, onRowClick, rowKey, empty` — filas escalonadas |
| `Badge` | `tone: neutral|accent|solid|success|warning|danger, icon` |
| `Notice` | `tone: success|warning|danger, onClose` |
| `Avatar` | `src, name, color, size: xs|sm|md|lg` |
| `EmptyState` | `eyebrow, title, text, action` — panel con el degradado de marca |

## Acciones y formularios
| Componente | Props |
|---|---|
| `Button` | `variant: primary|secondary|outline|ghost|danger, size: sm|md|lg, icon, iconRight, loading` — rebote GSAP al pulsar |
| `IconButton` | `label` (obligatorio), `icon, size, active, tooltip: bottom|top|right|false` |
| `Input`, `Textarea` | `label, hint` + props nativas |
| `Select` | `label, options: string[] | {value,label}[]` |
| `SearchField` | `value, onChange(text), placeholder` — Escape borra |
| `SegmentedControl` | `items: [{id,label,icon,badge}], value, onChange, floating, size` — indicador deslizante GSAP |

## Capas
| Componente | Props |
|---|---|
| `Dialog` | `open, onClose, title, description, footer, size: sm|md|lg` — entra/sale con GSAP |
| `Drawer` | `open, onClose, side: left|right, width` |
| `Menu` + `MenuItem`, `MenuLabel`, `MenuDivider` | `anchor` (elemento), `onClose`, `align` |

## Navegación (para plantillas)
`BrandLogo`, `NavItem`, `NavSection`, `UserButton`.

## Animación y carga
`Reveal`, `Loadable`, `Skeleton`, `SkeletonText`, `SkeletonCard`, `Counter`, `Typewriter`, `Preloader` — ver `motion.md`.

## Utilidades
`cn`, `useHashRoute`, `applyTheme`, `useNt()` (plantilla y config activas), `gsap`, `useGSAP`, `ScrollTrigger`, `MOTION`.

## Añadir un componente (o adaptar uno de RareUI)
RareUI (github.com/Codewithswappy/RareUI) es de copiar y pegar: Tailwind + `cn()` + lucide + **Framer Motion**.
Para traer uno al framework:
1. Copia el componente a `src/components/<Nombre>.jsx` (JSX, sin TypeScript).
2. Sustituye `framer-motion` por GSAP (`useGSAP` + `gsap.from/to`; entradas con `onAppReady` si dependen de la carga). No añadas framer-motion.
3. Sustituye colores fijos (`bg-zinc-900`, `text-white`, hex) por tokens (`bg-paper`, `text-ink`, `bg-accent`…).
4. Usa `cn()` de `../lib/cn.js` y respeta `prefersReducedMotion()`.
5. Expórtalo en `src/index.js`, añádelo a la sección *Componentes* del studio (`studio/DemoApp.jsx`) y a esta tabla.
