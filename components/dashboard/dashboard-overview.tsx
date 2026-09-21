'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowDownToLine, ArrowUpRight, CheckCircle2, ChevronDown, CircleDollarSign, Package, RefreshCw, ShieldCheck, Star, TrendingUp, Truck, UserRound } from 'lucide-react'
import { AdminShell, Avatar } from '@/components/layout/admin-shell'
import { DashboardCharts, DashboardMap } from '@/components/dashboard/dashboard-visuals'
import { cn } from '@/lib/utils'

export type DashboardData = {
  counters: { clients: number; livreurs: number; commandes: number; livraisons: number; pendingReturns: number; onlineLivreurs: number }
  revenue: { current: number; previous: number }
  orders30d: Record<string, number>
  dailyOrders: { label: string; value: number }[]
  recentOrders: { id: number|string; statut: string; total: number; date: string; client: string; livraisons: number; courier?: string; rating?: string; deliveryRate?: number }[]
  recentTransactions: { id: number|string; montant: number; type_transaction: string; statut: string; date_operation: string }[]
  returns: { id: number|string; date: string; courier: string; statut: string }[]
  positions: { id: number; latitude: number; longitude: number; status: string; courier: string }[]
  generatedAt?: string
}

export const fallback: DashboardData = {
  counters:{clients:86,livreurs:342,commandes:1248,livraisons:1153,pendingReturns:3,onlineLivreurs:342},
  revenue:{current:8450000,previous:6926000},
  orders30d:{terminee:898,en_cours:225,en_attente:87,annulee:38},
  dailyOrders:[{label:'Lun',value:118},{label:'Mar',value:126},{label:'Mer',value:134},{label:'Jeu',value:142},{label:'Ven',value:128},{label:'Sam',value:156},{label:'Dim',value:119}],
  recentOrders:[
    {id:'BM-1058',statut:'terminee',total:7500,date:'2026-05-26T14:32:00Z',client:'Awa Koné',livraisons:3,courier:'Kouamé Yao',rating:'4.8',deliveryRate:100},
    {id:'BM-1057',statut:'en_cours',total:5000,date:'2026-05-26T11:10:00Z',client:'Nadia Traoré',livraisons:2,courier:'Traoré Mamadou',rating:'4.6',deliveryRate:50},
    {id:'BM-1056',statut:'en_attente',total:2500,date:'2026-05-25T16:45:00Z',client:'Kouadio S.',livraisons:1,courier:'Kouadio S.',rating:'4.9',deliveryRate:0},
    {id:'BM-1055',statut:'terminee',total:5200,date:'2026-05-25T09:22:00Z',client:'Bamba Issouf',livraisons:2,courier:'Bamba Issouf',rating:'4.7',deliveryRate:100},
    {id:'BM-1054',statut:'terminee',total:6800,date:'2026-05-24T18:05:00Z',client:'Diabaté Ali',livraisons:3,courier:'Diabaté Ali',rating:'4.5',deliveryRate:67},
  ],
  recentTransactions:[{id:1,montant:100000,type_transaction:'credit',statut:'reussi',date_operation:'2026-05-26T12:45:00Z'},{id:2,montant:-50000,type_transaction:'debit',statut:'reussi',date_operation:'2026-05-26T10:32:00Z'},{id:3,montant:-5000,type_transaction:'commission',statut:'reussi',date_operation:'2026-05-25T18:20:00Z'}],
  returns:[{id:'RT-0032',date:'2026-05-26T12:15:00Z',courier:'Koffi Yao',statut:'en_cours'},{id:'RT-0031',date:'2026-05-26T16:40:00Z',courier:'Traoré Mamadou',statut:'en_attente'},{id:'RT-0030',date:'2026-05-24T11:22:00Z',courier:'Diabaté Ali',statut:'livre'}],
  positions:[{id:1,latitude:5.3484,longitude:-3.9901,status:'en_cours',courier:'Kouamé Yao'},{id:2,latitude:5.3267,longitude:-4.0244,status:'a_venir',courier:'Traoré Mamadou'},{id:3,latitude:5.3072,longitude:-4.0091,status:'terminee',courier:'Koffi Yao'},{id:4,latitude:5.3021,longitude:-3.9866,status:'retour',courier:'Diabaté Ali'}]
}

const money=(v:number)=>new Intl.NumberFormat('fr-FR').format(Math.round(v))+' FCFA'
const dateLabel=(v:string)=>new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(v))
const statusLabel=(v:string)=>({terminee:'Livrée',en_cours:'En cours',en_attente:'En attente',annulee:'Annulée',livre:'Livré',a_venir:'À venir'} as Record<string,string>)[v]||v
function Panel({children,className}:{children:React.ReactNode;className?:string}){return <section className={cn('rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(17,24,38,0.03)]',className)}>{children}</section>}
function SectionTitle({title,link}:{title:string;link?:string}){return <div className="mb-4 flex items-center justify-between"><h2 className="text-[15px] font-semibold">{title}</h2>{link&&<Link href={link} className="text-xs font-semibold text-primary">Voir toutes →</Link>}</div>}

export function DashboardOverview({data}:{data:DashboardData}) {
  const [period,setPeriod]=useState('Ce mois')
  const [refreshing,setRefreshing]=useState(false)
  const delta=data.revenue.previous?Math.round(((data.revenue.current-data.revenue.previous)/data.revenue.previous)*100):22
  const refresh=()=>{setRefreshing(true);setTimeout(()=>setRefreshing(false),700)}
  return <AdminShell title="" subtitle="">
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-primary px-6 py-7 text-white md:px-8 md:py-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">ESPACE ADMINISTRATEUR</p>
        <h1 className="mt-2 max-w-2xl text-2xl font-bold tracking-tight md:text-3xl">Bienvenue sur votre espace administrateur</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">Supervisez l'ensemble de la plateforme Bimbim, gérez les utilisateurs, les commandes et assurez le bon fonctionnement du service.</p>
        <Truck className="absolute right-10 top-1/2 hidden size-28 -translate-y-1/2 text-white/15 md:block"/>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ['Total commandes',data.counters.commandes.toLocaleString('fr-FR'),'+12%',Package,'text-primary bg-primary/10'],
          ['Livraisons effectuées',data.counters.livraisons.toLocaleString('fr-FR'),'+15%',CheckCircle2,'text-success bg-success/10'],
          ['Partenaires actifs',data.counters.clients.toLocaleString('fr-FR'),'+8%',UserRound,'text-info bg-info/10'],
          ['Coursiers actifs',data.counters.onlineLivreurs.toLocaleString('fr-FR'),'+11%',Truck,'text-warning bg-warning/10'],
          ['Bimbim Pay · Solde global',money(data.revenue.current),'+'+delta+'%',CircleDollarSign,'text-primary bg-primary/10'],
        ].map(([label,value,change,Icon,tone])=><Panel key={String(label)} className="p-4"><div className="flex justify-between"><span className={cn('flex size-9 items-center justify-center rounded-xl',tone as string)}><Icon className="size-4"/></span><span className="flex h-fit items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[10px] font-semibold text-success"><TrendingUp className="size-3"/>{String(change)}</span></div><p className="mt-4 text-xs text-muted-foreground">{String(label)}</p><p className="mt-1 text-xl font-bold tracking-tight">{String(value)}</p></Panel>)}
      </div>

      <Panel className="flex flex-col gap-3 border-warning/25 bg-warning/[0.035] p-4 md:flex-row md:items-center md:justify-between"><div className="flex gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning"><ShieldCheck className="size-4"/></span><div><p className="text-sm font-semibold">Assurez votre sécurité</p><p className="mt-1 text-xs text-muted-foreground">Surveillez les activités suspectes, gérez les accès et protégez vos données.</p></div></div><Link href="/settings?tab=security" className="text-xs font-semibold text-primary">Voir les recommandations →</Link></Panel>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="p-5"><div className="flex items-center justify-between"><SectionTitle title="Répartition des commandes"/><button onClick={()=>setPeriod(period==='Ce mois'?'Cette semaine':'Ce mois')} className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-[10px] text-muted-foreground">{period}<ChevronDown className="size-3"/></button></div><DashboardCharts type="donut" data={data.orders30d} total={data.counters.commandes}/></Panel>
        <Panel className="p-5"><SectionTitle title="Évolution des commandes"/><DashboardCharts type="line" daily={data.dailyOrders}/></Panel>
        <Panel className="p-5"><SectionTitle title="Livraisons du jour"/><DashboardMap positions={data.positions}/><div className="mt-3 grid grid-cols-2 gap-2 text-[10px]"><span>🟠 En cours <b className="float-right">5</b></span><span>🔵 À venir <b className="float-right">3</b></span><span>🟢 Terminées <b className="float-right">12</b></span><span>🟣 Retours <b className="float-right">2</b></span></div></Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Panel className="overflow-hidden"><div className="border-b border-border p-5"><SectionTitle title="Commandes récentes" link="/deliveries"/></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-muted/35 text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-5 py-3">N° commande</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Livraisons</th><th className="px-3 py-3">Coursier</th><th className="px-3 py-3">Taux</th><th className="px-5 py-3"/></tr></thead><tbody>{data.recentOrders.slice(0,5).map(o=><tr key={o.id} className="border-t border-border hover:bg-muted/25"><td className="px-5 py-3 font-mono text-xs font-semibold text-primary">#{o.id}</td><td className="px-3 py-3 text-xs text-muted-foreground">{dateLabel(o.date)}</td><td className="px-3 py-3 text-xs">{o.livraisons} livraison{o.livraisons>1?'s':''}</td><td className="px-3 py-3"><div className="flex items-center gap-2"><Avatar initials={(o.courier||o.client).split(' ').map(x=>x[0]).join('').slice(0,2)}/><div><p className="text-xs">{o.courier||'—'}</p><span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Star className="size-3 fill-warning text-warning"/>{o.rating||'—'}</span></div></div></td><td className="px-3 py-3"><div className="flex items-center gap-2"><span className="h-1.5 w-14 overflow-hidden rounded-full bg-muted"><span className={cn('block h-full rounded-full',(o.deliveryRate??0)>=80?'bg-success':(o.deliveryRate??0)>=50?'bg-warning':'bg-danger')} style={{width:(o.deliveryRate??0)+'%'}}/></span><span className="text-[10px]">{o.deliveryRate??0}%</span></div></td><td className="px-5 py-3 text-right"><Link href={'/deliveries/'+o.id} className="rounded-lg border border-border px-2 py-1.5 text-[10px] font-semibold hover:bg-muted">Détails</Link></td></tr>)}</tbody></table></div></Panel>
        <Panel className="p-5"><SectionTitle title="Mes performances aujourd'hui" link="/couriers"/><div className="space-y-2.5">{[['Temps moyen de livraison','1h 45min','-12%'],['Taux d’acceptation','92%','+5%'],['Note moyenne','4.7/5','+0.3'],['Livraisons terminées','18','+20%']].map(([l,v,c])=><div key={l} className="flex items-center justify-between rounded-xl bg-muted/50 p-3"><div><p className="text-[11px] text-muted-foreground">{l}</p><p className="mt-1 text-base font-bold">{v}</p></div><span className="text-[10px] font-semibold text-success">{c}</span></div>)}</div></Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="p-5"><SectionTitle title="Bimbim Pay" link="/settings?tab=wallet"/><p className="text-2xl font-bold">{money(data.revenue.current)}</p><p className="text-xs text-muted-foreground">Solde disponible</p><div className="mt-4 grid grid-cols-2 gap-2"><button className="flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-semibold text-white"><ArrowDownToLine className="size-3.5"/>Dépôt</button><button className="flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-semibold"><ArrowUpRight className="size-3.5"/>Retrait</button></div><div className="mt-4 border-t border-border pt-3">{data.recentTransactions.slice(0,3).map(t=><div key={t.id} className="flex justify-between border-b border-border py-2 last:border-0"><span className="text-[10px]">{t.type_transaction==='credit'?'Dépôt par partenaire':t.type_transaction==='commission'?'Frais de service':'Retrait vers compte'}<small className="block text-muted-foreground">{dateLabel(t.date_operation)}</small></span><b className={cn('text-[10px]',t.montant>=0?'text-success':'text-danger')}>{t.montant>=0?'+':''}{money(t.montant)}</b></div>)}</div></Panel>
        <Panel className="p-5"><SectionTitle title="Courses en cours" link="/deliveries"/><div className="overflow-hidden rounded-xl border border-border">{[['CR-4587','PICK','Yao Koffi','En cours'],['CR-4586','SWITCH','Koné Moussa','En cours'],['CR-4585','DROP','Diallo Ibrahim','À venir']].map(r=><div key={r[0]} className="grid grid-cols-[70px_65px_1fr_65px] items-center border-b border-border px-3 py-3 text-[10px] last:border-0"><b>{r[0]}</b><span className="w-fit rounded bg-primary/10 px-1.5 py-1 font-semibold text-primary">{r[1]}</span><span>{r[2]}</span><span className={r[3]==='En cours'?'text-warning':'text-info'}>{r[3]}</span></div>)}</div></Panel>
        <Panel className="p-5"><SectionTitle title="Retour de colis" link="/deliveries?view=returns"/>{data.returns.slice(0,3).map(r=><div key={r.id} className="flex items-center gap-3 border-b border-border py-3 last:border-0"><Package className="size-4 text-danger"/><div className="min-w-0 flex-1"><b className="font-mono text-[10px]">{r.id}</b><p className="truncate text-[10px] text-muted-foreground">{dateLabel(r.date)} · {r.courier}</p></div><span className={cn('text-[10px] font-semibold',r.statut==='en_cours'?'text-warning':r.statut==='livre'?'text-success':'text-muted-foreground')}>{statusLabel(r.statut)}</span></div>)}</Panel>
      </div>

      <Panel className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Package className="size-4"/></span><div><p className="text-sm font-semibold">Colis retour</p><p className="text-xs text-muted-foreground">Gérez les retours de colis depuis la livraison jusqu'à la réception.</p></div></div><Link href="/deliveries?view=returns" className="rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white">Accéder au suivi →</Link></Panel>
      <div className="flex justify-end"><button onClick={refresh} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">{refreshing?<RefreshCw className="size-3.5 animate-spin"/>:<RefreshCw className="size-3.5"/>}Actualiser</button></div>
    </div>
  </AdminShell>
}
