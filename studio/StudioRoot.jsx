import { useState } from 'react'
import ntConfig from 'virtual:nt-config'
import { DemoApp } from './DemoApp.jsx'
import { ProjectPreview } from './ProjectPreview.jsx'
import { ThemePanel } from './ThemePanel.jsx'

// Raíz del studio:
// - Abierto desde un proyecto conectado (nt preview <dir>): vista previa de ESE proyecto.
// - Si no (o con ?demo): la app de muestra con forma de Hoopbase.
// La plantilla se cambia en vivo desde el panel (y se recuerda en la URL: ?template=navbar-center).
export function StudioRoot() {
  const params = new URLSearchParams(window.location.search)
  const [template, setTemplate] = useState(() => params.get('template') || ntConfig.template)
  const showProject = ntConfig.project && !params.has('demo')
  const changeTemplate = (id) => {
    const url = new URL(window.location.href)
    url.searchParams.set('template', id)
    window.history.replaceState(null, '', url)
    setTemplate(id)
  }
  return <>
    {showProject ? <ProjectPreview project={ntConfig.project} template={template}/> : <DemoApp template={template}/>}
    <ThemePanel template={template} onTemplate={changeTemplate} palette={ntConfig.project?.detected?.palette}/>
  </>
}
