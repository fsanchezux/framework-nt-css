// Adaptador universal (kit): para cualquier tecnología que no sea React.
// El framework usa SU tecnología (React + Tailwind + GSAP) para producir piezas que cualquier stack entiende:
//   .nt/kit/nt.css        CSS compilado (tema + plantilla + componentes), sin Tailwind en el proyecto.
//   .nt/kit/layout.html   la plantilla en HTML con la navegación del proyecto y <!-- nt:content --> donde van las páginas.
//   .nt/kit/nt.js         precarga, animaciones de entrada, página activa y cajón móvil (vanilla JS + GSAP).
//   .nt/kit/gsap.min.js   GSAP (copiado del framework: sin CDN).
//   .nt/kit/preview.html  la plantilla con contenido de ejemplo, para abrirla directamente en el navegador.
// El agente traslada layout.html al layout de la tecnología (pasos en .nt/INTEGRATION.md).
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { FRAMEWORK_ROOT } from './catalog.js'
import { buildFrameworkCss } from './css.js'

const require = createRequire(import.meta.url)
const posix = (p) => p.split(path.sep).join('/')
const escapeHtml = (text) => String(text ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

// Dónde vive el layout, la carpeta pública y qué va en el hueco del contenido, por tecnología.
const STACKS = {
  aspnet: { layouts: ['Pages/Shared/_Layout.cshtml', 'Views/Shared/_Layout.cshtml'], public: 'wwwroot', content: '@RenderBody()', href: (f) => `~/nt/${f}` },
  laravel: { layouts: ['resources/views/layouts/app.blade.php', 'resources/views/components/layouts/app.blade.php'], public: 'public', content: "@yield('content') o {{ $slot }}", href: (f) => `{{ asset('nt/${f}') }}` },
  django: { layouts: ['templates/base.html'], public: 'static', content: '{% block content %}{% endblock %}', href: (f) => `{% static 'nt/${f}' %}`, note: 'Añade `{% load static %}` arriba.' },
  rails: { layouts: ['app/views/layouts/application.html.erb'], public: 'public', content: '<%= yield %>', href: (f) => `/nt/${f}` },
  php: { layouts: ['includes/header.php', 'header.php', 'index.php'], public: '.', content: '(divide layout.html en header.php y footer.php por <!-- nt:content -->)', href: (f) => `/nt/${f}` },
  static: { layouts: ['index.html'], public: '.', content: '(el contenido de cada página)', href: (f) => `/nt/${f}` },
  nuxt: { layouts: ['layouts/default.vue', 'app/layouts/default.vue', 'app.vue'], public: 'public', content: '<slot /> (o <NuxtPage />)', href: (f) => `/nt/${f}`, spa: 'useRouter().push', note: 'Los <script> van en nuxt.config → app.head.script; la marca y el cajón en el <template> del layout.' },
  vue: { layouts: ['src/App.vue'], public: 'public', content: '<RouterView />', href: (f) => `/nt/${f}`, spa: 'router.push' },
  sveltekit: { layouts: ['src/routes/+layout.svelte'], public: 'static', content: '{@render children()}', href: (f) => `/nt/${f}`, spa: "goto (de '$app/navigation')" },
  svelte: { layouts: ['src/App.svelte'], public: 'public', content: '(tu router)', href: (f) => `/nt/${f}`, spa: 'tu router' },
  astro: { layouts: ['src/layouts/Layout.astro', 'src/layouts/BaseLayout.astro'], public: 'public', content: '<slot />', href: (f) => `/nt/${f}` },
  angular: { layouts: ['src/app/app.component.html', 'src/app/app.html'], public: 'public', content: '<router-outlet />', href: (f) => `nt/${f}`, spa: 'router.navigateByUrl', note: 'Las etiquetas <link>/<script> van en src/index.html.' },
  solid: { layouts: ['src/App.jsx', 'src/App.tsx'], public: 'public', content: '{props.children}', href: (f) => `/nt/${f}`, spa: 'useNavigate()' },
  'react-router': { layouts: ['app/root.tsx', 'app/root.jsx'], public: 'public', content: '<Outlet />', href: (f) => `/nt/${f}`, spa: 'useNavigate()' },
  react: { layouts: ['src/App.jsx', 'src/App.tsx', 'src/App.js'], public: 'public', content: '{children}', href: (f) => `/nt/${f}`, spa: 'tu router' }
}
const GENERIC = { layouts: [], public: 'public', content: '(el contenido de cada página)', href: (f) => `/nt/${f}` }

// Renderiza la plantilla con los componentes React del framework, en Node, a través de Vite (JSX + JSON + CSS ignorado).
export async function renderTemplateHtml(args) {
  const { createServer } = await import('vite')
  const react = (await import('@vitejs/plugin-react')).default
  const server = await createServer({
    configFile: false, root: FRAMEWORK_ROOT, logLevel: 'error', plugins: [react()], appType: 'custom',
    server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }
  })
  try {
    const mod = await server.ssrLoadModule('/src/kit/render.jsx')
    return mod.renderKit(args)
  } finally {
    await server.close()
  }
}

const bootHtml = (name) => `<div id="nt-boot" aria-hidden="true"><div class="nt-boot-mark"><span class="nt-boot-name">${escapeHtml(name)}</span><span class="nt-boot-bar"><i></i></span></div></div>`

function documentHtml({ title, theme, href, shell, drawer, content }) {
  return `<!doctype html>
<html lang="es" class="nt-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="${theme.colors.canvas}">
  <meta name="color-scheme" content="${theme.scheme}">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="${href('nt.css')}">
  <script>window.__ntStart = performance.now(); document.documentElement.classList.add('nt-js')</script>
</head>
<body>
  ${bootHtml(title)}
  ${shell.replace('<!-- nt:content -->', content)}
  <template id="nt-drawer">${drawer}</template>
  <script src="${href('gsap.min.js')}"></script>
  <script src="${href('nt.js')}"></script>
</body>
</html>
`
}

const SAMPLE = (project) => `
    <section data-nt-reveal class="pt-14 pb-8 lg:pt-20">
      <p class="text-[11px] font-bold uppercase tracking-[.16em] text-ink/35">${escapeHtml(project.brand.name)}</p>
      <h1 class="mt-3 text-4xl font-semibold tracking-[-.06em] md:text-6xl">Vista previa del kit</h1>
      <p class="mt-4 max-w-xl text-muted">Así queda la plantilla en ${escapeHtml(project.tech.label)}. Aquí irá el contenido de cada página.</p>
    </section>
    <div data-nt-reveal class="grid gap-3 md:grid-cols-3">
      ${[1, 2, 3].map((n) => `<div class="rounded-nt border border-ink/[.07] bg-paper p-5"><p class="text-xs font-bold text-accent">0${n}</p><p class="mt-3 font-semibold">Bloque ${n}</p><p class="mt-1 text-sm text-muted">Contenido de ejemplo.</p></div>`).join('\n      ')}
    </div>
`

function kitSteps(dir, project, stack) {
  const layout = stack.layouts.map((f) => path.join(dir, f)).find((f) => fs.existsSync(f))
  const layoutRel = layout ? posix(path.relative(dir, layout)) : (stack.layouts[0] || 'tu layout principal')
  const layoutSrc = layout ? fs.readFileSync(layout, 'utf8') : ''
  const publicDir = path.join(dir, stack.public, 'nt')
  const assets = ['nt.css', 'nt.js', 'gsap.min.js']
  const copied = assets.every((f) => fs.existsSync(path.join(publicDir, f)))
  return [
    {
      title: 'Copiar los recursos del kit a la carpeta pública',
      done: copied,
      file: posix(path.join(stack.public, 'nt')) + '/',
      body: `Copia \`.nt/kit/{${assets.join(',')}}\` a \`${posix(path.join(stack.public, 'nt'))}/\`. Repite la copia tras cada \`nt apply\` (o automatízalo en el build del proyecto).`
    },
    {
      title: 'Layout principal: plantilla del framework',
      done: /nt-boot/.test(layoutSrc) && /nt\.css/.test(layoutSrc),
      file: layoutRel,
      body: [
        'Traslada `.nt/kit/layout.html` al layout de la tecnología:',
        '',
        `- En \`<head>\`: el \`<link>\` a nt.css, las metas theme-color/color-scheme y el \`<script>\` que añade la clase nt-js. Rutas de recursos con la sintaxis del stack, p. ej. \`${stack.href('nt.css')}\`.`,
        '- Al principio de `<body>`: el bloque `#nt-boot` (precarga).',
        `- Después, el HTML de la plantilla tal cual, sustituyendo \`<!-- nt:content -->\` por **${stack.content}**.`,
        '- El `<template id="nt-drawer">` (navegación del cajón móvil) y, al final, los `<script>` de gsap.min.js y nt.js.',
        '- No cambies los atributos `data-nt-*`: nt.js los usa para navegar, marcar la página activa y animar.',
        stack.spa ? `- App de una sola página (sin recargar): antes de cargar nt.js define \`window.NT_KIT = { navigate: (ruta) => /* ${stack.spa} */ }\` y llama a \`ntKit.refresh()\` en cada cambio de ruta para marcar la página activa.` : '',
        stack.note ? `- ${stack.note}` : ''
      ].filter(Boolean).join('\n')
    },
    {
      title: 'Quitar el estilo global antiguo y animar el contenido',
      done: false,
      manual: true,
      body: 'Quita del layout/CSS global lo que pinte fondo, tipografía, cabecera o barra lateral propias (ahora lo pone la plantilla). En las páginas, añade `data-nt-reveal` a los bloques principales: entran animados tras la precarga. Usa los tokens con variables CSS (`var(--nt-accent)`, `var(--nt-paper)`…) para el CSS propio de cada página.'
    }
  ]
}

export async function exportKit({ dir, project, config, theme, model }) {
  const stack = STACKS[project.tech.id] || GENERIC
  const rendered = await renderTemplateHtml({ template: config.template, options: config.templateOptions?.[config.template] || {}, brand: model.brand, nav: model.nav })
  const css = await buildFrameworkCss({ theme })
  const runtime = fs.readFileSync(path.join(FRAMEWORK_ROOT, 'src', 'kit', 'runtime.js'), 'utf8')
  const kitConfig = { pages: model.pages.map(({ id, route, shell }) => ({ id, route, shell })), classes: rendered.classes, template: rendered.template }
  const ntJs = `/* GENERADO por framework-nt-css (nt apply · kit). No lo edites: vuelve a ejecutar nt apply. */\nwindow.NT_KIT = Object.assign(${JSON.stringify(kitConfig)}, window.NT_KIT || {});\n${runtime}`
  const gsapFile = path.join(path.dirname(require.resolve('gsap/package.json', { paths: [FRAMEWORK_ROOT] })), 'dist', 'gsap.min.js')
  const title = project.brand.name
  const layout = documentHtml({ title, theme, href: (f) => `/nt/${f}`, shell: rendered.shell, drawer: rendered.drawer, content: '<!-- nt:content -->' })
  const preview = documentHtml({ title, theme, href: (f) => `./${f}`, shell: rendered.shell, drawer: rendered.drawer, content: SAMPLE(project) })
  return {
    files: [
      { rel: 'kit/nt.css', content: css },
      { rel: 'kit/nt.js', content: ntJs },
      { rel: 'kit/gsap.min.js', content: fs.readFileSync(gsapFile) },
      { rel: 'kit/layout.html', content: layout },
      { rel: 'kit/preview.html', content: preview }
    ],
    steps: kitSteps(dir, project, stack)
  }
}
