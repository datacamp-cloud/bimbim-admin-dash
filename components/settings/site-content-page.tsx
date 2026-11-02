'use client'

import { useEffect, useState } from 'react'
import { Globe } from 'lucide-react'
import { AdminShell } from '@/components/layout/admin-shell'
import { SiteContentManager } from '@/components/settings/site-content-manager'

export function SiteContentPage() {
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetch('/api/admin/settings', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok) throw new Error(payload?.error ?? 'Impossible de vérifier les droits.')
        return payload
      })
      .then((payload) => {
        if (active) setRole(payload.admin?.role ?? null)
      })
      .catch(() => {
        if (active) setRole(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  return (
    <AdminShell title="Gestion du site" subtitle="Modifiez les contenus publiés sur le site public Bimbim.">
      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Vérification des autorisations...
        </div>
      ) : role !== 'super_admin' ? (
        <section className="rounded-2xl border border-border bg-card p-8">
          <div className="flex items-center gap-3">
            <Globe className="size-5 text-muted-foreground" />
            <h2 className="font-semibold">Accès réservé</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Seul un super administrateur peut gérer le contenu du site public.
          </p>
        </section>
      ) : (
        <SiteContentManager />
      )}
    </AdminShell>
  )
}
