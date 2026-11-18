# Temas y colores

## Tokens

Fuente única: `src/theme/tokens.js`. Cada token es una variable `--nt-<token>` y una utilidad de Tailwind
(`bg-<token>`, `text-<token>`, `border-<token>`, `ring-<token>`…, con opacidad: `text-ink/45`, `border-ink/[.08]`).

| Token | Uso |
|---|---|
| `canvas` | Fondo de página. |
| `sidebar` | Fondo de la navegación (barra lateral / navbar / cajón). |
| `paper` | Tarjetas, paneles, menús, inputs, diálogos. |
| `ink` | Texto y líneas. Jerarquía con opacidad: `ink` (títulos), `ink/70` (filas), `ink/45` (secundario), `ink/35` (antetítulos), `ink/[.08]` (bordes), `ink/[.05]` (hover). |
| `muted` | Texto secundario sólido (descripciones). |
| `accent` | Acción principal, pestaña activa, selección. |
| `accent-strong` | Hover/pressed del acento. |
| `accent-soft` | Iconos activos, menciones, cifras destacadas. |
| `on-accent` | Texto sobre `bg-accent`. |
| `success` · `warning` · `danger` | Estados (con opacidad para fondos: `bg-success/15`). |
| `glow-base` · `glow-deep` · `glow` | Degradado de marca (`.nt-gradient`): base arriba, fondo abajo y brillo. |

Además: `--nt-font` (familia tipográfica, utilidad `font-sans`) y `--nt-radius` (`rounded-nt`).

**Añadir un token**: entrada en `TOKENS` + `DEFAULT_COLORS` (tokens.js) + `--color-<token>: var(--nt-<token>)` en
`@theme inline` y su valor de reserva en `:where(:root)` (styles/index.css) + valor en cada tema.

## Formato de un tema (`themes/<id>.json`)

```json
{
  "$schema": "../references/theme.schema.json",
  "id": "midnight",
  "name": "Midnight",
  "description": "Azul noche con acento eléctrico.",
  "scheme": "dark",
  "colors": { "canvas": "#0b0f17", "paper": "#141a26", "ink": "#eef2fb", "accent": "#4f7cff", "…": "…" },
  "font": "'Helvetica Neue', Helvetica, Arial, sans-serif",
  "radius": "16px"
}
```
Los tokens que falten se rellenan con los del tema `esmaix`. Colores en hex (`#rrggbb`).

## Theme Studio

`node scripts/nt.mjs theme [--project <dir>] [--port 5180]` abre la app de muestra con el panel de tema:
- un selector + campo hex por token; todo cambia **en vivo** (también la plantilla, con el selector *Plantilla*),
- "Partir de" carga un tema existente; claro/oscuro; tipografía,
- avisos de contraste WCAG (texto/fondo, texto/tarjeta, botón) con AA ≥ 4.5,
- **Guardar tema** → `themes/<id>.json` (id = nombre en kebab-case),
- **Usar en <proyecto>** (si se abrió con `--project`) → guarda y escribe `theme` + `template` en el `nt.config.json` del proyecto.

## Ajustes por proyecto (excepción)
`nt.config.json → themeOverrides: { "colors": { "accent": "#…" } }` sobreescribe tokens solo en ese proyecto.
Úsalo poco: lo normal es crear un tema en el framework para que sea reutilizable.
