import { useEffect, useState } from 'react'
import { ArrowUp, BarChart3, Bell, CalendarDays, ClipboardPen, Dumbbell, FileText, Folder, FolderPlus, LayoutGrid, LogOut, MessageSquare, Plus, Settings, Shapes, Star, Trophy, User, Users } from 'lucide-react'
import {
  Avatar, Badge, Button, Card, CardHeader, Dialog, EmptyState, Grid, IconButton, Input, Loadable, Notice, NtApp, Page, PageTitle,
  SearchField, Section, SegmentedControl, Select, SkeletonCard, StatCard, Table, Textarea, Typewriter, useHashRoute
} from '../src/index.js'

// App de muestra con la forma de Hoopbase. Sirve para ver en vivo el tema y la plantilla,
// y como referencia de cómo un proyecto usa el contrato de <NtApp>.

const MODES = [
  { id: 'analysis', label: 'Análisis', icon: MessageSquare },
  { id: 'board', label: 'Entrenador', icon: ClipboardPen },
  { id: 'calendar', label: 'Calendario', icon: CalendarDays, badge: true }
]

const PLAYERS = [
  { id: 1, name: 'Marc Puig', team: 'Esmaix', ppg: 18.4, rpg: 6.1, apg: 3.2 },
  { id: 2, name: 'Pau Ribas', team: 'Esmaix', ppg: 15.9, rpg: 3.4, apg: 6.8 },
  { id: 3, name: 'Àlex Serra', team: 'Sants', ppg: 14.2, rpg: 8.9, apg: 1.4 },
  { id: 4, name: 'Joan Vidal', team: 'Gràcia', ppg: 12.7, rpg: 4.2, apg: 2.9 },
  { id: 5, name: 'Nil Font', team: 'Sants', ppg: 11.3, rpg: 2.8, apg: 4.6 }
]

const SUGGESTIONS = ['¿Quién es el máximo anotador?', 'Compara los dos últimos partidos', 'Prepara la previa del sábado']

// Simula una carga de datos para enseñar los skeletons + la entrada con GSAP.
function useFakeLoad(ms = 1100, deps = []) {
  const [loading, setLoading] = useState(true)
  useEffect(() => { setLoading(true); const timer = setTimeout(() => setLoading(false), ms); return () => clearTimeout(timer) }, deps) // eslint-disable-line react-hooks/exhaustive-deps
  return loading
}

function Home({ navigate }) {
  const [query, setQuery] = useState('')
  return <Page className="pb-14 pt-16 text-center lg:pt-24">
    <Typewriter lines={[{ text: 'El seguiment del teu equip' }, { text: "a l'abast d'un prompt.", className: 'text-ink/45' }]}
      prompts={['Haz una review de @Marc Puig', 'Compara @Esmaix con @Sants', '¿Cómo ha evolucionado @Pau Ribas?']}/>
    <div className="mx-auto mt-10 max-w-[660px] text-left">
      <div className="flex items-end gap-2 rounded-3xl border border-ink/[.1] bg-paper p-2 shadow-[0_30px_80px_-40px_rgba(0,0,0,.8)]">
        <textarea value={query} onChange={(event) => setQuery(event.target.value)} rows={2} placeholder="Pregunta lo que quieras sobre tu liga…"
          className="min-h-[56px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] outline-none placeholder:text-ink/35"/>
        <Button aria-label="Enviar" icon={ArrowUp} className="h-10 w-10 rounded-full px-0" onClick={() => navigate('dashboard')}/>
      </div>
    </div>
    <div className="mx-auto mt-5 flex max-w-[660px] flex-wrap justify-center gap-2">
      {SUGGESTIONS.map((suggestion) => <button key={suggestion} type="button" onClick={() => setQuery(suggestion)}
        className="rounded-full bg-ink/10 px-3 py-1.5 text-[11px] text-ink/75 backdrop-blur-sm transition hover:bg-ink/20 hover:text-ink">{suggestion}</button>)}
    </div>
  </Page>
}

function Dashboard({ navigate }) {
  const loading = useFakeLoad()
  return <Page>
    <PageTitle eyebrow="Temporada 2026-27" title="Panel de la liga" description="Cifras, jugadores y partidos de tu equipo. Los datos cargan con skeleton y entran escalonados."
      actions={<><Button variant="secondary" icon={FileText}>Exportar</Button><Button icon={Plus}>Nuevo informe</Button></>}/>
    <Section>
      <Loadable loading={loading} skeleton={<Grid cols={4}>{[0, 1, 2, 3].map((index) => <SkeletonCard key={index}/>)}</Grid>}>
        <Grid cols={4}>
          <StatCard icon={Trophy} label="Victorias" value={14} note="de 18 partidos" accent onClick={() => navigate('players')}/>
          <StatCard icon={BarChart3} label="Puntos / partido" value="78.4" note="+4.1 vs. liga"/>
          <StatCard icon={Users} label="Jugadores" value={12} note="2 lesionados"/>
          <StatCard icon={Star} label="Ranking" value="2º" note="a 1 victoria del líder"/>
        </Grid>
      </Loadable>
    </Section>
    <Section title="Máximos anotadores" description="Las filas entran escalonadas." actions={<Button size="sm" variant="ghost" onClick={() => navigate('players')}>Ver todos</Button>}>
      <Loadable loading={loading}>
        <Table rows={PLAYERS} onRowClick={() => navigate('players')} columns={[
          { key: 'name', label: 'Jugador', render: (row) => <span className="flex items-center gap-3"><Avatar name={row.name} size="xs"/><span className="font-semibold text-ink">{row.name}</span></span> },
          { key: 'team', label: 'Equipo' },
          { key: 'ppg', label: 'PTS', align: 'right' },
          { key: 'rpg', label: 'REB', align: 'right' },
          { key: 'apg', label: 'AST', align: 'right' }
        ]}/>
      </Loadable>
    </Section>
    <Section title="Próximo partido">
      <Grid cols={2}>
        <Card><CardHeader title="Esmaix vs. Sants" description="Sábado 21 nov · 18:00 · Pavelló Municipal" actions={<Badge tone="accent">Importante</Badge>}/>
          <div className="mt-6 flex items-center justify-between"><span className="text-4xl font-semibold tracking-[-.07em]">—</span><Button variant="outline" size="sm">Preparar previa</Button></div>
        </Card>
        <EmptyState eyebrow="Datos pendientes" title="Sin estadísticas avanzadas" text="Sube las actas del partido para ver el análisis de tiro y los quintetos."/>
      </Grid>
    </Section>
  </Page>
}

function Components() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('week')
  const [search, setSearch] = useState('')
  return <Page>
    <PageTitle eyebrow="Framework" title="Componentes" description="Todo lo que un proyecto puede usar. Cambia los colores desde el panel y mira cómo cambia todo."/>
    <Section title="Botones">
      <div className="flex flex-wrap items-center gap-2">
        <Button icon={Plus}>Primario</Button><Button variant="secondary">Secundario</Button><Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button><Button variant="danger">Peligro</Button><Button loading>Cargando</Button>
        <Button size="sm">Pequeño</Button><Button size="lg">Grande</Button>
        <IconButton label="Notificaciones" icon={Bell}/><IconButton label="Ajustes" icon={Settings} active/>
      </div>
    </Section>
    <Section title="Insignias y avisos">
      <div className="flex flex-wrap gap-2"><Badge>Neutral</Badge><Badge tone="accent">Acento</Badge><Badge tone="solid">Sólido</Badge><Badge tone="success">Ganado</Badge><Badge tone="warning">Duda</Badge><Badge tone="danger">Lesión</Badge></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3"><Notice>Liga importada correctamente.</Notice><Notice tone="warning">Faltan 2 actas.</Notice><Notice tone="danger">No se pudo conectar.</Notice></div>
    </Section>
    <Section title="Campos">
      <Card className="grid gap-4 sm:grid-cols-2">
        <Input label="Nombre del equipo" placeholder="Esmaix"/>
        <Select label="Categoría" options={['Sénior', 'Júnior', 'Cadete']}/>
        <Textarea label="Notas" placeholder="Apuntes del partido…" className="sm:col-span-2"/>
        <SearchField value={search} onChange={setSearch} placeholder="Buscar jugadas…"/>
      </Card>
    </Section>
    <Section title="Control segmentado">
      <SegmentedControl items={[{ id: 'week', label: 'Semana' }, { id: 'month', label: 'Mes' }, { id: 'season', label: 'Temporada' }]} value={tab} onChange={setTab}/>
    </Section>
    <Section title="Diálogo">
      <Button variant="secondary" onClick={() => setOpen(true)}>Abrir diálogo</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Nueva liga" description="Crea una liga y luego sube sus archivos."
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={() => setOpen(false)}>Crear liga</Button></>}>
        <Input label="Nombre" placeholder="Copa Catalunya 2026-27"/>
      </Dialog>
    </Section>
    <Section title="Precarga (skeletons)">
      <Grid cols={3}><SkeletonCard/><SkeletonCard/><SkeletonCard/></Grid>
    </Section>
  </Page>
}

function Players() {
  const loading = useFakeLoad(900)
  return <Page>
    <PageTitle eyebrow="Plantilla" title="Jugadores" description="Lista larga: las filas entran al hacer scroll."/>
    <Section>
      <Loadable loading={loading} skeleton={<Grid cols={3}>{[0, 1, 2, 3, 4, 5].map((index) => <SkeletonCard key={index}/>)}</Grid>}>
        <Grid cols={3}>
          {[...PLAYERS, ...PLAYERS].map((player, index) => <Card key={index} interactive className="flex items-center gap-4">
            <Avatar name={player.name} size="md"/>
            <div className="min-w-0"><p className="truncate font-semibold">{player.name}</p><p className="text-xs text-muted">{player.team} · {player.ppg} PTS</p></div>
          </Card>)}
        </Grid>
      </Loadable>
    </Section>
  </Page>
}

const PAGES = { home: Home, dashboard: Dashboard, components: Components, players: Players }

// Navegación por entorno (como Hoopbase: cada entorno tiene la suya).
function navFor(mode) {
  if (mode === 'board') return [
    { id: 'plays', label: 'Jugadas', action: { label: 'Nueva jugada', icon: Plus }, items: [
      { id: 'components', label: 'Catálogo de componentes', icon: Shapes },
      { id: 'dashboard', label: 'Ataque vs. zona 2-3', icon: ClipboardPen, meta: 'Ataque · 6 fotogramas' },
      { id: 'players', label: 'Presión toda pista', icon: Dumbbell, meta: 'Defensa · 4 fotogramas' }
    ] }
  ]
  if (mode === 'calendar') return [
    { id: 'week', label: 'Esta semana', items: [{ id: 'dashboard', label: 'Esmaix - Sants', icon: Star, meta: 'sáb 21 nov · 18:00' }] },
    { id: 'next', label: 'Próximos partidos', items: [{ id: 'players', label: 'Gràcia - Esmaix', icon: CalendarDays, meta: 'dom 29 nov · 12:00' }] }
  ]
  return [
    { id: 'main', label: 'Explorar', items: [
      { id: 'home', label: 'Inicio', icon: MessageSquare },
      { id: 'dashboard', label: 'Panel', icon: LayoutGrid },
      { id: 'players', label: 'Jugadores', icon: Users },
      { id: 'components', label: 'Componentes', icon: Shapes }
    ] },
    { id: 'spaces', label: 'Espacios', collapsible: true, action: { label: 'Nueva carpeta', icon: FolderPlus }, items: [
      { id: 'f1', label: 'Scouting rivales', icon: Folder, badge: 4 },
      { id: 'f2', label: 'Informes de temporada', icon: Folder, badge: 2 }
    ] },
    { id: 'chats', label: 'Conversaciones', collapsible: true, items: [
      { id: 'c1', label: 'Review de Marc Puig', icon: FileText, meta: 'Hoy' },
      { id: 'c2', label: 'Rotaciones del último partido', icon: MessageSquare, meta: 'Ayer' }
    ] }
  ]
}

export function DemoApp({ template }) {
  const [route, navigate] = useHashRoute('home')
  const [mode, setMode] = useState('analysis')
  const CurrentPage = PAGES[route.view] || Home
  const user = { name: 'Ferran', meta: 'Entrenador · Esmaix', menu: [{ label: 'Perfil', icon: User }, { label: 'Configuración', icon: Settings }, 'divider', { label: 'Cerrar sesión', icon: LogOut, danger: true }] }
  const footer = <Select aria-label="Liga" options={['Copa Catalunya · Sénior A', 'Lliga EBA · Grupo C']}/>

  return <NtApp template={template}
    brand={{ name: 'esmaix', highlight: 'ai', onClick: () => navigate('home') }}
    modes={MODES} mode={mode} onModeChange={setMode}
    nav={navFor(mode)} activeId={route.view} onNavigate={(id) => PAGES[id] && navigate(id)}
    footer={footer} user={user}>
    <CurrentPage key={`${route.view}-${template}`} navigate={navigate}/>
  </NtApp>
}
