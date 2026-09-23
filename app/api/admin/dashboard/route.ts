import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const num = (value: unknown) => Number(value ?? 0)

export async function GET() {
  try {
    const now = new Date()
    const start30 = new Date(now)
    start30.setDate(now.getDate() - 29)
    start30.setHours(0, 0, 0, 0)
    const start7 = new Date(now)
    start7.setDate(now.getDate() - 6)
    start7.setHours(0, 0, 0, 0)

    const [
      clients,
      activePartners,
      livreurs,
      activeCouriers,
      commandes,
      livraisons,
      pendingReturns,
      onlineLivreurs,
      globalWalletBalance,
      revenueRows,
      orderStatusRows,
      dailyRows,
      recentOrders,
      recentTransactions,
      returns,
      positions,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { type_client: 'entreprise', statut: 'actif' } }),
      prisma.livreur.count(),
      prisma.livreur.count({ where: { statut_compte: 'actif' } }),
      prisma.commande.count(),
      prisma.livraison.count(),
      prisma.retourLivraison.count({ where: { statut: 'en_attente' } }),
      prisma.livreur.count({ where: { disponibilite: true, statut_compte: 'actif' } }),
      prisma.wallet.aggregate({ _sum: { solde: true }, where: { statut: 'actif' } }),
      prisma.transaction.aggregate({ _sum: { montant: true }, where: { statut: 'reussi', date_operation: { gte: start30 } } }),
      prisma.commande.groupBy({ by: ['statut'], _count: { _all: true } }),
      prisma.commande.findMany({ where: { date_creation: { gte: start7 } }, select: { date_creation: true } }),
      prisma.commande.findMany({
        orderBy: { date_creation: 'desc' },
        take: 5,
        select: {
          id: true, statut: true, total_montant: true, date_creation: true, total_livraisons: true,
          client: { select: { nom: true } },
          livraisons: {
            take: 1,
            orderBy: { date_creation: 'asc' },
            select: {
              segments: {
                take: 1,
                orderBy: { ordre_segment: 'asc' },
                select: {
                  livreur_destinataire: { select: { nom: true, prenom: true } },
                  livreur_source: { select: { nom: true, prenom: true } },
                },
              },
            },
          },
        }
      }),
      prisma.transaction.findMany({ where: { statut: 'reussi' }, orderBy: { date_operation: 'desc' }, take: 5, select: { id: true, montant: true, type_transaction: true, statut: true, date_operation: true } }),
      prisma.retourLivraison.findMany({ orderBy: { date_retour: 'desc' }, take: 5, select: { id: true, date_retour: true, statut: true, livreur: { select: { nom: true, prenom: true } } } }),
      prisma.positionLivreur.findMany({ orderBy: { date_maj: 'desc' }, take: 50, distinct: ['livreur_id'], select: { id: true, livreur_id: true, latitude: true, longitude: true, statut_tracking: true, livreur: { select: { nom: true, prenom: true } } } }),
    ])

    const orders30d: Record<string, number> = {}
    for (const row of orderStatusRows) orders30d[row.statut] = row._count._all

    const dailyMap = new Map<string, number>()
    for (let i = 0; i < 7; i++) {
      const d = new Date(start7)
      d.setDate(start7.getDate() + i)
      dailyMap.set(d.toISOString().slice(0, 10), 0)
    }
    for (const row of dailyRows) {
      const key = row.date_creation.toISOString().slice(0, 10)
      if (dailyMap.has(key)) dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1)
    }

    const revenue = num(revenueRows._sum.montant)
    const recent = recentOrders.map((o) => {
      const segment = o.livraisons[0]?.segments[0]
      const courier = segment?.livreur_destinataire ?? segment?.livreur_source
      return {
        id: o.id,
        statut: o.statut,
        total: num(o.total_montant),
        date: o.date_creation.toISOString(),
        client: o.client?.nom ?? 'Client inconnu',
        livraisons: o.total_livraisons,
        courier: courier ? `${courier.prenom} ${courier.nom}` : undefined,
      }
    })

    return NextResponse.json({
      counters: {
        clients,
        partners: activePartners,
        livreurs,
        activeCouriers,
        commandes,
        livraisons,
        pendingReturns,
        onlineLivreurs,
      },
      wallet: {
        totalBalance: num(globalWalletBalance._sum.solde),
      },
      revenue: { current: revenue, previous: 0 },
      orders30d,
      dailyOrders: Array.from(dailyMap.entries()).map(([date, value]) => ({
        label: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(new Date(date)),
        value,
      })),
      recentOrders: recent,
      recentTransactions: recentTransactions.map(t => ({ ...t, montant: num(t.montant), date_operation: t.date_operation.toISOString() })),
      returns: returns.map(r => ({ id: r.id, date: r.date_retour.toISOString(), courier: `${r.livreur.prenom} ${r.livreur.nom}`, statut: r.statut })),
      positions: positions.map(p => ({ id: p.id, latitude: num(p.latitude), longitude: num(p.longitude), status: p.statut_tracking, courier: `${p.livreur.prenom} ${p.livreur.nom}` })),
      generatedAt: now.toISOString(),
    })
  } catch (error) {
    console.error('GET /api/admin/dashboard', error)
    return NextResponse.json({ error: 'Impossible de charger les données du dashboard.' }, { status: 500 })
  }
}
