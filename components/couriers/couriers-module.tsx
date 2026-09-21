'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Star, Truck, Users, WifiOff } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AdminShell, Avatar, StatusBadge } from '@/components/layout/admin-shell'

type Courier = {
  id: number
  matricule: string | null
  name: string
  initials: string
  phone: string
  vehicle: string
  status: string
  deliveries: number
  rating: number
  zone: string
  updatedAt: string
}

type StatCard = {
  label: string
  value: number
  icon: LucideIcon
}

export function CouriersModule() {
  const [data, setData] = useState<Courier[]>([])
  const [stats, setStats] = useState({ total: 0, actifs: 0, disponibles: 0, offline: 0 })
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/couriers', { cache: 'no-store' })
      .then((r) => r.json())
      .then((x) => {
        setData(x.data ?? [])
        setStats(x.stats ?? { total: 0, actifs: 0, disponibles: 0, offline: 0 })
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(
    () => data.filter((c) => `${c.name} ${c.matricule ?? ''} ${c.zone}`.toLowerCase().includes(q.toLowerCase())),
    [data, q],
  )

  const statCards: StatCard[] = [
    { label: 'Total', value: stats.total, icon: Users },
    { label: 'Actifs', value: stats.actifs, icon: Truck },
    { label: 'Disponibles', value: stats.disponibles, icon: Truck },
    { label: 'Hors ligne', value: stats.offline, icon: WifiOff },
  ]

  return (
    <AdminShell title="Coursiers" subtitle="Données issues directement de Neon.">
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-5">
              <Icon className="size-5 text-primary" />
              <p className="mt-4 text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border p-5">
            <div className="relative max-w-lg">
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un coursier..."
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-sm outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Aucun coursier.</div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((c) => (
                <div key={c.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1.5fr_1fr_1fr_100px_90px] md:items-center">
                  <div className="flex items-center gap-3">
                    <Avatar initials={c.initials} />
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone}</p>
                    </div>
                  </div>
                  <span className="text-sm">{c.vehicle}</span>
                  <span className="text-sm text-muted-foreground">{c.zone}</span>
                  <StatusBadge status={c.status} />
                  <span className="flex items-center gap-1 text-sm">
                    <Star className="size-3.5 fill-warning text-warning" />
                    {c.rating.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  )
}
