'use client'
import { useRef, useState } from 'react'
import { ChevronsUpDown } from 'lucide-react'
import { cn } from '../lib/cn.js'
import { Avatar } from './Data.jsx'
import { Menu, MenuDivider, MenuItem } from './Overlay.jsx'

// Botón de cuenta (slot "user"). showName: foto + nombre (barra lateral); sin él, solo la foto (navbar).
// user: { name, avatar, meta, menu: [{ label, icon, onSelect, danger } | 'divider'] }
export function UserButton({ user, showName = false, className }) {
  const anchor = useRef(null)
  const [open, setOpen] = useState(false)
  if (!user) return null
  return <>
    <button ref={anchor} type="button" onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} aria-label={`Cuenta de ${user.name}`}
      className={cn('flex min-w-0 items-center gap-2.5 rounded-xl text-left transition hover:bg-ink/[.05]', showName ? 'w-full p-1.5' : 'p-1', className)}>
      <Avatar src={user.avatar} name={user.name} size="sm"/>
      {showName && <><span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{user.name}</span>
        {user.meta && <span className="block truncate text-[11px] text-ink/40">{user.meta}</span>}
      </span><ChevronsUpDown size={14} className="shrink-0 text-ink/35"/></>}
    </button>
    {open && user.menu?.length > 0 && <Menu anchor={anchor.current} onClose={() => setOpen(false)} align={showName ? 'start' : 'end'}>
      {user.menu.map((item, index) => (item === 'divider'
        ? <MenuDivider key={index}/>
        : <MenuItem key={item.label} icon={item.icon} danger={item.danger} onClick={() => { setOpen(false); item.onSelect?.() }}>{item.label}</MenuItem>))}
    </Menu>}
  </>
}
