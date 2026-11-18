'use client'
import { cssVar, resolveTheme, TOKEN_KEYS } from './tokens.js'

// Aplica un tema en vivo (Theme Studio, selector de tema en la app…). Escribe las variables --nt-* en :root.
export function applyTheme(theme, target = document.documentElement) {
  const resolved = theme?.colors && theme.font ? theme : resolveTheme(theme)
  TOKEN_KEYS.forEach((key) => target.style.setProperty(cssVar(key), resolved.colors[key]))
  target.style.setProperty('--nt-font', resolved.font)
  target.style.setProperty('--nt-radius', resolved.radius)
  target.style.colorScheme = resolved.scheme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved.colors.canvas)
  return resolved
}

export function setToken(key, value, target = document.documentElement) {
  target.style.setProperty(cssVar(key), value)
}

// Lee el valor actual de un token (útil para inicializar editores).
export const readToken = (key) => getComputedStyle(document.documentElement).getPropertyValue(cssVar(key)).trim()
