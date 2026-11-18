import { useEffect, useState } from 'react'
import { Activity, Plus, Users } from 'lucide-react'
import { Button, Grid, Loadable, Page, PageTitle, Section, SkeletonCard, StatCard } from 'framework-nt-css'

// Ejemplo de página con datos: skeleton mientras carga y entrada animada al terminar (lo hace <Loadable>).
export function Overview() {
  const [data, setData] = useState(null)
  useEffect(() => { const timer = setTimeout(() => setData({ users: 128, active: 42 }), 800); return () => clearTimeout(timer) }, [])

  return <Page>
    <PageTitle eyebrow="Resumen" title="Tu panel" description="Ejemplo de página: cabecera, cifras y una sección." actions={<Button icon={Plus}>Nuevo</Button>}/>
    <Section>
      <Loadable loading={!data} skeleton={<Grid cols={2}><SkeletonCard/><SkeletonCard/></Grid>}>
        <Grid cols={2}>
          <StatCard icon={Users} label="Usuarios" value={data?.users} note="total"/>
          <StatCard icon={Activity} label="Activos" value={data?.active} note="esta semana" accent/>
        </Grid>
      </Loadable>
    </Section>
  </Page>
}
