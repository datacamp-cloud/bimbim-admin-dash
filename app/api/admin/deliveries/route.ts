import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim()
    const status = request.nextUrl.searchParams.get('status')
    const where = {
      ...(q ? { OR: [{ nom_destinataire: { contains: q, mode: 'insensitive' as const } }, { telephone_destinataire: { contains: q } }, { adresse_ramassage: { contains: q, mode: 'insensitive' as const } }, { adresse_livraison: { contains: q, mode: 'insensitive' as const } }] } : {}),
      ...(status && ['en_attente','en_cours','livre','retour','echec'].includes(status) ? { statut: status as any } : {}),
    }
    const data = await prisma.livraison.findMany({
      where, orderBy: { date_creation: 'desc' }, take: 100,
      include: {
        client_expediteur: { select: { nom: true, telephone: true } },
        segments: { orderBy: { ordre_segment: 'asc' }, include: { livreur_source: { select: { nom: true, prenom: true } }, livreur_destinataire: { select: { nom: true, prenom: true } } } }
      }
    })
    return NextResponse.json({ data: data.map(d => {
      const s = d.segments[0]
      const c = s?.livreur_destinataire ?? s?.livreur_source
      return {
        id: d.id, client: d.client_expediteur.nom ?? 'Client', phone: d.client_expediteur.telephone,
        from: d.adresse_ramassage, to: d.adresse_livraison, courier: c ? `${c.prenom} ${c.nom}` : '—',
        status: d.statut, price: Number(d.prix), time: d.date_creation.toISOString(), zone: d.adresse_ramassage
      }
    }) })
  } catch (error) {
    console.error('GET /api/admin/deliveries', error)
    return NextResponse.json({ error: 'Impossible de charger les livraisons.' }, { status: 500 })
  }
}
