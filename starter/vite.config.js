import { defineConfig } from 'vite'
import nt from 'framework-nt-css/vite'

// Todo el estilo (Tailwind, tema, plantilla, React) lo pone el framework.
// No añadas aquí Tailwind ni CSS propio: cambia el framework y se actualizan todos los proyectos.
export default defineConfig({
  plugins: [nt()]
})
