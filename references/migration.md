# Migración

## Entre plantillas (proyecto ya en el framework)

```bash
node <skill>/scripts/nt.mjs migrate <dir> --template navbar-center --dry-run   # enseña dónde va cada slot
node <skill>/scripts/nt.mjs migrate <dir> --template navbar-center             # escribe nt.config.json
node <skill>/scripts/nt.mjs migrate <dir> --theme midnight                     # solo el tema
```

- Solo cambia `nt.config.json`. El servidor de desarrollo se recarga solo.
- Es reversible: vuelve a ejecutar con la plantilla anterior.
- `templateOptions` de la plantilla anterior se conservan (no molestan) y se avisa si la nueva no las usa.
- Previsualizar sin cambiar nada: `?nt-template=<id>` en la URL de desarrollo, o el selector *Plantilla* del studio.
- Si la plantilla nueva no cumple el contrato (`nt doctor`), `migrate` se niega.

## Actualizar el framework en los proyectos
Los proyectos enlazan el framework (`file:`), así que ven los cambios al instante. Si el framework sube versiones
de React/GSAP/etc.: `nt doctor <dir>` lo avisa y `nt sync <dir>` + `npm install` lo alinea.

## Traer una app existente (p. ej. Hoopbase) al framework
Mapa de Hoopbase → framework:

| Hoopbase | Framework |
|---|---|
| `tailwind.config.js` (ink/paper/canvas/sidebar como `rgb(var())`) | tokens en `styles/index.css` (mismos nombres + accent, muted, estados) |
| `styles.css` `.brand-gradient` | `.nt-gradient` (tokens `glow-*`) |
| `#ff6129` / `#ff7145` / `#fc3b00` | `accent` / `accent-soft` / `accent-strong` |
| `modes.js` `MODES` | slot `modes` |
| `Sidebar.jsx` + `SidebarModes.jsx` | plantilla `sidebar` + slots `nav` / `panel` |
| `ModeTabs` | `SegmentedControl floating` (lo pone la plantilla) |
| `sidebarFooter` (liga, equipo, cuenta) | slots `footer` + `user` |
| `ui.jsx` `PageTitle`, `PlayerAvatar`, `BrandLogo` | `PageTitle`, `Avatar`, `BrandLogo` |
| `StatCard`, `EmptyPanel` (main.jsx) | `StatCard`, `EmptyState` |
| `HeroTitle.jsx` | `Typewriter` |
| `Menu`, `MenuItem`, `IconButton` (Sidebar.jsx) | `Menu`, `MenuItem`, `IconButton` |

Pasos:
1. `nt init` en una carpeta nueva (o añade `framework-nt-css` + `vite.config` con `nt()` a la app existente).
2. Borra `tailwind.config.js`, `postcss.config.js` y el CSS propio; importa `framework-nt-css/styles.css`.
3. Sustituye el layout de `App` por `<NtApp>` con los slots (ver tabla).
4. Sustituye colores hex por tokens (`nt doctor <dir>` los detecta).
5. Envuelve cada vista en `<Page>` y cada carga en `<Loadable>`.
