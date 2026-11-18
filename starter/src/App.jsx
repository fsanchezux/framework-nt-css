import { useState } from 'react'
import { Home as HomeIcon, LayoutGrid, LogOut, Settings } from 'lucide-react'
import { NtApp, useHashRoute } from 'framework-nt-css'
import { Home } from './pages/Home.jsx'
import { Overview } from './pages/Overview.jsx'

// Páginas de la app: id → componente. Añadir una página = añadirla aquí y en NAV.
const PAGES = { home: Home, overview: Overview }

// Navegación como DATOS (contrato de plantillas): la plantilla activa decide cómo pintarla.
// Por eso migrar de plantilla (nt.config.json → "template") no requiere tocar este archivo.
const NAV = [
  { id: 'main', label: 'Explorar', items: [
    { id: 'home', label: 'Inicio', icon: HomeIcon },
    { id: 'overview', label: 'Resumen', icon: LayoutGrid }
  ] }
]

export function App() {
  const [route, navigate] = useHashRoute('home')
  const [loading] = useState(false) // true mientras cargan los datos iniciales: la precarga espera.
  const Page = PAGES[route.view] || Home

  return <NtApp ready={!loading}
    brand={{ name: '__BRAND__', onClick: () => navigate('home') }}
    nav={NAV} activeId={route.view} onNavigate={(id) => navigate(id)}
    user={{ name: 'Usuario', meta: 'Cuenta', menu: [{ label: 'Configuración', icon: Settings }, 'divider', { label: 'Cerrar sesión', icon: LogOut, danger: true }] }}>
    <Page key={route.view} navigate={navigate}/>
  </NtApp>
}
