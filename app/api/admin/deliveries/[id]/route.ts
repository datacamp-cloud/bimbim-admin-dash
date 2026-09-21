import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = Number((await params).id)
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Identifiant invalide.' }, { status: 400 })
    const d = await prisma.livraison.findUnique({
      where: { id },
      include: {
        client_expediteur: { select: { id: true, nom: true, telephone: true, email: true } },
        client_destinataire: { select: { id: true, nom: true, telephone: true, email: true } },
        service: { select: { nom_service: true } },
        segments: { orderBy: { ordre_segment: 'asc' }, include: {
          livreur_source: { select: { id: true, nom: true, prenom: true, telephone: true } },
          livreur_destinataire: { select: { id: true, nom: true, prenom: true, telephone: true } }
        }},
        tentatives: { orderBy: { date_tentative: 'asc' } },
        retours: { orderBy: { date_retour: 'desc' }, take: 10 }
      }
    })
    if (!d) return NextResponse.json({ error: 'Livraison introuvable.' }, { status: 404 })
    return NextResponse.json({
      id: d.id, client: d.client_expediteur, recipient: { name: d.nom_destinataire, phone: d.telephone_destinataire, client: d.client_destinataire },
      from: d.adresse_ramassage, to: d.adresse_livraison, status: d.statut, price: Number(d.prix), service: d.service.nom_service,
      distanceKm: d.distance_km ? Number(d.distance_km) : null, createdAt: d.date_creation.toISOString(), updatedAt: d.date_maj.toISOString(),
      courier: (() => { const s=d.segments.find(x=>x.livreur_destinataire||x.livreur_source); const c=s?.livreur_destinataire??s?.livreur_source; return c ? c : null })(),
      segments: d.segments.map(s=>({ id:s.id,type:s.type_segment,status:s.statut,from:s.adresse_depart,to:s.adresse_arrivee,start:s.date_debut?.toISOString()??null,end:s.date_fin?.toISOString()??null })),
      attempts: d.tentatives.map(t=>({ id:t.id,result:t.resultat,comment:t.commentaire,date:t.date_tentative.toISOString() })),
      returns: d.retours.map(r=>({ id:r.id,status:r.statut,motif:r.motif,date:r.date_retour.toISOString() })),
    })
  } catch (error) {
    console.error('GET /api/admin/deliveries/[id]', error)
    return NextResponse.json({ error: 'Impossible de charger la livraison.' }, { status: 500 })
  }
}
