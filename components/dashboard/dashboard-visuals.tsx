'use client'

import { useEffect, useRef } from 'react'

export function DashboardCharts({type,data,total,daily}:{type:'donut'|'line';data?:Record<string,number>;total?:number;daily?:{label:string;value:number}[]}) {
  const ref=useRef<HTMLCanvasElement|null>(null)
  useEffect(()=>{
    let chart:any
    let mounted=true
    import('chart.js/auto').then(({default:Chart})=>{
      if(!mounted||!ref.current)return
      if(type==='donut'){
        chart=new Chart(ref.current,{type:'doughnut',data:{labels:['Livrées','En cours','En attente','Annulées'],datasets:[{data:[data?.terminee??0,data?.en_cours??0,data?.en_attente??0,data?.annulee??0],backgroundColor:['#27804D','#4589D2','#B7791F','#C94343'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'72%',plugins:{legend:{display:false}}}})
      }else{
        chart=new Chart(ref.current,{type:'line',data:{labels:(daily??[]).map(x=>x.label),datasets:[{data:(daily??[]).map(x=>x.value),borderColor:'#1B3A8C',backgroundColor:'rgba(27,58,140,.08)',fill:true,tension:.35,pointRadius:3,pointBackgroundColor:'#1B3A8C'}]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{beginAtZero:true,max:200,ticks:{stepSize:50,font:{size:9}},grid:{color:'#E7EBF2'}},x:{grid:{display:false},ticks:{font:{size:9}}}},plugins:{legend:{display:false}}}})
      }
    })
    return()=>{mounted=false;chart?.destroy()}
  },[type,data,daily])
  if(type==='donut')return <div className="relative h-56"><canvas ref={ref}/><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-bold">{(total??0).toLocaleString('fr-FR')}</span><span className="text-[10px] text-muted-foreground">commandes</span></div><div className="absolute bottom-0 left-0 right-0 grid grid-cols-2 gap-2 text-[10px]"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-success"/>Livrées <b className="ml-auto">{data?.terminee??0}</b></span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-info"/>En cours <b className="ml-auto">{data?.en_cours??0}</b></span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-warning"/>En attente <b className="ml-auto">{data?.en_attente??0}</b></span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-danger"/>Annulées <b className="ml-auto">{data?.annulee??0}</b></span></div></div>
  return <div className="h-64"><canvas ref={ref}/></div>
}

export function DashboardMap({positions}:{positions:{id:number;latitude:number;longitude:number;status:string;courier:string}[]}) {
  const ref=useRef<HTMLDivElement|null>(null)
  useEffect(()=>{
    let map:any
    let mounted=true
    import('leaflet').then(L=>{
      if(!mounted||!ref.current)return
      map=L.map(ref.current,{center:[5.3453,-4.0244],zoom:11,zoomControl:false})
      L.control.zoom({position:'bottomright'}).addTo(map)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors',maxZoom:19}).addTo(map)
      positions.forEach(p=>{
        const color=p.status==='en_cours'?'#F59E0B':p.status==='a_venir'?'#4589D2':p.status==='retour'?'#8B5CF6':'#27804D'
        L.circleMarker([p.latitude,p.longitude],{radius:7,color:'#fff',weight:2,fillColor:color,fillOpacity:.95}).addTo(map).bindTooltip(p.courier)
      })
    })
    return()=>{mounted=false;map?.remove()}
  },[positions])
  return <div ref={ref} className="mt-2 h-60 overflow-hidden rounded-xl border border-border bg-muted"/>
}
