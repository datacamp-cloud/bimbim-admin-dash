'use client'

import { useEffect, useState } from 'react'

type Content = { id: number; key: string; section: string; title: string | null; body: string | null; image_url: string | null; button_label: string | null; button_url: string | null; enabled: boolean; sort_order: number }

const empty = { key: '', section: 'hero', title: '', body: '', image_url: '', button_label: '', button_url: '', enabled: true, sort_order: 0 }

export function SiteContentManager() {
  const [items, setItems] = useState<Content[]>([])
  const [draft, setDraft] = useState(empty)
  const [editing, setEditing] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function load() {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/site-content', { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Chargement impossible.')
      setItems(payload.data ?? [])
      setError('')
    } catch (err) { setError(err instanceof Error ? err.message : 'Chargement impossible.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  function edit(item: Content) {
    setEditing(item.id)
    setDraft({ key: item.key, section: item.section, title: item.title ?? '', body: item.body ?? '', image_url: item.image_url ?? '', button_label: item.button_label ?? '', button_url: item.button_url ?? '', enabled: item.enabled, sort_order: item.sort_order })
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true); setError(''); setNotice('')
    try {
      const response = await fetch('/api/admin/site-content', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing ? { ...draft, id: editing } : draft),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Enregistrement impossible.')
      setDraft(empty); setEditing(null); setNotice('Contenu enregistré.')
      await load()
    } catch (err) { setError(err instanceof Error ? err.message : 'Enregistrement impossible.') }
    finally { setBusy(false) }
  }

  async function remove(item: Content) {
    if (!window.confirm(`Supprimer le contenu « ${item.key} » ?`)) return
    setBusy(true); setError('')
    try {
      const response = await fetch(`/api/admin/site-content?id=${item.id}`, { method: 'DELETE' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Suppression impossible.')
      if (editing === item.id) { setEditing(null); setDraft(empty) }
      await load()
    } catch (err) { setError(err instanceof Error ? err.message : 'Suppression impossible.') }
    finally { setBusy(false) }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-5"><h2 className="font-semibold">Contenus du site public</h2><p className="mt-1 text-sm text-muted-foreground">Modifiez les textes, liens et images affichés sur le site Bimbim. Les images peuvent être renseignées avec une URL HTTPS ou un chemin public.</p></div>
      {error && <p role="alert" className="mb-3 rounded-xl bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {notice && <p role="status" className="mb-3 rounded-xl bg-success/10 p-3 text-sm text-success">{notice}</p>}
      <form onSubmit={save} className="grid gap-3 rounded-xl border border-border bg-background p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <input required disabled={editing !== null} value={draft.key} onChange={e => setDraft({ ...draft, key: e.target.value })} placeholder="Clé unique (ex. hero)" className="rounded-lg border border-border bg-card px-3 py-2 text-sm" />
          <input required value={draft.section} onChange={e => setDraft({ ...draft, section: e.target.value })} placeholder="Section (hero, features...)" className="rounded-lg border border-border bg-card px-3 py-2 text-sm" />
        </div>
        <input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="Titre" className="rounded-lg border border-border bg-card px-3 py-2 text-sm" />
        <textarea rows={3} value={draft.body} onChange={e => setDraft({ ...draft, body: e.target.value })} placeholder="Texte / description" className="rounded-lg border border-border bg-card px-3 py-2 text-sm" />
        <input type="text" value={draft.image_url} onChange={e => setDraft({ ...draft, image_url: e.target.value })} placeholder="URL HTTPS de l'image" className="rounded-lg border border-border bg-card px-3 py-2 text-sm" />
        <div className="grid gap-3 md:grid-cols-2">
          <input value={draft.button_label} onChange={e => setDraft({ ...draft, button_label: e.target.value })} placeholder="Texte du bouton" className="rounded-lg border border-border bg-card px-3 py-2 text-sm" />
          <input value={draft.button_url} onChange={e => setDraft({ ...draft, button_url: e.target.value })} placeholder="Lien du bouton" className="rounded-lg border border-border bg-card px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.enabled} onChange={e => setDraft({ ...draft, enabled: e.target.checked })} /> Publié</label>
          <label className="flex items-center gap-2 text-sm">Ordre <input type="number" value={draft.sort_order} onChange={e => setDraft({ ...draft, sort_order: Number(e.target.value) })} className="w-20 rounded-lg border border-border bg-card px-2 py-1" /></label>
          <button disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{editing ? 'Enregistrer les modifications' : 'Ajouter le contenu'}</button>
          {editing !== null && <button type="button" onClick={() => { setEditing(null); setDraft(empty) }} className="rounded-lg border border-border px-4 py-2 text-sm">Annuler</button>}
        </div>
      </form>
      <div className="mt-5 divide-y divide-border">
        {loading ? <p className="py-5 text-sm text-muted-foreground">Chargement...</p> : items.length === 0 ? <p className="py-5 text-sm text-muted-foreground">Aucun contenu enregistré.</p> : items.map(item => (
          <div key={item.id} className="flex flex-wrap items-center gap-3 py-4">
            {item.image_url && <img src={item.image_url} alt="" className="size-14 rounded-lg border border-border object-cover" />}
            <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{item.title || item.key}</p><p className="text-xs text-muted-foreground">{item.section} · {item.key} · {item.enabled ? 'Publié' : 'Masqué'}</p></div>
            <button type="button" disabled={busy} onClick={() => edit(item)} className="rounded-lg border border-border px-3 py-2 text-xs">Modifier</button>
            <button type="button" disabled={busy} onClick={() => void remove(item)} className="rounded-lg border border-danger/20 px-3 py-2 text-xs text-danger">Supprimer</button>
          </div>
        ))}
      </div>
    </section>
  )
}
