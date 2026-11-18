# Plantillas (formatos)

Una plantilla = una carpeta `templates/<id>/` con dos archivos. Se descubre sola (no hay registro manual):

```
templates/<id>/
├─ template.json   manifiesto: lo leen el CLI, el agente (para preguntar al usuario) y el studio
└─ Shell.jsx       layout: export default function Shell(props del contrato + options)
```

Crear una: `node scripts/nt.mjs new-template <id> --from sidebar --name "Mi plantilla"`.

## template.json

```json
{
  "id": "navbar-center",               // kebab-case, igual que la carpeta
  "name": "Navbar centrada",           // lo que ve el usuario
  "version": "1.0.0",
  "contract": 1,                       // versión del contrato de slots (src/contract.js)
  "description": "…",                  // 1-3 frases: el agente la enseña al preguntar. Di para qué sirve.
  "bestFor": ["…"],
  "layout": "topbar-center",           // etiqueta libre
  "mobile": "…",                       // cómo se comporta en el móvil
  "slots": {                           // OBLIGATORIO: dónde va CADA slot (brand, modes, nav, panel, footer, user, actions, content)
    "brand": "Cabecera, izquierda.", "…": "…"
  },
  "options": {                         // opciones que acepta (nt.config.json → templateOptions.<id>)
    "contentWidth": { "type": "number", "default": 1180, "description": "…" }
  },
  "motion": "…"                        // describe su animación de entrada
}
```

`nt doctor` falla si falta algún slot en `slots`, si `contract` no coincide, si no hay `Shell.jsx` o si la carpeta no se llama como el id.

## Shell.jsx — checklist

1. **Coloca todos los slots.** Lo que no quepa en la vista principal va a un `<Drawer>` (ver `navbar-center`). Nunca descartes un slot:
   es lo que garantiza que migrar no pierde nada.
2. **Solo tokens de color** (`bg-sidebar`, `bg-paper/80`, `border-ink/[.07]`…). Nada de hex.
3. **Reutiliza piezas**: `BrandLogo`, `NavSection`, `NavItem`, `SegmentedControl`, `Drawer`, `UserButton`, `Menu`.
4. **Fondo**: `{options.gradient !== false && <div className="nt-gradient pointer-events-none fixed inset-0 -z-10"/>}`.
5. **Contenido**: `<main className="mx-auto px-5 lg:px-8" style={{ maxWidth: options.contentWidth || 1180 }}>{children}</main>`.
6. **Móvil**: la navegación debe ser accesible por debajo de `lg` (cajón o segunda fila).
7. **Animación de entrada obligatoria** (tras la precarga) con este patrón:

```jsx
useGSAP((context, contextSafe) => {
  if (prefersReducedMotion()) return undefined
  gsap.set('[data-nt-shell="aside"]', { autoAlpha: 0, x: -28 })       // estado inicial (antes de pintar)
  return onAppReady(contextSafe(() => {                                // al acabar la precarga
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .to('[data-nt-shell="aside"]', { autoAlpha: 1, x: 0, duration: 0.8 })
  }))
}, { scope: root })
```
   - Marca los elementos con `data-nt-shell="…"` y los ítems escalonables con `data-nt-item`.
   - No anides `gsap.matchMedia()` dentro de `useGSAP` (provoca recursión de contextos); usa `prefersReducedMotion()`.
8. Pon `data-nt-template="<id>"` en el elemento raíz.
9. Lee las opciones de `props.options` con valores por defecto, y declara cada una en `template.json → options`.

## Probar
- Studio: `node scripts/nt.mjs theme` → selector *Plantilla* (en vivo, con datos de ejemplo de Hoopbase).
- Cualquier proyecto en dev: añade `?nt-template=<id>` a la URL.
- `node scripts/nt.mjs doctor`.

## Ideas de plantillas
`navbar-center` (hecha), `sidebar-right`, `rail` (barra de iconos estrecha + panel), `split` (dos columnas), `minimal` (sin navegación, landing),
`dock` (navegación flotante abajo, estilo macOS).
