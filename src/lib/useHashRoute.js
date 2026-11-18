'use client'
import { useCallback, useEffect, useState } from 'react'

// Router mínimo por hash (#/vista/id). Suficiente para apps tipo Hoopbase; un proyecto puede usar
// cualquier otro router: las plantillas solo reciben activeId y onNavigate.
const parse = () => {
  const [view = '', ...rest] = window.location.hash.replace(/^#\/?/, '').split('/')
  return { view, id: rest.join('/') || null }
}

export function useHashRoute(defaultView = 'home') {
  const [route, setRoute] = useState(parse)
  useEffect(() => {
    const onChange = () => setRoute(parse())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  const navigate = useCallback((view, id) => { window.location.hash = `/${view}${id ? `/${id}` : ''}` }, [])
  return [{ view: route.view || defaultView, id: route.id }, navigate]
}
