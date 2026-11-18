// framework-nt-css · API pública. Los proyectos importan TODO desde aquí:
//   import { NtApp, Page, PageTitle, Button, Reveal } from 'framework-nt-css'

// Raíz y plantillas
export { NtApp, useNt } from './NtApp.jsx'
export { TEMPLATES, getTemplate, DEFAULT_TEMPLATE } from './templates.js'
export { SLOTS, SLOT_KEYS, CONTRACT_VERSION } from './contract.js'

// Tema
export { TOKENS, TOKEN_GROUPS, TOKEN_KEYS, DEFAULT_COLORS, resolveTheme, validateTheme, themeToCss } from './theme/tokens.js'
export { applyTheme, setToken, readToken } from './theme/runtime.js'

// Animación (GSAP)
export { gsap, ScrollTrigger, useGSAP, MOTION, REDUCED, prefersReducedMotion } from './motion/gsap.js'
export { Preloader } from './motion/Preloader.jsx'
export { Reveal } from './motion/Reveal.jsx'
export { Loadable, Skeleton, SkeletonText, SkeletonCard } from './motion/Loadable.jsx'
export { Counter } from './motion/Counter.jsx'
export { Typewriter } from './motion/Typewriter.jsx'
export { useAppReady, onAppReady, isAppReady } from './motion/ready.js'

// Componentes
export { Button, IconButton, usePress } from './components/Button.jsx'
export { Card, CardHeader, StatCard } from './components/Card.jsx'
export { Page, PageTitle, Section, Grid } from './components/Page.jsx'
export { Badge, Notice } from './components/Badge.jsx'
export { Input, Textarea, Select, SearchField, Label } from './components/Field.jsx'
export { SegmentedControl } from './components/SegmentedControl.jsx'
export { Dialog, Drawer, Menu, MenuItem, MenuLabel, MenuDivider } from './components/Overlay.jsx'
export { BrandLogo, NavItem, NavSection } from './components/Nav.jsx'
export { Avatar, EmptyState, Table } from './components/Data.jsx'
export { UserButton } from './components/UserButton.jsx'

// Utilidades
export { cn } from './lib/cn.js'
export { useHashRoute } from './lib/useHashRoute.js'
