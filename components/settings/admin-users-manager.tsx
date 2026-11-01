'use client'

import { useEffect, useState } from 'react'

type Admin = { id: number; nom: string; email: string; login: string; role: string; statut: string; connecte?: boolean; date_creation?: string }

const roles = [
  { value: 'super_admin', label: 'Super administrateur' },
  { value: 'support', label: 'Support' },
  { value: 'moderateur', label: 'Modérateur' },
]

export function AdminUsersManager() {
  const [items, setItems] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ nom: '', email: '', login: '', password: '', role: 'support' })

  async function load() {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/administrators', { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Chargement impossible.')
      setItems(payload.data ?? [])
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/admin/administrators', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Création impossible.')
      setForm({ nom: '', email: '', login: '', password: '', role: 'support' })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création impossible.')
    } finally {
      setBusy(false)
    }
  }

  async function update(id: number, changes: Record<string, string>) {
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/admin/administrators', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...changes }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Modification impossible.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Modification impossible.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(item: Admin) {
    if (!window.confirm(`Supprimer le compte administrateur « ${item.login} » ?`)) return
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/admin/administrators?id=${item.id}`, { method: 'DELETE' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Suppression impossible.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression impossible.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-5">
        <h2 className="font-semibold">Comptes administrateurs</h2>
        <p className="mt-1 text-sm text-muted-foreground">Gestion des personnes qui administrent Bimbim. Réservée au super administrateur.</p>
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      <form onSubmit={create} className="grid gap-3 rounded-xl border border-border bg-background p-4 md:grid-cols-2">
        <input required maxLength={100} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Nom complet" className="rounded-lg border border-border bg-card px-3 py-2 text-sm" />
        <input required type="email" maxLength={100} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Adresse email" className="rounded-lg border border-border bg-card px-3 py-2 text-sm" />
        <input required maxLength={50} value={form.login} onChange={e => setForm({ ...form, login: e.target.value })} placeholder="Identifiant de connexion" className="rounded-lg border border-border bg-card px-3 py-2 text-sm" />
        <input required minLength={12} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Mot de passe (12 caractères min.)" className="rounded-lg border border-border bg-card px-3 py-2 text-sm" />
        <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          {roles.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
        </select>
        <button disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Créer le compte</button>
      </form>
      <div className="mt-5 divide-y divide-border">
        {loading ? <p className="py-6 text-sm text-muted-foreground">Chargement des administrateurs...</p> : items.length === 0 ? <p className="py-6 text-sm text-muted-foreground">Aucun compte disponible.</p> : items.map(item => (
          <div key={item.id} className="grid gap-3 py-4 md:grid-cols-[1.2fr_1.2fr_1fr_1fr_auto] md:items-center">
            <div><p className="text-sm font-semibold">{item.nom}</p><p className="text-xs text-muted-foreground">{item.login}</p></div>
            <p className="text-sm text-muted-foreground">{item.email}</p>
            <select aria-label={`Rôle de ${item.login}`} disabled={busy} value={item.role} onChange={e => void update(item.id, { role: e.target.value })} className="rounded-lg border border-border bg-background px-2 py-2 text-xs">
              {roles.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
            </select>
            <select aria-label={`Statut de ${item.login}`} disabled={busy} value={item.statut} onChange={e => void update(item.id, { statut: e.target.value })} className="rounded-lg border border-border bg-background px-2 py-2 text-xs">
              <option value="actif">Actif</option><option value="inactif">Inactif</option><option value="suspendu">Suspendu</option>
            </select>
            <button type="button" disabled={busy} onClick={() => void remove(item)} className="rounded-lg border border-danger/20 px-3 py-2 text-xs font-medium text-danger disabled:opacity-50">Supprimer</button>
          </div>
        ))}
      </div>
    </section>
  )
}
