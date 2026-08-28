'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Box, ChevronDown, LayoutDashboard, Menu, Settings, Truck, Users, X, MapPin, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Livraisons', href: '/deliveries', icon: Box },
  { label: 'Coursiers', href: '/couriers', icon: Truck },
  { label: 'Utilisateurs', href: '/users', icon: Users },
  { label: 'Notifications', href: '/notifications', icon: Bell, count: 2 },
]

export function AdminShell({ children, title, subtitle, action }: { children: React.ReactNode; title: string; subtitle?: string; action?: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [today, setToday] = useState('')

  useEffect(() => {
    setToday(new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()))
  }, [])

  return <div className="min-h-screen bg-background text-foreground">
    <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar px-4 py-6 text-sidebar-foreground transition-transform lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
      <div className="flex items-center justify-between px-3"><Link href="/dashboard" className="flex items-center gap-3" onClick={() => setOpen(false)} aria-label="Bimbim Admin, aller au dashboard"><span className="flex h-10 w-[116px] items-center overflow-hidden rounded-lg bg-sidebar"><img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-without-bg2-qlNlsreNIjCCrlqZNvED14ELbeLXEf.png" alt="bimbim" className="h-auto w-full object-contain" /></span><span className="sr-only">Bimbim ADMIN</span></Link><button className="rounded-lg p-2 hover:bg-sidebar-accent lg:hidden" aria-label="Fermer le menu" onClick={() => setOpen(false)}><X /></button></div>
      <div className="mt-12 flex flex-1 flex-col gap-1"><p className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/35">Workspace</p>{nav.map(item => { const Icon = item.icon; const active = pathname === item.href || pathname.startsWith(item.href + '/'); return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn('flex items-center justify-between rounded-xl px-3 py-3 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground', active && 'bg-primary text-primary-foreground font-semibold hover:bg-primary')}><span className="flex items-center gap-3"><Icon className="size-[18px]" />{item.label}</span>{item.count && <span className={cn('flex size-5 items-center justify-center rounded-full text-[11px]', active ? 'bg-sidebar/15' : 'bg-sidebar-foreground/10')}>{item.count}</span>}</Link>})}</div>
      <div className="flex flex-col gap-1 border-t border-sidebar-border pt-4"><Link href="/settings" onClick={() => setOpen(false)} className={cn('flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-sidebar-accent', pathname.startsWith('/settings') && 'bg-sidebar-accent')}><Settings className="size-[18px]" />Paramètres</Link><button className="mt-4 flex items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-sidebar-accent"><span className="flex size-8 items-center justify-center rounded-full bg-[#D8A77C] text-xs font-semibold text-sidebar">CM</span><span className="flex-1"><span className="block text-sm font-medium">Campbell M.</span><span className="block text-xs text-sidebar-foreground/45">Administrateur</span></span><ChevronDown className="size-4 text-sidebar-foreground/45" /></button></div>
    </aside>
    {open && <button className="fixed inset-0 z-30 bg-sidebar/30 lg:hidden" aria-label="Fermer le menu" onClick={() => setOpen(false)} />}
    <div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-border bg-background/95 px-5 backdrop-blur md:px-8"><div className="flex items-center gap-3"><button className="rounded-lg p-2 hover:bg-muted lg:hidden" aria-label="Ouvrir le menu" onClick={() => setOpen(true)}><Menu /></button><div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-muted-foreground sm:flex"><Search className="size-4" /><span className="text-sm">Rechercher...</span><kbd className="ml-8 rounded border bg-muted px-1.5 py-0.5 text-[10px]">⌘ K</kbd></div></div><div className="flex items-center gap-3"><button className="relative rounded-xl p-2.5 text-muted-foreground hover:bg-muted" aria-label="Notifications"><Bell className="size-5" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" /></button>{action}<span className="hidden h-8 w-px bg-border sm:block" /><div className="flex size-9 items-center justify-center rounded-full bg-[#D8A77C] text-xs font-semibold text-sidebar">CM</div></div></header><main className="mx-auto max-w-[1480px] px-5 py-8 md:px-8 md:py-10"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm font-medium capitalize text-muted-foreground" suppressHydrationWarning>{today}</p><h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>{subtitle && <p className="mt-2 text-sm text-muted-foreground md:text-base">{subtitle}</p>}</div></div>{children}</main></div>
  </div>
}

export function SectionHeader({ title, link }: { title: string; link?: string }) { return <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold">{title}</h2>{link && <Link href={link} className="text-sm font-medium text-primary-dark hover:underline">Voir tout <span aria-hidden="true">→</span></Link>}</div> }
export function StatusBadge({ status }: { status: string }) { const tone = status === 'Livrée' || status === 'Disponible' || status === 'Actif' ? 'status-success' : status === 'En attente' || status === 'Hors ligne' ? 'status-warning' : status === 'Annulée' ? 'status-danger' : 'status-info'; return <span className={cn('status-badge', tone)}><span className="size-1.5 rounded-full bg-current" />{status}</span> }
export function Avatar({ initials, color = 'bg-[#D8A77C]' }: { initials: string; color?: string }) { return <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-sidebar', color)}>{initials}</span> }
export function MapCard({ compact = false }: { compact?: boolean }) { return <div className={cn('map-surface relative overflow-hidden rounded-2xl border border-border', compact ? 'h-72' : 'h-80')}><div className="map-road road-a"/><div className="map-road road-b"/><div className="map-road road-c"/><div className="map-zone zone-a"/><div className="map-zone zone-b"/><div className="map-label label-a">Cocody</div><div className="map-label label-b">Plateau</div><div className="map-label label-c">Marcory</div>{[['24%','35%'],['52%','28%'],['68%','62%'],['35%','70%'],['76%','40%']].map(([left,top], i) => <span key={i} className={cn('map-pin', i === 2 && 'map-pin-active')} style={{left, top}}><MapPin className="size-3" /></span>)}<div className="absolute bottom-4 left-4 flex gap-3 rounded-lg border border-border bg-card/90 px-3 py-2 text-[11px] shadow-sm"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-primary-dark"/>Coursiers</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-warning"/>Demande forte</span></div></div> }
