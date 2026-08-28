'use client'

import { useState } from 'react'
import { Bell, Check, ChevronRight, LockKeyhole, Save, ShieldCheck, SlidersHorizontal, UserRound } from 'lucide-react'
import { AdminShell } from '@/components/layout/admin-shell'
import { cn } from '@/lib/utils'

const sections = [
  { id: 'general', label: 'Général', icon: SlidersHorizontal },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Sécurité', icon: ShieldCheck },
]

function Toggle({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-4">
      <div><p className="text-sm font-semibold">{label}</p><p className="mt-1 max-w-lg text-xs leading-5 text-muted-foreground">{description}</p></div>
      <button type="button" aria-label={label} aria-pressed={value} onClick={() => onChange(!value)} className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary', value ? 'bg-primary-dark' : 'bg-muted')}><span className={cn('absolute top-1 size-4 rounded-full bg-card shadow-sm transition-transform', value ? 'translate-x-6' : 'translate-x-1')} /></button>
    </div>
  )
}

export function SettingsModule() {
  const [active, setActive] = useState('general')
  const [autoAssign, setAutoAssign] = useState(true)
  const [opsAlerts, setOpsAlerts] = useState(true)
  const [systemAlerts, setSystemAlerts] = useState(false)
  const [saved, setSaved] = useState(false)
  const save = () => { setSaved(true); window.setTimeout(() => setSaved(false), 2200) }

  return (
    <AdminShell title="Paramètres" subtitle="Configurez Bimbim selon les besoins de votre équipe.">
      <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
        <nav aria-label="Sections des paramètres" className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
          {sections.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setActive(id)} className={cn('flex min-w-max items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition-colors', active === id ? 'bg-sidebar font-semibold text-card' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}><Icon className="size-4" />{label}<ChevronRight className="ml-auto hidden size-4 lg:block" /></button>)}
          <button type="button" className="flex min-w-max items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-muted-foreground hover:bg-muted"><LockKeyhole className="size-4" />Opérations</button>
        </nav>
        <div className="flex min-w-0 flex-col gap-6">
          {active === 'general' && <><section className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-base font-semibold">Organisation</p><p className="mt-1 text-sm text-muted-foreground">Les informations visibles par votre équipe Bimbim.</p></div><span className="hidden rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary-dark sm:inline-flex">Compte actif</span></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="flex flex-col gap-2 text-sm font-medium">Nom de l’organisation<input defaultValue="Bimbim Côte d’Ivoire" className="rounded-xl border border-border bg-background px-3 py-3 font-normal outline-none focus:border-primary-dark focus:ring-2 focus:ring-primary/30" /></label><label className="flex flex-col gap-2 text-sm font-medium">Email administrateur<input type="email" defaultValue="campbell@bimbim.ci" className="rounded-xl border border-border bg-background px-3 py-3 font-normal outline-none focus:border-primary-dark focus:ring-2 focus:ring-primary/30" /></label></div></section><section className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6"><p className="text-base font-semibold">Opérations</p><p className="mt-1 text-sm text-muted-foreground">Automatisez les décisions courantes de la régulation.</p><div className="mt-5"><Toggle label="Attribution automatique" description="Assigner une livraison au coursier disponible le plus proche." value={autoAssign} onChange={setAutoAssign} /></div></section></>}
          {active === 'notifications' && <section className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6"><p className="text-base font-semibold">Notifications et alertes</p><p className="mt-1 text-sm text-muted-foreground">Choisissez ce qui mérite l’attention de l’équipe opérationnelle.</p><div className="mt-6 flex flex-col gap-3"><Toggle label="Alertes opérationnelles" description="Livraisons en attente, coursiers indisponibles et zones sous tension." value={opsAlerts} onChange={setOpsAlerts} /><Toggle label="Notifications système" description="Mises à jour, rapports d’activité et changements de configuration." value={systemAlerts} onChange={setSystemAlerts} /></div></section>}
          {active === 'security' && <section className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6"><p className="text-base font-semibold">Sécurité du compte</p><p className="mt-1 text-sm text-muted-foreground">Gérez votre accès administrateur et vos sessions actives.</p><div className="mt-6 flex flex-col gap-3"><button type="button" className="flex items-center justify-between rounded-xl border border-border p-4 text-left hover:bg-muted"><span><span className="block text-sm font-semibold">Modifier le mot de passe</span><span className="mt-1 block text-xs text-muted-foreground">Dernière modification il y a 32 jours</span></span><ChevronRight className="size-4 text-muted-foreground" /></button><button type="button" className="flex items-center justify-between rounded-xl border border-border p-4 text-left hover:bg-muted"><span><span className="block text-sm font-semibold">Sessions actives</span><span className="mt-1 block text-xs text-muted-foreground">2 appareils connectés</span></span><ChevronRight className="size-4 text-muted-foreground" /></button></div></section>}
          <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 text-xs text-muted-foreground"><UserRound className="size-4" />Les changements sont réservés aux administrateurs.</p><button type="button" onClick={save} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sidebar px-4 py-3 text-sm font-semibold text-card transition hover:bg-sidebar-accent">{saved ? <Check className="size-4" /> : <Save className="size-4" />}{saved ? 'Modifications enregistrées' : 'Enregistrer les modifications'}</button></div>
          {saved && <p role="status" className="flex items-center gap-2 text-sm font-medium text-success"><Check className="size-4" />Vos paramètres ont été mis à jour.</p>}
        </div>
      </div>
    </AdminShell>
  )
}
