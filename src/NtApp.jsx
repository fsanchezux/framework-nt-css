'use client'
import { createContext, useContext, useMemo } from 'react'
import { getTemplate } from './templates.js'
import { Preloader } from './motion/Preloader.jsx'

// Config del proyecto (nt.config.json + tema resuelto). Llega de una de estas formas:
// - Vite: el plugin la inyecta en index.html como window.__NT_CONFIG__.
// - Next.js: getNtConfig() en el layout (servidor) y se pasa como prop `config`.
const globalConfig = () => (typeof globalThis !== 'undefined' && globalThis.__NT_CONFIG__) || {}

const NtContext = createContext({ template: null, config: {} })
export const useNt = () => useContext(NtContext)

// En desarrollo se puede previsualizar otra plantilla sin tocar nada: ?nt-template=navbar-center
const urlTemplate = (config) => {
  if (!config.dev || typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('nt-template')
}

// Raíz de toda app. Elige la plantilla (prop > ?nt-template en dev > nt.config.json) y le pasa los slots del contrato.
// ready: false mientras cargan los datos iniciales (la precarga espera).
export function NtApp({ config: configProp, template, ready = true, children, ...slots }) {
  const config = configProp || globalConfig()
  const id = template || urlTemplate(config) || config.template
  const resolved = getTemplate(id)
  const Shell = resolved?.Shell
  const options = config.templateOptions?.[resolved?.id] || {}
  const value = useMemo(() => ({ template: resolved, config }), [resolved, config])

  if (!Shell) return <p style={{ padding: 24 }}>framework-nt-css: no hay ninguna plantilla en /templates.</p>
  return <NtContext.Provider value={value}>
    <Preloader ready={ready}/>
    {/* key: al cambiar de plantilla se remonta y vuelve a hacer su animación de entrada. */}
    <Shell key={resolved.id} {...slots} options={options}>{children}</Shell>
  </NtContext.Provider>
}
