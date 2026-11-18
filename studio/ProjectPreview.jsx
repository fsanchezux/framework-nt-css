import { useEffect, useState } from 'react'
import {
  ArrowRight, BarChart3, CalendarDays, Circle, FileText, Home, LayoutGrid, List, LogOut, MessageSquare, Plus,
  Send, Settings, ShoppingBag, User, Users
} from 'lucide-react'
import {
  Badge, Button, Card, CardHeader, Grid, Input, Loadable, NtApp, Page, PageTitle, Preloader, SearchField, Section,
  SkeletonCard, StatCard, Table, Textarea, Typewriter, useHashRoute
} from '../src/index.js'

// Vista previa de un proyecto CONECTADO (nt connect): su marca, sus páginas y su navegación, pintadas con la
// tecnología del framework y la plantilla/tema elegidos. El contenido de cada página es genérico según su tipo
// (landing, list, detail, form, auth): sirve para decidir el diseño, no para ver los datos reales.

const ICONS = { Home, List, Settings, User, LayoutGrid, CalendarDays, MessageSquare, Users, Send, FileText, ShoppingBag, BarChart3, Circle }
const icon = (name) => ICONS[name] || Circle

function useFakeLoad(ms = 900) {
  const [loading, setLoading] = useState(true)
  useEffect(() => { const timer = setTimeout(() => setLoading(false), ms); return () => clearTimeout(timer) }, [ms])
  return loading
}

const Source = ({ page, tech }) => <Badge tone="neutral" className="normal-case tracking-normal">{tech.label} · {page.file || page.route}</Badge>

function Landing({ page, project, navigate }) {
  const first = project.nav[0]?.items.find((item) => item.id !== page.id)
  return <Page className="pt-16 text-center lg:pt-24">
    <Typewriter lines={[{ text: page.title || project.brand.name }, { text: project.brand.title?.split(/[·|–—-]/)[1]?.trim() || 'Vista previa con framework-nt-css', className: 'text-ink/45' }]}/>
    <div className="mt-10 flex justify-center gap-2">
      {first && <Button size="lg" iconRight={ArrowRight} onClick={() => navigate(first.id)}>{first.label}</Button>}
      <Button size="lg" variant="secondary">Saber más</Button>
    </div>
    <Grid cols={3} className="mx-auto mt-16 max-w-4xl text-left">
      {['Primero', 'Segundo', 'Tercero'].map((step, index) => <Card key={step}><p className="text-xs font-bold text-accent">0{index + 1}</p><p className="mt-3 font-semibold">{step} paso</p><p className="mt-1 text-sm text-muted">Texto de ejemplo de la portada.</p></Card>)}
    </Grid>
  </Page>
}

function ListPage({ page, project }) {
  const loading = useFakeLoad()
  const [query, setQuery] = useState('')
  const Icon = icon(page.icon)
  return <Page>
    <PageTitle eyebrow={project.brand.name} title={page.label} description="Listado de ejemplo: así se verían los elementos de esta página." actions={<><SearchField value={query} onChange={setQuery} className="w-56"/><Button icon={Plus}>Nuevo</Button></>}/>
    <Section>
      <Loadable loading={loading} skeleton={<Grid cols={3}>{[0, 1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i}/>)}</Grid>}>
        <Grid cols={3}>
          {[1, 2, 3, 4, 5, 6].map((n) => <Card key={n} interactive>
            <CardHeader title={`${page.label} ${n}`} description="Descripción breve del elemento." actions={<Icon size={16} className="text-accent-soft"/>}/>
            <div className="mt-5 flex items-center justify-between"><Badge tone={n % 3 ? 'neutral' : 'accent'}>{n % 3 ? 'Activo' : 'Destacado'}</Badge><span className="text-xs text-ink/40">hace {n} días</span></div>
          </Card>)}
        </Grid>
      </Loadable>
    </Section>
  </Page>
}

function DetailPage({ page, project }) {
  const loading = useFakeLoad()
  return <Page>
    <PageTitle eyebrow={page.route} title={`${page.label} · detalle`} description="Página de detalle de ejemplo." actions={<Button variant="secondary" icon={Send}>Compartir</Button>}/>
    <Section>
      <Loadable loading={loading} skeleton={<Grid cols={3}><SkeletonCard/><SkeletonCard/><SkeletonCard/></Grid>}>
        <Grid cols={3}><StatCard label="Elementos" value={24} note="en total"/><StatCard label="Esta semana" value={6} accent/><StatCard label="Compartido con" value={3} note="personas"/></Grid>
      </Loadable>
    </Section>
    <Section title="Elementos">
      <Table rows={[1, 2, 3, 4].map((n) => ({ id: n, name: `Elemento ${n}`, state: n % 2 ? 'Pendiente' : 'Hecho', date: `${n + 10} nov` }))} columns={[
        { key: 'name', label: 'Nombre', render: (row) => <span className="font-semibold text-ink">{row.name}</span> },
        { key: 'state', label: 'Estado', render: (row) => <Badge tone={row.state === 'Hecho' ? 'success' : 'warning'}>{row.state}</Badge> },
        { key: 'date', label: 'Fecha', align: 'right' }
      ]}/>
    </Section>
    <p className="mt-6 text-xs text-ink/40">Fuente: {page.file} ({project.tech.label})</p>
  </Page>
}

function FormPage({ page }) {
  return <Page>
    <PageTitle eyebrow="Formulario" title={page.label} description="Formulario de ejemplo."/>
    <Section><Card className="grid max-w-2xl gap-4">
      <Input label="Nombre" placeholder="Escribe aquí…"/><Input label="Correo" type="email" placeholder="tu@correo.com"/>
      <Textarea label="Mensaje" placeholder="Opcional"/>
      <div className="flex justify-end gap-2"><Button variant="ghost">Cancelar</Button><Button>Guardar</Button></div>
    </Card></Section>
  </Page>
}

function AuthPage({ page, project }) {
  return <Page className="grid min-h-[70vh] place-items-center pt-10">
    <Card className="w-full max-w-sm p-7">
      <p className="text-[11px] font-bold uppercase tracking-[.16em] text-ink/35">{project.brand.name}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-.06em]">{page.title || page.label}</h1>
      <div className="mt-6 grid gap-3"><Input label="Correo" type="email" placeholder="tu@correo.com"/><Button className="w-full">Entrar</Button><Button variant="secondary" className="w-full">Continuar con Google</Button></div>
    </Card>
  </Page>
}

const BY_KIND = { landing: Landing, list: ListPage, detail: DetailPage, form: FormPage, auth: AuthPage }

export function ProjectPreview({ project, template }) {
  const [route, navigate] = useHashRoute(project.pages[0]?.id || 'home')
  const [mode, setMode] = useState(project.modes[0]?.id)
  const page = project.pages.find((p) => p.id === route.view) || project.pages[0]
  const PageView = BY_KIND[page?.kind] || ListPage
  const nav = project.nav.map((section) => ({ ...section, items: section.items.map((item) => ({ ...item, icon: icon(item.icon), meta: item.route })) }))
  const hidden = project.pages.filter((p) => !project.nav.some((s) => s.items.some((i) => i.id === p.id)))
  if (hidden.length) nav.push({ id: '__other', label: 'Otras páginas', collapsible: true, defaultOpen: false, items: hidden.map((p) => ({ id: p.id, label: p.label, icon: icon(p.icon), meta: p.route })) })
  const user = project.user.enabled ? { name: 'Usuario', meta: project.user.provider ? `Sesión · ${project.user.provider}` : 'Sesión', menu: [{ label: 'Ajustes', icon: Settings }, 'divider', { label: 'Cerrar sesión', icon: LogOut, danger: true }] } : undefined

  // Página sin plantilla (shell: false, p. ej. login): se ve tal cual quedará, con un botón para volver.
  if (page && page.shell === false) return <div className="min-h-screen bg-canvas text-ink">
    <Preloader/>
    <Button variant="ghost" size="sm" className="fixed left-4 top-4 z-10" onClick={() => navigate(project.pages.find((p) => p.shell !== false)?.id)}>← {project.brand.name}</Button>
    <PageView key={page.id} page={page} project={project} navigate={navigate}/>
  </div>

  return <NtApp template={template}
    brand={{ name: project.brand.name, highlight: project.brand.highlight, onClick: () => navigate(project.pages[0]?.id) }}
    modes={project.modes.length ? project.modes.map((m) => ({ ...m, icon: icon(m.icon) })) : undefined} mode={mode} onModeChange={setMode}
    nav={nav} activeId={page?.id} onNavigate={(id) => navigate(id)}
    user={user}
    actions={page && <span className="hidden md:inline-flex"><Source page={page} tech={project.tech}/></span>}>
    {page ? <PageView key={`${page.id}-${template}`} page={page} project={project} navigate={navigate}/> : <Page><PageTitle title="Sin páginas" description="El escáner no encontró páginas: añádelas en .nt/project.json → overrides."/></Page>}
  </NtApp>
}

