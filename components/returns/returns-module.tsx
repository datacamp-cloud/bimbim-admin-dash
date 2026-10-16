'use client'

import { useEffect, useState } from "react"
import { Search, Check, X } from "lucide-react"
import { AdminShell, StatusBadge, Avatar } from "@/components/layout/admin-shell"

type ReturnItem = {
  id: number
  status: string
  motif: string
  date: string
  livraison: { id: number; adresse_ramassage: string; adresse_livraison: string; statut: string }
  livreur: { id: number; nom: string; prenom: string; telephone: string }
}

const label = (status: string) =>
  ({ en_attente: "En attente", valide: "Validé", rejete: "Rejeté" }[status] ?? status)

export function ReturnsModule() {
  const [data, setData] = useState<ReturnItem[]>([])
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionError, setActionError] = useState("")
  const [processingId, setProcessingId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      setError("")
      const params = new URLSearchParams()
      if (q.trim()) params.set("q", q.trim())
      if (status) params.set("status", status)
      try {
        const response = await fetch("/api/admin/returns?" + params.toString(), {
          cache: "no-store",
          signal: controller.signal,
        })
        const payload = await response.json()
        if (!response.ok) throw new Error(payload?.error ?? "Impossible de charger les retours.")
        if (!cancelled) setData(payload.data ?? [])
      } catch (err) {
        if (!cancelled && !(err instanceof DOMException && err.name === "AbortError")) {
          setData([])
          setError("Impossible de charger les retours. Réessayez.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 200)

    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(timer)
    }
  }, [q, status])

  const updateStatus = async (id: number, nextStatus: "valide" | "rejete") => {
    setProcessingId(id)
    setActionError("")
    try {
      const response = await fetch("/api/admin/returns/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error ?? "Impossible de traiter ce retour.")
      setData((current) =>
        current.map((item) => item.id === id ? { ...item, status: nextStatus } : item),
      )
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Impossible de traiter ce retour.")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <AdminShell title="Retours de colis" subtitle="Consultez les retours enregistrés et traitez ceux en attente.">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-5 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un retour, coursier ou adresse..." className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
            <option value="">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="valide">Validé</option>
            <option value="rejete">Rejeté</option>
          </select>
        </div>
        {actionError && <div role="alert" className="border-b border-danger/20 bg-danger/5 px-5 py-3 text-sm text-danger">{actionError}</div>}
        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Chargement...</div>
        ) : error ? (
          <div role="alert" className="p-10 text-center text-sm text-danger">{error}</div>
        ) : data.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Aucun retour trouvé.</div>
        ) : (
          <div className="divide-y divide-border">
            {data.map((item) => (
              <div key={item.id} className="grid gap-3 px-5 py-4 md:grid-cols-[100px_1.3fr_1.2fr_1fr_110px] md:items-center">
                <div className="font-mono text-xs font-semibold text-primary">#RT-{String(item.id).padStart(4, "0")}</div>
                <div>
                  <p className="text-sm font-medium">Livraison #{item.livraison.id}</p>
                  <p className="text-xs text-muted-foreground">{item.motif}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.livraison.adresse_ramassage} → {item.livraison.adresse_livraison}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Avatar initials={(item.livreur.prenom?.[0] ?? "") + (item.livreur.nom?.[0] ?? "")} />
                  <div><p className="text-sm">{item.livreur.prenom} {item.livreur.nom}</p><p className="text-xs text-muted-foreground">{item.livreur.telephone}</p></div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleString("fr-FR")}</p>
                  <div className="mt-1"><StatusBadge status={label(item.status)} /></div>
                </div>
                {item.status === "en_attente" ? (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={processingId !== null} onClick={() => void updateStatus(item.id, "valide")} className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                      <Check className="size-3.5" /> Valider
                    </button>
                    <button type="button" disabled={processingId !== null} onClick={() => void updateStatus(item.id, "rejete")} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-2 text-xs font-semibold hover:bg-muted disabled:opacity-50">
                      <X className="size-3.5" /> Rejeter
                    </button>
                  </div>
                ) : <span className="text-xs text-muted-foreground">Traité</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
