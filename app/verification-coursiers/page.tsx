"use client"

import { useCallback, useEffect, useState } from "react"
import { AdminShell, StatusBadge } from "@/components/layout/admin-shell"

type CourierRow = {
  id: number
  pseudo: string
  nom: string
  prenom: string
  telephone: string
  photo: boolean
  statut_compte: string
  date_creation: string
  type_engin: { nom: string }
  documents: { id: number; type_document: string; statut: string; date_creation: string }[]
}
type CourierDetail = {
  id: number
  pseudo: string
  nom: string
  prenom: string
  telephone: string
  genre: string | null
  photo: boolean
  cni: boolean
  permis: boolean
  immatriculation: string | null
  adresse: string | null
  statut_compte: string
  date_creation: string
  type_engin: { nom: string }
  documents: {
    id: number
    type_document: string
    nom_fichier: string
    mime_type: string
    taille: number
    statut: string
    date_creation: string
  }[]
}

const statusLabels: Record<string, string> = {
  en_verification: "En attente",
  actif: "Validé",
  rejete: "Rejeté",
  suspendu: "Suspendu",
  inactif: "Inactif",
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}
function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} Ko` : `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export default function CourierVerificationPage() {
  const [rows, setRows] = useState<CourierRow[]>([])
  const [stats, setStats] = useState({ en_attente: 0, valides: 0, rejetes: 0 })
  const [status, setStatus] = useState("en_verification")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selected, setSelected] = useState<CourierDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [decisionLoading, setDecisionLoading] = useState(false)
  const [reason, setReason] = useState("")
  const [notice, setNotice] = useState("")

  const loadRows = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (status) params.set("status", status)
      if (query.trim()) params.set("q", query.trim())
      const response = await fetch(`/api/admin/courier-verifications?${params.toString()}`, { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Chargement impossible.")
      setRows(payload.data ?? [])
      setStats(payload.stats ?? { en_attente: 0, valides: 0, rejetes: 0 })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.")
    } finally {
      setLoading(false)
    }
  }, [status, query])

  useEffect(() => { void loadRows() }, [loadRows])

  async function openDetail(id: number) {
    setSelected(null)
    setDetailLoading(true)
    setNotice("")
    setReason("")
    try {
      const response = await fetch(`/api/admin/courier-verifications/${id}`, { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Dossier indisponible.")
      setSelected(payload.data)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Impossible d'ouvrir ce dossier.")
    } finally {
      setDetailLoading(false)
    }
  }

  async function decide(decision: "valider" | "rejeter") {
    if (!selected) return
    if (decision === "rejeter" && reason.trim().length < 5) {
      setNotice("Précisez un motif de rejet (5 caractères minimum).")
      return
    }
    setDecisionLoading(true)
    setNotice("")
    try {
      const response = await fetch(`/api/admin/courier-verifications/${selected.id}/decision`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Décision non enregistrée.")
      setSelected(null)
      setNotice(decision === "valider" ? "Dossier validé. Le compte coursier est activé." : "Dossier rejeté.")
      await loadRows()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Une erreur est survenue.")
    } finally {
      setDecisionLoading(false)
    }
  }

  const canReview = selected?.statut_compte === "en_verification"
  const identityDocument = selected?.documents.some((doc) => ["cni", "piece_identite", "identite"].includes(doc.type_document.toLowerCase()))

  return (
    <AdminShell title="Vérification des dossiers coursiers" subtitle="Examinez les inscriptions effectuées depuis le site public Bimbim.">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "En attente", value: stats.en_attente },
          { label: "Validés", value: stats.valides },
          { label: "Rejetés", value: stats.rejetes },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un nom, pseudo ou téléphone" className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="en_verification">En attente</option>
          <option value="actif">Validés</option>
          <option value="rejete">Rejetés</option>
          <option value="">Tous les statuts</option>
        </select>
        <button onClick={() => void loadRows()} className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">Actualiser</button>
      </div>

      {notice && !selected && <p className="mt-4 rounded-lg bg-muted p-3 text-sm">{notice}</p>}
      {error && <p className="mt-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p>}

      <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">Inscriptions du site public</div>
        {loading ? <p className="p-6 text-sm text-muted-foreground">Chargement des dossiers…</p> :
          rows.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Aucun dossier pour ce filtre.</p> :
          <div className="divide-y divide-border">
            {rows.map((courier) => {
              const name = [courier.prenom, courier.nom].filter(Boolean).join(" ") || courier.pseudo
              return (
                <button key={courier.id} onClick={() => void openDetail(courier.id)} className="flex w-full flex-col gap-2 px-4 py-4 text-left transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    <span className="block text-sm font-semibold">{name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{courier.telephone} · {courier.type_engin.nom} · {courier.documents.length} document(s)</span>
                    <span className="mt-1 block text-xs text-muted-foreground">Inscrit le {formatDate(courier.date_creation)}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <StatusBadge status={statusLabels[courier.statut_compte] || courier.statut_compte} />
                    <span className="text-xs font-medium text-primary">Voir le dossier →</span>
                  </span>
                </button>
              )
            })}
          </div>}
      </div>

      {(detailLoading || selected) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null) }}>
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl">
            {detailLoading ? <p className="p-8 text-sm">Chargement du dossier…</p> : selected && (
              <>
                <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background p-5">
                  <div>
                    <h2 className="text-lg font-semibold">{selected.prenom} {selected.nom}</h2>
                    <p className="text-sm text-muted-foreground">Dossier #{selected.id} · {selected.telephone}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="rounded-lg border border-border px-3 py-2 text-sm">Fermer</button>
                </div>
                <div className="space-y-5 p-5">
                  {notice && <p className="rounded-lg bg-muted p-3 text-sm">{notice}</p>}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border p-3 text-sm"><span className="text-muted-foreground">Pseudo</span><p className="mt-1 font-medium">{selected.pseudo}</p></div>
                    <div className="rounded-xl border border-border p-3 text-sm"><span className="text-muted-foreground">Engin</span><p className="mt-1 font-medium">{selected.type_engin.nom}</p></div>
                    <div className="rounded-xl border border-border p-3 text-sm"><span className="text-muted-foreground">Immatriculation</span><p className="mt-1 font-medium">{selected.immatriculation || "Non renseignée"}</p></div>
                    <div className="rounded-xl border border-border p-3 text-sm"><span className="text-muted-foreground">Adresse</span><p className="mt-1 font-medium">{selected.adresse || "Non renseignée"}</p></div>
                  </div>
                  <section>
                    <h3 className="mb-3 text-sm font-semibold">Selfie de vérification</h3>
                    {selected.photo ? <img src={`/api/admin/courier-verifications/${selected.id}/files/selfie`} alt="Selfie du coursier" className="max-h-72 rounded-xl border border-border object-contain" /> : <p className="text-sm text-danger">Selfie absent</p>}
                  </section>
                  <section>
                    <h3 className="mb-3 text-sm font-semibold">Documents transmis</h3>
                    {selected.documents.length === 0 ? <p className="text-sm text-muted-foreground">Aucun document transmis.</p> :
                      <div className="grid gap-3 sm:grid-cols-2">
                        {selected.documents.map((doc) => {
                          const src = `/api/admin/courier-verifications/${selected.id}/files/${doc.id}`
                          return <div key={doc.id} className="overflow-hidden rounded-xl border border-border p-3">
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <div><p className="text-sm font-medium">{doc.type_document}</p><p className="text-xs text-muted-foreground">{doc.nom_fichier} · {formatSize(doc.taille)}</p></div>
                              <StatusBadge status={doc.statut} />
                            </div>
                            {doc.mime_type === "application/pdf" ? <a href={src} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary underline">Ouvrir le PDF</a> : <a href={src} target="_blank" rel="noreferrer"><img src={src} alt={doc.type_document} className="max-h-56 w-full rounded-lg object-contain" /></a>}
                          </div>
                        })}
                      </div>}
                  </section>
                  {canReview && (
                    <section className="space-y-3 border-t border-border pt-5">
                      <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                        Pour valider, le dossier doit contenir une pièce d’identité et un selfie. {identityDocument ? "Pièce d’identité détectée." : "Pièce d’identité manquante."} {selected.photo ? "Selfie détecté." : "Selfie manquant."}
                      </div>
                      <label className="block text-sm font-medium">Motif de rejet (obligatoire uniquement en cas de rejet)</label>
                      <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} maxLength={1000} placeholder="Indiquez précisément les éléments à corriger…" className="w-full rounded-lg border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
                      <div className="flex flex-wrap justify-end gap-2">
                        <button disabled={decisionLoading} onClick={() => void decide("rejeter")} className="rounded-lg border border-danger px-4 py-2.5 text-sm font-medium text-danger disabled:opacity-50">{decisionLoading ? "Traitement…" : "Rejeter le dossier"}</button>
                        <button disabled={decisionLoading || !identityDocument || !selected.photo} onClick={() => void decide("valider")} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">{decisionLoading ? "Traitement…" : "Valider et activer le compte"}</button>
                      </div>
                    </section>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  )
}
