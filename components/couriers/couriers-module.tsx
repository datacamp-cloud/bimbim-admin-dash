'use client'

import { useMemo, useState } from 'react'
import { Activity, ChevronDown, Clock3, MapPin, MessageSquare, MoreHorizontal, Search, Star, Truck, Users, WifiOff } from 'lucide-react'
import { couriers, type CourierStatus } from '@/lib/mock-data'
import { AdminShell, Avatar, SectionHeader, StatusBadge } from '@/components/layout/admin-shell'
import { cn } from '@/lib/utils'

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(23,32,24,0.02)]', className)}>{children}</div>
}

const statusOptions: Array<CourierStatus | 'Tous'> = ['Tous', 'Disponible', 'En livraison', 'Hors ligne']
const zoneOptions = ['Toutes', ...Array.from(new Set(couriers.map((courier) => courier.zone)))]

export function CouriersModule() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<CourierStatus | 'Tous'>('Tous')
  const [zone, setZone] = useState('Toutes')
  const [sort, setSort] = useState<'activity' | 'deliveries' | 'rating'>('activity')
  const [feedback, setFeedback] = useState('')

  const filtered = useMemo(() => couriers.filter((courier) => {
    const haystack = `${courier.name} ${courier.id} ${courier.zone}`.toLowerCase()
    return haystack.includes(query.toLowerCase()) && (status === 'Tous' || courier.status === status) && (zone === 'Toutes' || courier.zone === zone)
  }).sort((a, b) => sort === 'rating' ? Number(b.rating) - Number(a.rating) : sort === 'deliveries' ? b.deliveries - a.deliveries : a.activity.localeCompare(b.activity)), [query, status, zone, sort])

  const counts = {
    total: 82,
    active: 46,
    available: 18,
    offline: 18,
  }

  const notify = (message: string) => {
    setFeedback(message)
    window.setTimeout(() => setFeedback(''), 2400)
  }

  return <AdminShell title="Coursiers" subtitle="Supervisez la disponibilité et la performance de votre flotte.">
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <FleetStat label="Flotte totale" value={counts.total} detail="82 coursiers inscrits" icon={Users} />
        <FleetStat label="Actifs maintenant" value={counts.active} detail="56% de la flotte" icon={Activity} tone="primary" />
        <FleetStat label="Disponibles" value={counts.available} detail="Prêts à recevoir" icon={Truck} tone="success" />
        <FleetStat label="Hors ligne" value={counts.offline} detail="À vérifier" icon={WifiOff} tone="warning" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.34fr]">
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-border p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Rechercher un coursier" placeholder="Rechercher par nom, ID ou zone..." className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-primary-dark focus:ring-2 focus:ring-primary/30" /></div>
              <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} aria-label="Trier les coursiers" className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"><option value="activity">Dernière activité</option><option value="deliveries">Plus de livraisons</option><option value="rating">Meilleure note</option></select>
            </div>
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrer par statut">
              {statusOptions.map((option) => <button key={option} onClick={() => setStatus(option)} className={cn('rounded-lg px-3 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark', status === option ? 'bg-sidebar text-card' : 'bg-muted text-muted-foreground hover:bg-border')}>{option}</button>)}
              <span className="hidden h-5 w-px bg-border sm:block" />
              <div className="flex items-center gap-2"><MapPin className="size-3.5 text-muted-foreground" /><select value={zone} onChange={(event) => setZone(event.target.value)} aria-label="Filtrer par zone" className="bg-transparent text-xs font-medium text-muted-foreground outline-none"><option value="Toutes">Toutes les zones</option>{zoneOptions.slice(1).map((option) => <option key={option} value={option}>{option}</option>)}</select><ChevronDown className="pointer-events-none -ml-5 size-3.5 text-muted-foreground" /></div>
            </div>
          </div>
          {feedback && <div role="status" className="border-b border-primary/20 bg-primary/10 px-5 py-3 text-sm font-medium text-primary-dark">{feedback}</div>}
          {filtered.length === 0 ? <div className="flex flex-col items-center gap-3 px-5 py-16 text-center"><Users className="size-10 text-muted-foreground" /><h2 className="font-semibold">Aucun coursier trouvé</h2><p className="text-sm text-muted-foreground">Modifiez votre recherche ou vos filtres.</p></div> : <>
            <div className="hidden overflow-x-auto md:block"><table className="w-full text-left"><thead className="border-b border-border bg-muted/35 text-[11px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-5 py-3 font-semibold">Coursier</th><th className="px-5 py-3 font-semibold">Zone</th><th className="px-5 py-3 font-semibold">Disponibilité</th><th className="px-5 py-3 font-semibold">Performance</th><th className="px-5 py-3 font-semibold">Activité</th><th className="px-5 py-3" /></tr></thead><tbody>{filtered.map((courier) => <tr key={courier.id} className="border-b border-border last:border-0 hover:bg-muted/30"><td className="px-5 py-4"><div className="flex items-center gap-3"><Avatar initials={courier.initials} /><div><p className="text-sm font-medium">{courier.name}</p><p className="font-mono text-xs text-muted-foreground">{courier.id}</p></div></div></td><td className="px-5 py-4 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{courier.zone}</span></td><td className="px-5 py-4"><StatusBadge status={courier.status} /></td><td className="px-5 py-4"><div className="flex items-center gap-3 text-sm"><span className="font-medium">{courier.deliveries} livr.</span><span className="inline-flex items-center gap-1 text-muted-foreground"><Star className="size-3.5 fill-warning text-warning" />{courier.rating}</span></div></td><td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="size-3.5" />{courier.activity}</span></td><td className="px-5 py-4 text-right"><button onClick={() => notify(`Actions ouvertes pour ${courier.name}`)} aria-label={`Actions pour ${courier.name}`} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><MoreHorizontal className="size-4" /></button></td></tr>)}</tbody></table></div>
            <div className="flex flex-col md:hidden">{filtered.map((courier) => <div key={courier.id} className="flex flex-col gap-4 border-b border-border p-5 last:border-0"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><Avatar initials={courier.initials} /><div><p className="font-medium">{courier.name}</p><p className="font-mono text-xs text-muted-foreground">{courier.id}</p></div></div><StatusBadge status={courier.status} /></div><div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-muted-foreground">Zone</p><p className="mt-1 inline-flex items-center gap-1"><MapPin className="size-3.5 text-muted-foreground" />{courier.zone}</p></div><div><p className="text-xs text-muted-foreground">Activité</p><p className="mt-1 text-muted-foreground">{courier.activity}</p></div><div><p className="text-xs text-muted-foreground">Livraisons</p><p className="mt-1 font-medium">{courier.deliveries} aujourd'hui</p></div><div><p className="text-xs text-muted-foreground">Note</p><p className="mt-1 inline-flex items-center gap-1"><Star className="size-3.5 fill-warning text-warning" />{courier.rating}</p></div></div><button onClick={() => notify(`Message prêt pour ${courier.name}`)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-medium hover:bg-muted"><MessageSquare className="size-4" />Contacter</button></div>)}</div>
          </>}
        </Card>
        <Card className="p-5"><SectionHeader title="Lecture opérationnelle" /><div className="mt-5 flex flex-col gap-4"><div className="rounded-xl bg-muted/60 p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Couverture active</p><p className="mt-2 text-2xl font-semibold">56%</p><p className="mt-1 text-xs text-muted-foreground">46 coursiers en activité sur 82</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-border"><div className="h-full w-[56%] rounded-full bg-primary-dark" /></div></div><div className="rounded-xl border border-warning/25 bg-warning/8 p-4"><p className="text-sm font-semibold">18 coursiers hors ligne</p><p className="mt-1 text-xs leading-5 text-muted-foreground">3 sont situés dans des zones à forte demande.</p><button onClick={() => { setStatus('Hors ligne'); notify('Filtre hors ligne appliqué') }} className="mt-3 text-xs font-semibold text-warning hover:underline">Voir les concernés</button></div><div className="rounded-xl border border-dashed border-border p-4"><p className="inline-flex items-center gap-2 text-sm font-semibold"><MapPin className="size-4 text-primary-dark" />Position GPS</p><p className="mt-1 text-xs leading-5 text-muted-foreground">La carte temps réel sera connectée ici via l'API GPS des coursiers.</p><span className="mt-3 inline-flex rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">Intégration à venir</span></div></div></Card>
      </div>
    </div>
  </AdminShell>
}

function FleetStat({ label, value, detail, icon: Icon, tone = 'neutral' }: { label: string; value: number; detail: string; icon: typeof Users; tone?: 'neutral' | 'primary' | 'success' | 'warning' }) {
  return <Card className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-2 text-xs text-muted-foreground">{detail}</p></div><span className={cn('flex size-10 items-center justify-center rounded-xl', tone === 'primary' ? 'bg-primary/20 text-primary-dark' : tone === 'success' ? 'bg-success/12 text-success' : tone === 'warning' ? 'bg-warning/12 text-warning' : 'bg-muted text-muted-foreground')}><Icon className="size-5" /></span></div></Card>
}
