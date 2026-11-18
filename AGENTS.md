# framework-nt-css — guía para agentes

Este repositorio es a la vez:
1. Un **Agent Skill** (estándar abierto: `SKILL.md` + `scripts/` + `references/`), usable desde Claude Code, Codex, Gemini CLI, Cursor, Copilot, etc.
2. El **paquete** `framework-nt-css` que los proyectos enlazan (`file:`) para heredar plantillas, temas, componentes y animaciones.

Si te piden **usar** el framework (crear proyecto, elegir colores, migrar plantilla) → sigue `SKILL.md`.
Si te piden **cambiar el framework** → sigue esta guía.

## Stack
React 19 · Vite 8 · Tailwind CSS 4 (`@theme inline` + variables `--nt-*`) · GSAP 3 + `@gsap/react` · lucide-react · clsx + tailwind-merge (`cn`). JavaScript (JSX), sin TypeScript, ESM.

## Comandos
- `npm install` — dependencias del framework.
- `node scripts/nt.mjs theme` (o `npm run studio`) — Theme Studio en http://localhost:5180 (app de muestra + editor de colores).
- `node scripts/nt.mjs doctor` — valida plantillas y temas. `npm test` — tests (node:test).
- `node scripts/gen-schemas.mjs` — regenera `references/*.schema.json` tras cambiar tokens o el contrato.
- `npm run build:studio` — comprueba que todo compila.

## Reglas al cambiar el framework
- **Fuentes únicas**: tokens en `src/theme/tokens.js`; slots en `src/contract.js`. Si cambias uno, actualiza `styles/index.css`,
  los temas, los schemas (`gen-schemas.mjs`) y `references/`.
- **No rompas el contrato** de slots: si hace falta, sube `CONTRACT_VERSION` y actualiza todas las plantillas.
- Componentes: solo tokens de color, `cn()`, aceptan `className`, animación GSAP con `useGSAP` + `contextSafe` + `onAppReady`,
  respetan `prefersReducedMotion()`. Exporta todo lo público en `src/index.js` y enséñalo en `studio/DemoApp.jsx`.
- No anides `gsap.matchMedia()` dentro de `useGSAP` (recursión de contextos de GSAP).
- `src/theme/tokens.js`, `src/contract.js` y `src/node/*` deben seguir siendo módulos puros (los importa Node).
- Comentarios en castellano, explicando el *porqué*, como en Hoopbase.
- Verifica en el studio (las dos plantillas, tema claro y oscuro) antes de dar algo por hecho.
