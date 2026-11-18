---
name: framework-nt-css
description: >-
  Shared UI framework (React + Tailwind CSS v4 + GSAP) to create and restyle web apps with the Hoopbase structure.
  Use it whenever the user wants to create a new web project/app/dashboard, choose or change a layout template
  ("plantilla", "formato", sidebar, navbar centrada), pick or edit the color scheme ("colores", "tema", "theme"),
  migrate a project to another template, create a new template, or build pages/components in a project that
  depends on framework-nt-css. Crear proyecto nuevo, elegir plantilla, elegir colores, migrar plantilla, crear plantilla.
license: Proprietary
compatibility: Needs Node.js >= 20.19 and npm. Works with any agent that can run shell commands (Claude Code, Codex, Gemini CLI, Cursor, Copilot…).
metadata:
  version: "0.1.0"
  base-ui: hoopbase
  stack: "react 19, tailwindcss 4, gsap 3, vite 8, lucide-react"
---

# framework-nt-css

Framework de UI compartido. **El estilo de todos los proyectos vive aquí**: plantillas (layouts), temas
(colores), componentes y animaciones. Un proyecto solo aporta sus páginas y su navegación como datos.
Cambiar algo aquí cambia todos los proyectos; cambiar de plantilla o de tema es editar una línea.

`<skill>` = la carpeta que contiene este archivo. El CLI es `node <skill>/scripts/nt.mjs` (sin dependencias).
Si las dependencias del framework no están instaladas (`<skill>/node_modules` no existe), ejecuta antes `npm install` en `<skill>`.

## Qué hacer según la petición

### 1. Crear un proyecto nuevo
1. Lee las opciones: `node <skill>/scripts/nt.mjs templates --json` y `node <skill>/scripts/nt.mjs themes --json`.
2. **Pregunta al usuario** (no elijas tú) qué plantilla quiere: enséñale `name` + `description` de cada una.
   La plantilla por defecto es `sidebar` (estructura de Hoopbase).
3. **Pregunta qué tema de colores** quiere, enseñando `name` + `description` de cada tema, y ofrece una opción extra:
   "crear uno nuevo en el Theme Studio" (paso 5).
4. Crea el proyecto: `node <skill>/scripts/nt.mjs init <dir> --template <id> --theme <id> --name "<Nombre>" --install`.
   Si ejecutas `init` sin `--template`/`--theme` sale con código 2 y un JSON con las opciones: úsalo para preguntar.
5. Si quiere colores propios: `node <skill>/scripts/nt.mjs theme --project <dir>` (proceso largo: lánzalo en segundo plano).
   Dile que abra `http://localhost:5180`, cambie cada color viendo la app en vivo y pulse **Guardar tema** y luego **Usar en <proyecto>**.
6. Construye las páginas siguiendo las **Reglas** de abajo. Arranca con `npm run dev` en el proyecto.

### 2. Cambiar los colores de un proyecto (o crear un tema)
- Editor visual: `node <skill>/scripts/nt.mjs theme [--project <dir>]` → panel con un selector por token, vista previa en vivo,
  aviso de contraste (AA), **Guardar tema** (escribe `themes/<id>.json`) y **Usar en el proyecto** (escribe su `nt.config.json`).
- Sin interfaz: `nt new-theme <id> --from esmaix` y edita `themes/<id>.json` (formato en `references/themes.md`).
- Aplicar un tema existente: `nt migrate <dir> --theme <id>`.

### 3. Migrar un proyecto a otra plantilla
`nt migrate <dir> --template <id> --dry-run` (enseña al usuario dónde acaba cada slot) → sin `--dry-run` para aplicarlo.
Solo cambia `nt.config.json`; el código del proyecto no se toca. Detalles: `references/migration.md`.

### 4. Crear o editar una plantilla
`nt new-template <id> --from sidebar --name "<Nombre>"` → edita `templates/<id>/Shell.jsx` y `template.json`
siguiendo `references/templates.md` → `nt doctor` (debe decir "Todo correcto") → pruébala en el studio (selector *Plantilla*).

### 5. Trabajar en las páginas de un proyecto existente
Lee el `AGENTS.md` del proyecto y `references/components.md`. Valida al acabar con `nt doctor <dir>`.

## Reglas (obligatorias en los proyectos)

1. **Nada de CSS en el proyecto.** Ni `.css` propios, ni `tailwind.config`, ni colores hex. Si falta algo visual, se añade
   al framework (componente, token o plantilla) para que lo hereden todos los proyectos.
2. **Colores solo con tokens**: `bg-canvas`, `bg-paper`, `bg-sidebar`, `text-ink`, `text-ink/45`, `border-ink/[.08]`, `text-muted`,
   `bg-accent`, `text-accent-soft`, `text-on-accent`, `text-success|warning|danger`. Lista completa en `references/themes.md`.
3. **El layout es de la plantilla.** El proyecto pasa a `<NtApp>` los slots (`brand`, `modes`, `nav`, `panel`, `footer`, `user`,
   `actions`, `children`) como datos. Nunca montes sidebar/navbar propias. Contrato: `references/app-contract.md`.
4. **Animación siempre, y siempre de entrada.** Toda página dentro de `<Page>` (sus hijos entran escalonados); todo lo que carga
   datos dentro de `<Loadable loading skeleton>`; la app arranca con la precarga de `<NtApp ready={…}>`. Para animaciones propias,
   importa `gsap`/`useGSAP` desde `framework-nt-css` y espera a `onAppReady`. Reglas: `references/motion.md`.
5. **Componentes del framework primero** (`references/components.md`). Si hace falta uno nuevo (p. ej. adaptado de RareUI),
   se crea en `<skill>/src/components/`, se exporta en `src/index.js` y se documenta.

## Mapa del framework

| Ruta | Qué es |
|---|---|
| `templates/<id>/template.json` + `Shell.jsx` | Plantillas (formatos). Se descubren solas. |
| `themes/<id>.json` | Temas de color. |
| `src/theme/tokens.js` | Lista de tokens de color (fuente única). |
| `src/components/`, `src/motion/` | Componentes y animaciones (GSAP). API pública en `src/index.js`. |
| `src/vite/plugin.js` | Plugin de Vite que usan los proyectos (`framework-nt-css/vite`). |
| `studio/` | Theme Studio: app de muestra + editor de colores en vivo. |
| `starter/` | Esqueleto que copia `nt init`. |
| `scripts/nt.mjs` | CLI. `node scripts/nt.mjs help`. |

## Referencias (lee solo la que necesites)
- `references/architecture.md` — cómo encaja todo (plugin, virtual:nt-config, tokens, plantillas).
- `references/app-contract.md` — los slots de `<NtApp>` con ejemplos.
- `references/templates.md` — crear una plantilla: checklist, animaciones, opciones.
- `references/themes.md` — tokens, formato del tema, Theme Studio.
- `references/components.md` — catálogo de componentes y cómo adaptar componentes de RareUI.
- `references/motion.md` — reglas de animación y patrones GSAP.
- `references/migration.md` — migrar entre plantillas y traer apps existentes (p. ej. Hoopbase) al framework.
