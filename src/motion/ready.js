'use client'
import { useSyncExternalStore } from 'react'

// Estado "la app ya ha cargado": lo marca <Preloader/> al terminar su salida.
// Las animaciones de entrada (Reveal, plantillas) esperan a este momento para no pisarse con la precarga.
let ready = false
const listeners = new Set()

export const isAppReady = () => ready
export function markAppReady() {
  if (ready) return
  ready = true
  listeners.forEach((listener) => listener())
  listeners.clear()
}
export function onAppReady(callback) {
  if (ready) { callback(); return () => {} }
  listeners.add(callback)
  return () => listeners.delete(callback)
}
// Red de seguridad: si una app no monta <Preloader/>, el contenido aparece igualmente.
if (typeof window !== 'undefined') window.setTimeout(markAppReady, 4000)

const subscribe = (listener) => onAppReady(listener)
export const useAppReady = () => useSyncExternalStore(subscribe, isAppReady, () => true)
