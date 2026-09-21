'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CheckCircle2, Package, RefreshCw, Truck, Users, CircleDollarSign, ArrowRight } from 'lucide-react'
import { AdminShell } from '@/components/layout/admin-shell'
import { cn } from '@/lib/utils'

type Data = {
  counters:{clients:number;partners:number;livreurs:number;commandes:number;livraisons:number;pendingReturns:number;onlineLivreurs:number}
  revenue:{current:number;previous:number}
  orders30d:Record<string,number>
  dailyOrders:{label:string;value:number}[]
  recentOrders:{id:number|string;statut:string;total:number;date:string;client:string;livraisons:number;courier?:string}[]
  recentTransactions:{id:number|string;montant:number;type_transaction:string;statut:string;date_operation:string}[]
  returns:{id:number|string;date:string;courier:string;statut:string}[]
  positions:{id:number;latitude:number;longitude:number;status:string;courier:string}[]
}

const money=(n:number)=>new Intl.NumberFormat('fr-FR').format(Math.round(n))+' FCFA'
const status=(s:string)=>({en_attente:'En attente',en_cours:'En cours',livre:'Livrée',retour:'Retour',echec:'Échec',terminee:'Terminée'}[s]??s)

export function DashboardOverview(){
  const [data,setData]=useState<Data|null>(null)
  const [error,setError]=useState('')
  const load=async()=>{setError('');try{const r=await fetch('/api/admin/dashboard',{cache:'no-store'});if(!r.ok)throw new Error();setData(await r.json())}catch{setError('Impossible de charger les données du dashboard.')} }
  useEffect(()=>{load()},[])
  if(error)return <AdminShell title="Dashboard" subtitle=""><div className="rounded-2xl border border-danger/20 bg-danger/5 p-6 text-sm text-danger">{error}</div></AdminShell>
  if(!data)return <AdminShell title="Dashboard" subtitle=""><div className="p-10 text-center text-sm text-muted-foreground">Chargement des données...</div></AdminShell>
  const kpis=[
    ['Clients',data.counters.clients,Users,'text-info bg-info/10'],
    ['Coursiers',data.counters.livreurs,Truck,'text-warning bg-warning/10'],
    ['Commandes',data.counters.commandes,Package,'text-primary bg-primary/10'],
    ['Livraisons',data.counters.livraisons,CheckCircle2,'text-success bg-success/10'],
    ['Revenus 30 jours',money(data.revenue.current),CircleDollarSign,'text-primary bg-primary/10'],
  ] as const
  return <AdminShell title="Dashboard" subtitle="Vue réelle des données Bimbim.">
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map(([label,value,Icon,tone])=><div key={label} className="rounded-2xl border border-border bg-card p-5"><span className={cn('flex size-9 items-center justify-center rounded-xl',tone)}><Icon className="size-4"/></span><p className="mt-4 text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{typeof value==='number'?value.toLocaleString('fr-FR'):value}</p></div>)}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
        <section className="rounded-2xl border border-border bg-card overflow-hidden"><div className="flex items-center justify-between border-b border-border p-5"><h2 className="font-semibold">Commandes récentes</h2><Link href="/deliveries" className="text-xs font-semibold text-primary">Voir les livraisons</Link></div><div className="divide-y divide-border">{data.recentOrders.map(o=><div key={o.id} className="flex items-center gap-4 p-4"><div className="min-w-0 flex-1"><p className="font-mono text-xs font-semibold text-primary">#{o.id}</p><p className="mt-1 text-sm">{o.client}</p><p className="text-xs text-muted-foreground">{new Date(o.date).toLocaleString('fr-FR')}</p></div><span className="text-xs">{o.livraisons} livraison{o.livraisons>1?'s':''}</span><span className="text-xs font-medium">{status(o.statut)}</span><span className="text-sm font-semibold">{money(o.total)}</span></div>)}</div></section>
        <section className="rounded-2xl border border-border bg-card p-5"><h2 className="font-semibold">État actuel</h2><div className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Coursiers disponibles</span><b>{data.counters.onlineLivreurs}</b></div><div className="flex justify-between"><span className="text-muted-foreground">Retours en attente</span><b>{data.counters.pendingReturns}</b></div>{Object.entries(data.orders30d).map(([s,n])=><div key={s} className="flex justify-between"><span className="text-muted-foreground">{status(s)}</span><b>{n}</b></div>)}</div></section>
      </div>
      <div className="flex justify-end"><button onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted"><RefreshCw className="size-4"/>Actualiser</button></div>
    </div>
  </AdminShell>
}
