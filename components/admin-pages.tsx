'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Bell, Search } from 'lucide-react'
import { AdminShell, Avatar, StatusBadge } from '@/components/layout/admin-shell'

export function UsersPage() {
  return (
    <Suspense
      fallback={
        <AdminShell title="Utilisateurs" subtitle="Chargement...">
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Chargement des utilisateurs...
          </div>
        </AdminShell>
      }
    >
      <UsersPageContent />
    </Suspense>
  )
}

function UsersPageContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type')
  const isPartnersPage = type === 'partners'

  const [data, setData] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, actifs: 0, nouveaux: 0 })
  const [q, setQ] = useState('')

  useEffect(() => {
    const url = new URL('/api/admin/users', window.location.origin)
    if (q) url.searchParams.set('q', q)
    if (isPartnersPage) url.searchParams.set('type', 'partners')

    const t = setTimeout(() => {
      fetch(url.toString(), { cache: 'no-store' })
        .then((r) => r.json())
        .then((x) => {
          setData(x.data ?? [])
          setStats(x.stats ?? { total: 0, actifs: 0, nouveaux: 0 })
        })
    }, 250)

    return () => clearTimeout(t)
  }, [q, isPartnersPage])

  const filtered = useMemo(
    () =>
      data.filter((u) => {
        const haystack = `${u.name ?? u.nom ?? ''} ${u.email ?? ''} ${u.telephone ?? ''}`.toLowerCase()
        return haystack.includes(q.toLowerCase())
      }),
    [data, q],
  )

  return (
    <AdminShell title={isPartnersPage ? 'Partenaires' : 'Utilisateurs'} subtitle={isPartnersPage ? 'Clients entreprise actifs.' : 'Données clients issues de Neon.'}>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Total', stats.total],
          ['Actifs', stats.actifs],
          ['Nouveaux · 30 jours', stats.nouveaux],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-bold">{String(value)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border p-5">
          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nom, email ou téléphone..."
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-sm outline-none"
            />
          </div>
        </div>

        <div className="divide-y divide-border">
          {filtered.map((u) => (
            <div key={u.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1.4fr_1.3fr_1fr_100px_100px] md:items-center">
              <div className="flex items-center gap-3">
                <Avatar initials={(u.name ?? u.nom ?? '?').split(' ').map((x: string) => x[0]).join('').slice(0, 2)} />
                <span className="text-sm font-medium">{u.name ?? u.nom ?? 'Sans nom'}</span>
              </div>
              <span className="text-sm text-muted-foreground">{u.email ?? '—'}</span>
              <span className="text-sm text-muted-foreground">{u.telephone}</span>
              <span className="text-sm">{u.deliveries}</span>
              <StatusBadge status={u.statut} />
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  )
}

export function NotificationsPage(){
 const [data,setData]=useState<any[]>([])
 useEffect(()=>{fetch('/api/admin/notifications',{cache:'no-store'}).then(r=>r.json()).then(x=>setData(x.data??[]))},[])
 return <AdminShell title="Notifications" subtitle="Notifications enregistrées dans Neon."><div className="rounded-2xl border border-border bg-card divide-y divide-border">{data.length===0?<div className="p-10 text-center text-sm text-muted-foreground">Aucune notification.</div>:data.map(n=><div key={n.id} className="flex gap-4 p-5"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted"><Bell className="size-4"/></span><div><p className="font-medium">{n.title}</p><p className="mt-1 text-sm text-muted-foreground">{n.description}</p><p className="mt-2 text-xs text-muted-foreground">{new Date(n.date).toLocaleString('fr-FR')} · {n.status}</p></div></div>)}</div></AdminShell>
}
