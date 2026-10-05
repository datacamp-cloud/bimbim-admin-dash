import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getVerifiedAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await getVerifiedAdminSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })

  try {
    const q = request.nextUrl.searchParams.get('q')?.trim()
    const status = request.nextUrl.searchParams.get('status')
    const view = request.nextUrl.searchParams.get('view')

    if (view === 'orders') {
      const where = {
        ...(q ? {
          OR: [
            { client: { nom: { contains: q, mode: 'insensitive' as const } } },
            { adresse_enlevement: { contains: q, mode: 'insensitive' as const } },
            { adresse_livraison: { contains: q, mode: 'insensitive' as const } },
          ],
        } : {}),
        ...(status ? { statut: status as any } : {}),
      }
      const data = await prisma.commande.findMany({
        where,
        orderBy: { date_creation: 'desc' },
        take: 100,
        select: {
          id: true, statut: true, total_livraisons: true, total_montant: true, date_creation: true,
          client: { select: { nom: true, telephone: true } },
        },
      })
      return NextResponse.json({
        mode: 'orders',
        data: data.map(o => ({
          id: o.id,
          client: o.client?.nom ?? 'Client',
          phone: o.client?.telephone ?? '—',
          from: '—',
          to: '—',
          courier: '—',
          status: o.statut,
          price: Number(o.total_montant),
          time: o.date_creation.toISOString(),
          deliveries: o.total_livraisons,
        })),
      })
    }
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
