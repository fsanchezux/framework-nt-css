# __TITLE__ — reglas para agentes

Este proyecto usa **framework-nt-css** (`__FRAMEWORK__`). El estilo, las plantillas, los colores y las
animaciones viven en el framework, no aquí. Lee su `SKILL.md` antes de cambiar la UI.

## Reglas

1. **No escribas CSS ni configures Tailwind en este proyecto.** No crees `.css`, `tailwind.config.*` ni estilos inline de color.
   Si falta algo visual, se añade en el framework (componente, token o plantilla) y lo heredan todos los proyectos.
2. **Usa solo componentes de `framework-nt-css`** (`Page`, `PageTitle`, `Section`, `Grid`, `Card`, `StatCard`, `Button`, `Table`, `Input`…).
   Clases de Tailwind para layout puntual (`flex`, `gap-4`, `mt-6`) sí; colores siempre con tokens (`bg-paper`, `text-ink/45`, `text-accent`), nunca hex.
3. **Toda página empieza con `<Page>`** (entrada animada) y todo lo que carga datos va en `<Loadable loading skeleton>`.
4. **La navegación es datos**: se define en `src/App.jsx` (`NAV`, `modes`, `user`…) y se pasa a `<NtApp>`. Nunca montes un layout propio (sidebar, navbar): eso es la plantilla.
5. **Plantilla y tema** se eligen en `nt.config.json`. Para cambiarlos: `npm run nt -- migrate . --template <id>` o `npm run theme`.

## Comandos

- `npm run dev` — desarrollo.
- `npm run theme` — abre el Theme Studio con la vista previa en vivo; "Usar en el proyecto" escribe `nt.config.json`.
- `npm run nt -- templates` / `npm run nt -- themes` — lista plantillas y temas.
- `npm run nt -- migrate . --template navbar-center` — cambia de plantilla (sin tocar código).
- `npm run nt -- doctor .` — comprueba la configuración.
