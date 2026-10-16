'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Bell, Search, Trash2 } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const t = setTimeout(async () => {
      setLoading(true)
      setError('')
      const url = new URL('/api/admin/users', window.location.origin)
      if (q.trim()) url.searchParams.set('q', q.trim())
      if (isPartnersPage) url.searchParams.set('type', 'partners')
      try {
        const response = await fetch(url.toString(), { cache: 'no-store', signal: controller.signal })
        const payload = await response.json()
        if (!response.ok) throw new Error(payload?.error ?? 'Impossible de charger les utilisateurs.')
        if (!cancelled) {
          setData(payload.data ?? [])
          setStats(payload.stats ?? { total: 0, actifs: 0, nouveaux: 0 })
        }
      } catch (err) {
        if (!cancelled && !(err instanceof DOMException && err.name === 'AbortError')) {
          setData([])
          setError('Impossible de charger les utilisateurs. Réessayez.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 250)
    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(t)
    }
  }, [q, isPartnersPage])

  return (
    <AdminShell title={isPartnersPage ? 'Partenaires' : 'Utilisateurs'} subtitle={isPartnersPage ? 'Clients entreprise enregistrés.' : 'Données clients issues de Neon.'}>
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
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, email ou téléphone..." className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-sm outline-none" />
          </div>
        </div>
        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Chargement...</div>
        ) : error ? (
          <div role="alert" className="p-10 text-center text-sm text-danger">{error}</div>
        ) : data.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Aucun {isPartnersPage ? 'partenaire' : 'utilisateur'} trouvé.</div>
        ) : (
          <div className="divide-y divide-border">
            {data.map((u) => (
              <div key={u.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1.4fr_1.3fr_1fr_100px_100px] md:items-center">
                <div className="flex items-center gap-3">
                  <Avatar initials={(u.name ?? u.nom ?? '?').split(' ').map((x: string) => x[0]).join('').slice(0, 2)} />
                  <span className="text-sm font-medium">{u.name ?? u.nom ?? 'Sans nom'}</span>
                </div>
                <span className="text-sm text-muted-foreground">{u.email ?? '—'}</span>
                <span className="text-sm text-muted-foreground">{u.telephone ?? '—'}</span>
                <span className="text-sm">{u.deliveries ?? 0}</span>
                <StatusBadge status={u.statut} />
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  )
}

export function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <AdminShell title="Notifications" subtitle="Chargement...">
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Chargement du module...
          </div>
        </AdminShell>
      }
    >
      <CommunicationPageContent />
    </Suspense>
  )
}

function CommunicationPageContent() {
  const searchParams = useSearchParams()
  const view = searchParams.get('view') ?? 'notifications'
  const [data, setData] = useState<any[]>([])
  const [channel, setChannel] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadNotifications = async () => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    if (channel) params.set('channel', channel)
    if (status) params.set('status', status)
    try {
      const response = await fetch('/api/admin/notifications?' + params.toString(), { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error ?? 'Impossible de charger les notifications.')
      setData(payload.data ?? [])
    } catch {
      setData([])
      setError('Impossible de charger les notifications. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (view === 'notifications') void loadNotifications()
  }, [view, channel, status])

  const deleteNotification = async (id: number) => {
    setDeletingId(id)
    setActionError('')
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error ?? 'Suppression impossible.')
      setData((current) => current.filter((item) => item.id !== id))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Impossible de supprimer la notification.')
    } finally {
      setDeletingId(null)
    }
  }

  if (view === 'messages') {
    return (
      <AdminShell title="Messages" subtitle="Centre de communication avec les utilisateurs et partenaires.">
        <section className="rounded-2xl border border-border bg-card p-10 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Bell className="size-6" /></span>
          <h2 className="mt-4 font-semibold">Messagerie</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Aucun modèle de conversation ni endpoint de messagerie n’est disponible dans la base et l’API actuelles. Cette vue reste informative : aucun message fictif n’est affiché.
          </p>
        </section>
      </AdminShell>
    )
  }

  if (view === 'news') {
    return (
      <AdminShell title="Actualités" subtitle="Actualités destinées à l’écosystème Bimbim.">
        <section className="rounded-2xl border border-border bg-card p-10 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Bell className="size-6" /></span>
          <h2 className="mt-4 font-semibold">Actualités Bimbim</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Aucun modèle de publication ni endpoint d’actualités n’est disponible actuellement. La publication n’est pas simulée.
          </p>
        </section>
      </AdminShell>
    )
  }

  return (
    <AdminShell title="Notifications" subtitle="Notifications enregistrées dans Neon.">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {['', 'sms', 'push', 'email'].map((item) => (
            <button key={item || 'all-channels'} type="button" onClick={() => setChannel(item)} className={`rounded-xl px-3 py-2 text-sm font-medium ${channel === item ? 'bg-primary text-primary-foreground' : 'border border-border bg-card hover:bg-muted'}`}>
              {item ? item.toUpperCase() : 'Tous les canaux'}
            </button>
          ))}
        </div>
        <select aria-label="Filtrer par statut" value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
          <option value="">Tous les statuts</option>
          <option value="envoye">Envoyée</option>
          <option value="en_attente">En attente</option>
          <option value="echec">Échec</option>
        </select>
      </div>
      {actionError && <div role="alert" className="mb-4 rounded-xl border border-danger/20 bg-danger/5 p-3 text-sm text-danger">{actionError}</div>}
      <div className="rounded-2xl border border-border bg-card divide-y divide-border">
        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Chargement...</div>
        ) : error ? (
          <div role="alert" className="p-10 text-center text-sm text-danger">{error}</div>
        ) : data.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Aucune notification pour ces filtres.</div>
        ) : (
          data.map((n) => (
            <div key={n.id} className="flex items-start gap-4 p-5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted"><Bell className="size-4" /></span>
              <div className="min-w-0">
                <p className="font-medium">{n.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{n.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">{new Date(n.date).toLocaleString('fr-FR')} · {n.status}</p>
              </div>
              <button type="button" aria-label={`Supprimer la notification ${n.id}`} disabled={deletingId !== null} onClick={() => void deleteNotification(n.id)} className="ml-auto rounded-lg p-2 text-muted-foreground hover:bg-danger/10 hover:text-danger disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </AdminShell>
  )
}
