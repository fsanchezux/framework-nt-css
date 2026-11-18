/*
 * framework-nt-css · runtime del KIT (JavaScript sin framework).
 * Lo usan los proyectos cuya tecnología no es React (ASP.NET, Laravel, Django, Vue, Svelte, HTML…): da a la plantilla
 * exportada a HTML lo mismo que los componentes React: precarga, animaciones de entrada (GSAP), navegación con la
 * página activa marcada y el cajón del móvil. `nt apply` lo copia a .nt/kit/nt.js precedido de window.NT_KIT
 * (páginas, rutas y clases del elemento activo). Necesita window.gsap (gsap.min.js del kit); sin él, todo funciona sin animar.
 *
 * Tailwind escanea este archivo (está en src/), así que las clases de aquí van incluidas en nt.css.
 */
(function () {
  var KIT = window.NT_KIT || { pages: [], classes: {} }
  var gsap = window.gsap
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var animate = Boolean(gsap) && !reduced
  document.documentElement.classList.add('nt-js')

  // ---------- rutas ----------
  function toRegex(route) {
    return new RegExp('^' + route.replace(/\[\.\.\.[^\]]+\]/g, '.+').replace(/\[[^\]]+\]|:[^/]+|\{[^}]+\}/g, '[^/]+').replace(/\/$/, '') + '/?$')
  }
  function matchPage(pathname) {
    var pages = KIT.pages || []
    for (var i = 0; i < pages.length; i++) if (toRegex(pages[i].route).test(pathname)) return pages[i]
    var best = null
    pages.forEach(function (p) {
      if (p.route !== '/' && pathname.indexOf(p.route.replace(/\/$/, '') + '/') === 0 && (!best || p.route.length > best.route.length)) best = p
    })
    return best
  }
  function routeOf(id) { var p = (KIT.pages || []).filter(function (x) { return x.id === id })[0]; return p && p.route }
  // Prefijo de la app si no vive en la raíz del dominio (p. ej. IIS en /miapp): NT_KIT.base = '/miapp'.
  // En SPA (Vue, Svelte, Angular…) define NT_KIT.navigate = (ruta) => router.push(ruta) y llama a ntKit.refresh() al cambiar de ruta.
  function go(route) { if (route == null) return; if (typeof KIT.navigate === 'function') return KIT.navigate(route); window.location.assign((KIT.base || '') + route) }
  function current() { return matchPage(window.location.pathname.slice((KIT.base || '').length) || '/') }

  // ---------- estado activo ----------
  function swap(el, from, to) {
    if (!el || from == null || to == null) return
    from.split(/\s+/).filter(Boolean).forEach(function (c) { el.classList.remove(c) })
    to.split(/\s+/).filter(Boolean).forEach(function (c) { el.classList.add(c) })
  }
  function markActive(root, id) {
    var c = KIT.classes || {}
    root.querySelectorAll('[data-nt-nav]').forEach(function (el) {
      var active = el.getAttribute('data-nt-nav') === id
      var kind = el.hasAttribute('data-nt-item') ? 'item' : 'pill'
      if (active) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current')
      var set = c[kind]; if (!set) return
      swap(el, active ? set.idle : set.active, active ? set.active : set.idle)
      var icon = el.querySelector('svg')
      if (icon && set.iconActive != null) swap(icon, active ? set.iconIdle : set.iconActive, active ? set.iconActive : set.iconIdle)
    })
    root.querySelectorAll('[data-nt-value]').forEach(function (el) { el.setAttribute('aria-selected', String(el.getAttribute('data-nt-value') === id)) })
  }

  // ---------- cajón (móvil y plantilla con navbar) ----------
  function openDrawer() {
    var source = document.getElementById('nt-drawer')
    if (!source || document.querySelector('[data-nt-drawer]')) return
    var layer = document.createElement('div')
    layer.setAttribute('data-nt-drawer', '')
    layer.innerHTML = '<div data-nt-backdrop class="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"></div>' +
      '<aside role="dialog" aria-modal="true" aria-label="Menú" class="fixed inset-y-0 left-0 z-50 w-[min(300px,85vw)] overflow-hidden border-r border-ink/[.07] bg-sidebar text-ink shadow-2xl"></aside>'
    var panel = layer.querySelector('aside')
    panel.appendChild(source.content.cloneNode(true))
    document.body.appendChild(layer)
    var page = current()
    markActive(panel, page && page.id)
    bind(panel)
    var backdrop = layer.querySelector('[data-nt-backdrop]')
    function close() {
      document.removeEventListener('keydown', onKey)
      if (!animate) return layer.remove()
      gsap.to(backdrop, { autoAlpha: 0, duration: 0.25 })
      gsap.to(panel, { xPercent: -100, duration: 0.4, ease: 'power3.in', onComplete: function () { layer.remove() } })
    }
    function onKey(e) { if (e.key === 'Escape') close() }
    backdrop.addEventListener('click', close)
    panel.querySelectorAll('[data-nt-action="close"]').forEach(function (b) { b.addEventListener('click', close) })
    document.addEventListener('keydown', onKey)
    if (animate) {
      gsap.fromTo(backdrop, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 })
      gsap.fromTo(panel, { xPercent: -100 }, { xPercent: 0, duration: 0.6, ease: 'expo.out' })
      gsap.from(panel.querySelectorAll('[data-nt-item]'), { autoAlpha: 0, x: -12, stagger: 0.03, duration: 0.45, delay: 0.1 })
    }
  }

  function bind(root) {
    root.querySelectorAll('[data-nt-nav],[data-nt-value]').forEach(function (el) {
      el.addEventListener('click', function () { go(routeOf(el.getAttribute('data-nt-nav') || el.getAttribute('data-nt-value'))) })
    })
    root.querySelectorAll('[data-nt-action="home"]').forEach(function (el) { el.addEventListener('click', function () { go('/') }) })
    root.querySelectorAll('[data-nt-action="drawer"]').forEach(function (el) { el.addEventListener('click', openDrawer) })
  }

  // ---------- entrada (después de la precarga) ----------
  function intro() {
    var reveals = document.querySelectorAll('[data-nt-reveal]')
    if (!animate) { reveals.forEach(function (el) { el.style.visibility = 'visible' }); return }
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
    var aside = document.querySelector('[data-nt-shell="aside"]')
    if (aside) tl.from(aside, { autoAlpha: 0, x: -28, duration: 0.8 }).from(aside.querySelectorAll('[data-nt-item]'), { autoAlpha: 0, x: -10, stagger: 0.035, duration: 0.6 }, '-=0.55')
    var header = document.querySelector('[data-nt-shell="header"]')
    if (header) tl.from(header, { autoAlpha: 0, y: -20, duration: 0.8 }, 0)
    var top = document.querySelectorAll('[data-nt-shell="top"] > *, [data-nt-shell="center"], [data-nt-shell="subnav"]')
    if (top.length) tl.from(top, { autoAlpha: 0, y: -16, stagger: 0.08, duration: 0.7 }, 0.15)
    if (reveals.length) tl.fromTo(reveals, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, stagger: 0.06, duration: 0.8 }, 0.2)
  }

  // ---------- precarga (#nt-boot) ----------
  function boot() {
    var el = document.getElementById('nt-boot')
    if (!el) return intro()
    var started = window.__ntStart || performance.now()
    var wait = Math.max(0, 650 - (performance.now() - started))
    var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()
    Promise.all([fonts, new Promise(function (r) { setTimeout(r, wait) })]).then(function () {
      function finish() { el.style.display = 'none' }
      if (!animate) { finish(); return intro() }
      var bar = el.querySelector('.nt-boot-bar > i')
      gsap.timeline({ onComplete: finish })
        .set(bar, { animation: 'none', x: 0, width: '0%' })
        .to(bar, { width: '100%', duration: 0.45, ease: 'power2.inOut' })
        .to(el.querySelector('.nt-boot-mark'), { y: -16, autoAlpha: 0, duration: 0.4, ease: 'power3.in' }, '+=0.05')
        .add(intro, '-=0.1')
        .to(el, { yPercent: -100, duration: 0.75, ease: 'expo.inOut' }, '<')
    })
  }

  window.ntKit = { refresh: function () { var p = current(); markActive(document, p && p.id) }, openDrawer: openDrawer }

  function start() {
    var page = current()
    markActive(document, page && page.id)
    bind(document)
    boot()
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start()
})()
