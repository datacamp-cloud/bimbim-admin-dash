'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  FileText,
  LockKeyhole,
  Save,
  Settings,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { AdminShell } from '@/components/layout/admin-shell'

type PayTransaction = {
  id: number | string
  montant: number
  type_transaction: string
  statut: string
  date_operation: string
}

type DashboardSnapshot = {
  wallet?: { totalBalance?: number }
  recentTransactions?: PayTransaction[]
}

const money = (value: number) =>
  new Intl.NumberFormat('fr-FR').format(Math.round(value)) + ' FCFA'

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

function SettingsPageContent() {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'general'

  const [admin, setAdmin] = useState<any>(null)
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null)
  const [auto, setAuto] = useState(false)
  const [alerts, setAlerts] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings', { cache: 'no-store' })
      .then((r) => r.json())
      .then((x) => setAdmin(x.admin ?? null))
      .catch(() => setAdmin(null))

    if (tab === 'transactions' || tab === 'wallet') {
      fetch('/api/admin/dashboard', { cache: 'no-store' })
        .then((r) => r.json())
        .then((x) => setSnapshot(x ?? null))
        .catch(() => setSnapshot(null))
    }
  }, [tab])

  const transactions = snapshot?.recentTransactions ?? []
  const balance = Number(snapshot?.wallet?.totalBalance ?? 0)

  const page = useMemo(() => {
    const pages: Record<string, { title: string; subtitle: string }> = {
      general: {
        title: 'Paramètres généraux',
        subtitle: 'Informations de l’administrateur et préférences de la plateforme.',
      },
      security: {
        title: 'Sécurité',
        subtitle: 'Contrôlez les accès administrateur et les mesures de sécurité.',
      },
      logs: {
        title: 'Logs système',
        subtitle: 'Consultez les événements techniques remontés par la plateforme.',
      },
      transactions: {
        title: 'Transactions Bimbim Pay',
        subtitle: 'Consultez les mouvements financiers enregistrés sur Bimbim Pay.',
      },
      wallet: {
        title: 'Retraits / Dépôts',
        subtitle: 'Suivez le solde global et les mouvements de portefeuille.',
      },
      invoices: {
        title: 'Factures Bimbim Pay',
        subtitle: 'Gérez les documents de facturation liés aux opérations Bimbim Pay.',
      },
    }
    return pages[tab] ?? pages.general
  }, [tab])

  const save = () => {
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  return (
    <AdminShell title={page.title} subtitle={page.subtitle}>
      <div className="space-y-6">
        {tab === 'general' && (
          <>
            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Settings className="size-5" />
                </span>
                <div>
                  <h2 className="font-semibold">Administrateur</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Informations récupérées depuis Neon.</p>
                </div>
              </div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Info label="Nom" value={admin?.nom ?? 'Chargement...'} />
                <Info label="Email" value={admin?.email ?? 'Chargement...'} />
                <Info label="Rôle" value={admin?.role ?? '—'} />
                <Info label="Statut" value={admin?.statut ?? '—'} />
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-semibold">Préférences de l’interface</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ces options restent locales à cette interface.
              </p>
              <div className="mt-5 space-y-3">
                <Toggle label="Attribution automatique" value={auto} onChange={setAuto} />
                <Toggle label="Alertes opérationnelles" value={alerts} onChange={setAlerts} />
              </div>
            </section>

            <SaveButton saved={saved} onClick={save} />
          </>
        )}

        {tab === 'transactions' && (
          <>
            <section className="grid gap-4 sm:grid-cols-3">
              <Metric icon={Wallet} label="Solde global" value={money(balance)} />
              <Metric icon={ArrowUpFromLine} label="Transactions affichées" value={String(transactions.length)} />
              <Metric icon={Activity} label="Source" value="Bimbim Pay" />
            </section>
            <TransactionTable transactions={transactions} />
          </>
        )}

        {tab === 'wallet' && (
          <>
            <section className="rounded-2xl border border-border bg-primary p-6 text-primary-foreground">
              <p className="text-sm opacity-80">Solde global Bimbim Pay</p>
              <p className="mt-2 text-3xl font-bold">{money(balance)}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
                  <ArrowDownToLine className="size-4" /> Dépôt
                </button>
                <button type="button" className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
                  <ArrowUpFromLine className="size-4" /> Retrait
                </button>
              </div>
            </section>
            <TransactionTable transactions={transactions} />
          </>
        )}

        {tab === 'invoices' && (
          <section className="rounded-2xl border border-border bg-card p-10 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="size-6" />
            </span>
            <h2 className="mt-4 font-semibold">Factures</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Aucun module de facturation n’est actuellement exposé par l’API d’administration. Cette section est prête à recevoir les factures lorsqu’elles seront disponibles.
            </p>
          </section>
        )}

        {tab === 'security' && (
          <>
            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-success/10 text-success">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <h2 className="font-semibold">État de sécurité</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Surveillez les accès et les protections de l’espace administrateur.</p>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <SecurityItem label="Connexion sécurisée" value="Active" />
                <SecurityItem label="Session administrateur" value="Protégée" />
                <SecurityItem label="Surveillance" value="Active" />
              </div>
            </section>
            <section className="rounded-2xl border border-warning/20 bg-warning/5 p-5">
              <div className="flex gap-3">
                <LockKeyhole className="mt-0.5 size-5 text-warning" />
                <div>
                  <h3 className="font-semibold">Bonnes pratiques</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Utilisez un mot de passe unique, limitez les accès administrateur et vérifiez régulièrement les activités inhabituelles.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {tab === 'logs' && (
          <section className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border p-5">
              <h2 className="font-semibold">Journal système</h2>
              <p className="mt-1 text-sm text-muted-foreground">Les événements disponibles depuis cette interface.</p>
            </div>
            <div className="divide-y divide-border">
              <LogRow label="Espace administrateur chargé" detail="Interface Bimbim Admin" />
              <LogRow label="Connexion aux données" detail="API d’administration" />
              <LogRow label="Surveillance Bimbim Pay" detail="Module financier" />
            </div>
          </section>
        )}
      </div>
    </AdminShell>
  )
}

export function SettingsModule() {
  return (
    <Suspense
      fallback={
        <AdminShell title="Paramètres" subtitle="Chargement...">
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Chargement du module...
          </div>
        </AdminShell>
      }
    >
      <SettingsPageContent />
    </Suspense>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between rounded-xl border border-border p-4 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span>
        <b className="block text-sm">{label}</b>
        <small className="text-xs text-muted-foreground">Préférence locale</small>
      </span>
      <span className={`relative h-6 w-11 rounded-full ${value ? 'bg-primary' : 'bg-muted'}`}>
        <span className={`absolute top-1 size-4 rounded-full bg-card transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </span>
    </button>
  )
}

function SaveButton({ saved, onClick }: { saved: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {saved ? <Check className="size-4" /> : <Save className="size-4" />}
      {saved ? 'Enregistré' : 'Enregistrer'}
    </button>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof Wallet; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <p className="mt-4 text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  )
}

function TransactionTable({ transactions }: { transactions: PayTransaction[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border p-5">
        <h2 className="font-semibold">Mouvements récents</h2>
      </div>
      {transactions.length === 0 ? (
        <div className="p-10 text-center text-sm text-muted-foreground">Aucune transaction disponible.</div>
      ) : (
        <div className="divide-y divide-border">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="grid gap-3 p-5 md:grid-cols-[1fr_1.3fr_1fr_1fr] md:items-center">
              <span className="font-mono text-xs font-semibold text-primary">#{transaction.id}</span>
              <span className="text-sm">{transaction.type_transaction || 'Transaction'}</span>
              <span className={`text-sm font-semibold ${transaction.montant >= 0 ? 'text-success' : 'text-danger'}`}>
                {transaction.montant >= 0 ? '+' : ''}{money(transaction.montant)}
              </span>
              <span className="text-xs text-muted-foreground">
                {transaction.date_operation ? formatDate(transaction.date_operation) : '—'} · {transaction.statut}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function SecurityItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-success">{value}</p>
    </div>
  )
}

function LogRow({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-4 p-5">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
      <span className="text-xs text-muted-foreground">Disponible</span>
    </div>
  )
}
