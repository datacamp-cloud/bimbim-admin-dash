'use client'

import { useEffect,useState } from 'react'
import { Bell,Search } from 'lucide-react'
import { AdminShell,Avatar,StatusBadge } from '@/components/layout/admin-shell'

export function UsersPage(){
 const [data,setData]=useState<any[]>([]),[stats,setStats]=useState({total:0,actifs:0,nouveaux:0}),[q,setQ]=useState('')
 useEffect(()=>{const t=setTimeout(()=>fetch('/api/admin/users?q='+encodeURIComponent(q),{cache:'no-store'}).then(r=>r.json()).then(x=>{setData(x.data??[]);setStats(x.stats??stats)}),250);return()=>clearTimeout(t)},[q])
 return <AdminShell title="Utilisateurs" subtitle="Données clients issues de Neon."><div className="grid gap-3 sm:grid-cols-3">{[['Total',stats.total],['Actifs',stats.actifs],['Nouveaux · 30 jours',stats.nouveaux]].map(([l,v])=><div key={String(l)} className="rounded-2xl border border-border bg-card p-5"><p className="text-xs text-muted-foreground">{l}</p><p className="mt-2 text-2xl font-bold">{String(v)}</p></div>)}</div><div className="mt-6 rounded-2xl border border-border bg-card overflow-hidden"><div className="border-b border-border p-5"><div className="relative max-w-lg"><Search className="absolute left-3 top-3 size-4 text-muted-foreground"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Nom, email ou téléphone..." className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-sm outline-none"/></div></div><div className="divide-y divide-border">{data.map(u=><div key={u.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1.4fr_1.3fr_1fr_100px_100px] md:items-center"><div className="flex items-center gap-3"><Avatar initials={(u.nom??'?').split(' ').map((x:string)=>x[0]).join('').slice(0,2)}/><span className="text-sm font-medium">{u.nom??'Sans nom'}</span></div><span className="text-sm text-muted-foreground">{u.email??'—'}</span><span className="text-sm text-muted-foreground">{u.telephone}</span><span className="text-sm">{u.deliveries}</span><StatusBadge status={u.statut}/></div>)}</div></div></AdminShell>
}

export function NotificationsPage(){
 const [data,setData]=useState<any[]>([])
 useEffect(()=>{fetch('/api/admin/notifications',{cache:'no-store'}).then(r=>r.json()).then(x=>setData(x.data??[]))},[])
 return <AdminShell title="Notifications" subtitle="Notifications enregistrées dans Neon."><div className="rounded-2xl border border-border bg-card divide-y divide-border">{data.length===0?<div className="p-10 text-center text-sm text-muted-foreground">Aucune notification.</div>:data.map(n=><div key={n.id} className="flex gap-4 p-5"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted"><Bell className="size-4"/></span><div><p className="font-medium">{n.title}</p><p className="mt-1 text-sm text-muted-foreground">{n.description}</p><p className="mt-2 text-xs text-muted-foreground">{new Date(n.date).toLocaleString('fr-FR')} · {n.status}</p></div></div>)}</div></AdminShell>
}
