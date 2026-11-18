# Animación (GSAP)

Regla del framework: **nada aparece de golpe**. Todo tiene precarga y entrada animada, y todo respeta
"reducir movimiento" del sistema (sin animación, contenido visible al momento).

## Capas
1. **Arranque** — el plugin pinta `#nt-boot` en el HTML (antes de JS). `<Preloader>` (dentro de `<NtApp>`) espera
   fuentes + `ready` + 0,65 s, completa la barra, sube la marca y levanta la cortina. Entonces llama a `markAppReady()`.
2. **Plantilla** — al recibir `onAppReady`, la plantilla hace su entrada (barra lateral desde la izquierda, cabecera desde arriba…).
3. **Página** — `<Page>` revela sus hijos directos escalonados. Cambiar de página (con `key`) repite la entrada.
4. **Datos** — `<Loadable loading skeleton>`: skeleton con brillo mientras carga y, al terminar, el contenido entra escalonado.
5. **Micro** — botones con rebote al pulsar, `SegmentedControl` con indicador elástico, `Counter` que cuenta, menús y diálogos que escalan.

## Piezas
| Pieza | Uso |
|---|---|
| `<Reveal selector? scroll? y stagger delay>` | Entrada escalonada de hijos. `scroll` = cada elemento entra al verse (ScrollTrigger.batch). |
| `<Loadable loading skeleton>` | Precarga de cualquier dato asíncrono. |
| `<Skeleton className="h-4 w-32"/>`, `SkeletonText`, `SkeletonCard` | Formas de precarga. |
| `<Counter value={78.4}/>` | Cifra que cuenta tras la precarga. |
| `<Typewriter lines prompts/>` | Título de portada de Hoopbase (escribe, borra, rota preguntas). |
| `onAppReady(fn)`, `useAppReady()` | Esperar al fin de la precarga. |
| `MOTION` | Ritmo común: `fast .25`, `base .55`, `slow .9`, `stagger .06`, `y 18`, `ease 'expo.out'`. |

## Patrón para animaciones propias

```jsx
import { gsap, useGSAP, onAppReady, prefersReducedMotion, MOTION } from 'framework-nt-css'

function Hero() {
  const ref = useRef(null)
  useGSAP((context, contextSafe) => {
    if (prefersReducedMotion()) return undefined
    gsap.set('.hero-line', { autoAlpha: 0, y: 30 })
    return onAppReady(contextSafe(() => gsap.to('.hero-line', { autoAlpha: 1, y: 0, stagger: MOTION.stagger })))
  }, { scope: ref })
  return <div ref={ref}>…</div>
}
```

Reglas:
- Importa GSAP **siempre** desde `framework-nt-css` (plugins registrados y valores por defecto comunes).
- Anima `transform` y `opacity`/`autoAlpha` (no `width/top/left` salvo indicadores pequeños).
- Estado inicial con `gsap.set` dentro de `useGSAP` (corre antes de pintar) → sin parpadeos.
- Callbacks diferidos envueltos en `contextSafe` (se limpian al desmontar).
- No anides `gsap.matchMedia()` dentro de `useGSAP`: usa `prefersReducedMotion()`.
- Duraciones: entrada 0,5–0,9 s, micro 0,12–0,3 s. Easing de salida `expo.out`; de ida y vuelta `power3.inOut`.
- Si el usuario cambia de pestaña antes de que cargue, GSAP pausa (requestAnimationFrame) y sigue al volver: es normal.
