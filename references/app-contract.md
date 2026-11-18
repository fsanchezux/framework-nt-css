# Contrato de `<NtApp>` (slots)

Versión del contrato: **1** (`src/contract.js`). Toda plantilla recibe exactamente estas props y debe
colocar todos los slots. El proyecto no sabe qué plantilla hay: solo rellena slots.

| Slot | Tipo | Qué es |
|---|---|---|
| `brand` | `{ name, highlight?, logo?, onClick? }` | Marca. `highlight` pinta en acento esa parte del nombre (`esm[ai]x`). `logo`: URL o JSX. |
| `modes` + `mode` + `onModeChange(id)` | `[{ id, label, icon, badge? }]` | Entornos de primer nivel (Hoopbase: Análisis / Entrenador / Calendario). Opcional. |
| `nav` + `activeId` + `onNavigate(id, item)` | `[{ id, label?, collapsible?, defaultOpen?, action?, empty?, items }]` | Navegación por apartados. `items: [{ id, label, icon?, meta?, badge?, onSelect? }]`. `action: { label, icon, onClick }` = botón "+" del apartado. |
| `panel` | JSX | Contenido libre de la navegación (lista de conversaciones, filtros…). |
| `footer` | JSX | Pie de la navegación (selector de liga, equipo…). |
| `user` | `{ name, avatar?, meta?, menu?: [{ label, icon, onSelect, danger? } \| 'divider'] }` | Cuenta. |
| `actions` | JSX | Acciones globales (arriba a la derecha). |
| `children` | JSX | La página activa (siempre `<Page>`). |
| `ready` | boolean | `false` mientras cargan los datos iniciales: la precarga espera. |
| `template` | string | Fuerza una plantilla (normalmente no se usa: va en `nt.config.json`). |

## Ejemplo completo (forma de Hoopbase)

```jsx
import { CalendarDays, ClipboardPen, FolderPlus, MessageSquare, Plus, Settings, LogOut } from 'lucide-react'
import { NtApp, useHashRoute } from 'framework-nt-css'

const MODES = [
  { id: 'analysis', label: 'Análisis', icon: MessageSquare },
  { id: 'board', label: 'Entrenador', icon: ClipboardPen },
  { id: 'calendar', label: 'Calendario', icon: CalendarDays, badge: hasImportantGames }
]

export function App() {
  const [route, navigate] = useHashRoute('home')
  const [mode, setMode] = useState('analysis')
  const nav = mode === 'board'
    ? [{ id: 'plays', label: 'Jugadas', action: { label: 'Nueva jugada', icon: Plus, onClick: newPlay }, items: plays.map(toItem) }]
    : [{ id: 'spaces', label: 'Espacios', collapsible: true, action: { label: 'Nueva carpeta', icon: FolderPlus, onClick: newFolder }, items: folders }]

  return <NtApp ready={!loading}
    brand={{ name: 'esmaix', highlight: 'ai', logo: logoUrl, onClick: () => navigate('home') }}
    modes={MODES} mode={mode} onModeChange={setMode}
    nav={nav} activeId={route.view} onNavigate={(id) => navigate(id)}
    panel={<ConversationList/>}
    footer={<LeagueSwitcher/>}
    user={{ name: user.name, avatar: user.photo, menu: [{ label: 'Ajustes', icon: Settings, onSelect: openSettings }, 'divider', { label: 'Salir', icon: LogOut, danger: true, onSelect: logout }] }}>
    <CurrentPage key={route.view}/>
  </NtApp>
}
```

## Reglas
- La navegación es **datos**, no JSX: así una plantilla puede pintarla como lista vertical, pastilla o cajón.
- `panel`/`footer`/`actions` son JSX, pero deben construirse con componentes del framework (se verán bien en cualquier plantilla).
- Usa `key` en la página para que se remonte y repita su animación de entrada al navegar.
- Router: `useHashRoute` vale para empezar; cualquier router sirve (solo hay que pasar `activeId` y `onNavigate`).
- Opciones por plantilla: `nt.config.json → templateOptions.<id>` (ver `options` en cada `template.json`).
