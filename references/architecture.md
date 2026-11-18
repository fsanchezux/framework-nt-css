# Arquitectura

```
framework-nt-css/                     ← este repo = el skill = el paquete npm "framework-nt-css"
├─ SKILL.md / AGENTS.md / CLAUDE.md   ← instrucciones para agentes (estándar Agent Skills + AGENTS.md)
├─ scripts/nt.mjs                     ← CLI sin dependencias
├─ templates/<id>/                    ← PLANTILLAS: template.json (manifiesto) + Shell.jsx (layout)
├─ themes/<id>.json                   ← TEMAS: colores por token
├─ src/
│  ├─ index.js                        ← API pública (lo que importa un proyecto)
│  ├─ NtApp.jsx                       ← raíz: elige plantilla + precarga
│  ├─ templates.js                    ← registro automático (import.meta.glob de templates/*)
│  ├─ contract.js                     ← contrato de slots (lo validan CLI y doctor)
│  ├─ theme/tokens.js                 ← tokens de color (fuente única, Node + navegador)
│  ├─ theme/runtime.js                ← applyTheme() en vivo
│  ├─ motion/                         ← GSAP: Preloader, Reveal, Loadable, Counter, Typewriter, ready.js
│  ├─ components/                     ← UI (estilo RareUI: cn(), variantes, lucide)
│  ├─ styles/index.css                ← Tailwind v4 + tokens → utilidades (bg-paper, text-ink/45…)
│  ├─ vite/plugin.js                  ← plugin para proyectos
│  └─ node/catalog.js                 ← lectura de plantillas/temas/configs (CLI + plugin)
├─ studio/                            ← app de muestra + Theme Studio (vite --config studio/vite.config.js)
└─ starter/                           ← esqueleto de proyecto que copia `nt init`
```

## Un proyecto

```
mi-app/
├─ nt.config.json      { "template": "sidebar", "theme": "esmaix", "app": { "name": "Mi app" }, "templateOptions": {} }
├─ vite.config.js      plugins: [nt()]          ← nada más
├─ src/main.jsx        import 'framework-nt-css/styles.css'
├─ src/App.jsx         <NtApp brand nav modes user …>{página}</NtApp>
└─ src/pages/*.jsx     <Page><PageTitle/>…</Page>
```

`package.json` depende de `"framework-nt-css": "file:<ruta al framework>"`: npm crea un **enlace**, así que
cualquier cambio en el framework se ve al instante en todos los proyectos (no hay copias del estilo).

## Flujo de arranque

1. **Vite** carga `nt()` (de `src/vite/plugin.js`), que añade React + Tailwind v4 y:
   - lee `nt.config.json` y resuelve el tema (`themes/<id>.json` + `themeOverrides` + valores por defecto),
   - inyecta en `index.html`: `<style id="nt-theme">:root{--nt-*}</style>` (sin parpadeo), `theme-color`,
     la clase `nt-js` y la pantalla de arranque `#nt-boot`,
   - expone `virtual:nt-config` (config + tema resuelto + lista de plantillas),
   - deduplica React/GSAP (una sola copia aunque el framework esté enlazado),
   - recarga la app si cambian `nt.config.json` o un tema.
2. `styles/index.css` hace `@import "tailwindcss"` **desde el framework** y escanea con `@source` el código del framework.
   El proyecto se escanea solo (detección automática de Tailwind v4).
3. `<NtApp>` elige la plantilla (`prop template` > `?nt-template=` en dev > `nt.config.json`) y monta `<Preloader>`.
4. `<Preloader>` espera fuentes + `ready` + un mínimo, saca `#nt-boot` con GSAP y marca la app como lista (`ready.js`).
5. La plantilla y cada `<Page>`/`<Reveal>` lanzan sus animaciones de entrada al recibir `onAppReady`.

## Por qué migrar es trivial

El proyecto nunca pinta layout: pasa **slots** (datos + JSX) a `<NtApp>`. Toda plantilla está obligada (por
`template.json → slots` y `nt doctor`) a colocar **todos** los slots. Cambiar `template` en `nt.config.json`
cambia el layout entero sin perder nada. Ver `app-contract.md` y `migration.md`.

## Por qué los colores son intercambiables

Los componentes solo usan utilidades de token (`bg-paper`, `text-ink/45`…). Tailwind las compila a
`var(--nt-paper)` etc. (`@theme inline`), y el tema solo define esas variables. Cambiar tema = cambiar variables,
también en vivo (`applyTheme`), que es lo que hace el Theme Studio.
