import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getVerifiedAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

const num = (value: unknown) => Number(value ?? 0)

const deltaPercent = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

const averageMinutes = (rows: { date_debut: Date | null; date_fin: Date | null }[]) => {
  const durations = rows
    .filter((row) => row.date_debut && row.date_fin)
    .map((row) => (row.date_fin!.getTime() - row.date_debut!.getTime()) / 60000)
    .filter((minutes) => minutes >= 0 && minutes <= 24 * 60)

  if (!durations.length) return null
  return Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
}

export async function GET() {
  const session = await getVerifiedAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  try {
    const now = new Date()
    const start30 = new Date(now)
    start30.setDate(now.getDate() - 29)
    start30.setHours(0, 0, 0, 0)

    const start60 = new Date(start30)
    start60.setDate(start30.getDate() - 30)

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
      revenuePreviousRows,
      commissionRows,
      commissionPreviousRows,
      bonusRows,
      adjustmentRows,
      orderStatusRows,
      dailyRows,
      recentOrders,
      recentTransactions,
      returns,
      positions,
      currentSegments,
      previousSegments,
      currentCompletedSegments,
      previousCompletedSegments,
      currentRatings,
      previousRatings,
      currentCompletedDeliveries,
      previousCompletedDeliveries,
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
      prisma.transaction.aggregate({
        _sum: { montant: true },
        where: { statut: 'reussi', date_operation: { gte: start30 } },
      }),
      prisma.transaction.aggregate({
        _sum: { montant: true },
        where: { statut: 'reussi', date_operation: { gte: start60, lt: start30 } },
      }),
      prisma.transaction.aggregate({
        _sum: { montant: true },
        where: { type_transaction: 'commission', statut: 'reussi', date_operation: { gte: start30 } },
      }),
      prisma.transaction.aggregate({
        _sum: { montant: true },
        where: { type_transaction: 'commission', statut: 'reussi', date_operation: { gte: start60, lt: start30 } },
      }),
      prisma.transaction.aggregate({
        _sum: { montant: true },
        where: { type_transaction: 'bonus', statut: 'reussi', date_operation: { gte: start30 } },
      }),
      prisma.transaction.aggregate({
        _sum: { montant: true },
        where: { type_transaction: 'ajustement', statut: 'reussi', date_operation: { gte: start30 } },
      }),
      prisma.commande.groupBy({
        by: ['statut'],
        where: { date_creation: { gte: start30 } },
        _count: { _all: true },
      }),
      prisma.commande.findMany({
        where: { date_creation: { gte: start7 } },
        select: { date_creation: true },
      }),
      prisma.commande.findMany({
        orderBy: { date_creation: 'desc' },
        take: 5,
        select: {
          id: true,
          statut: true,
          total_montant: true,
          date_creation: true,
          total_livraisons: true,
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
        },
      }),
      prisma.transaction.findMany({
        where: { statut: 'reussi' },
        orderBy: { date_operation: 'desc' },
        take: 50,
        select: {
          id: true,
          montant: true,
          type_transaction: true,
          statut: true,
          date_operation: true,
          reference: true,
          moyen_paiement: true,
          description: true,
        },
      }),
      prisma.retourLivraison.findMany({
        orderBy: { date_retour: 'desc' },
        take: 5,
        select: {
          id: true,
          date_retour: true,
          statut: true,
          livreur: { select: { nom: true, prenom: true } },
        },
      }),
      prisma.positionLivreur.findMany({
        orderBy: { date_maj: 'desc' },
        take: 50,
        distinct: ['livreur_id'],
        select: {
          id: true,
          livreur_id: true,
          latitude: true,
          longitude: true,
          statut_tracking: true,
          livreur: {
            select: {
              nom: true,
              prenom: true,
              segments_destinataire: {
                take: 1,
                orderBy: { ordre_segment: 'desc' },
                select: { statut: true, livraison: { select: { statut: true } } },
              },
            },
          },
        },
      }),
      prisma.segmentLivraison.findMany({
        where: { date_debut: { gte: start30 } },
        select: { statut: true, date_debut: true, date_fin: true },
      }),
      prisma.segmentLivraison.findMany({
        where: { date_debut: { gte: start60, lt: start30 } },
        select: { statut: true, date_debut: true, date_fin: true },
      }),
      prisma.segmentLivraison.findMany({
        where: { statut: 'termine', date_fin: { gte: start30 } },
        select: { date_debut: true, date_fin: true },
      }),
      prisma.segmentLivraison.findMany({
        where: { statut: 'termine', date_fin: { gte: start60, lt: start30 } },
        select: { date_debut: true, date_fin: true },
      }),
      prisma.notation.findMany({
        where: { date_evaluation: { gte: start30 } },
        select: { note: true },
      }),
      prisma.notation.findMany({
        where: { date_evaluation: { gte: start60, lt: start30 } },
        select: { note: true },
      }),
      prisma.livraison.count({
        where: { statut: 'livre', date_maj: { gte: start30 } },
      }),
      prisma.livraison.count({
        where: { statut: 'livre', date_maj: { gte: start60, lt: start30 } },
      }),
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

    const currentAccepted = currentSegments.filter((row) => row.statut === 'en_cours' || row.statut === 'termine').length
    const previousAccepted = previousSegments.filter((row) => row.statut === 'en_cours' || row.statut === 'termine').length
    const currentEligible = currentSegments.filter((row) => row.statut !== 'assigne').length
    const previousEligible = previousSegments.filter((row) => row.statut !== 'assigne').length

    const currentRating = currentRatings.length
      ? currentRatings.reduce((sum, row) => sum + row.note, 0) / currentRatings.length
      : 0
    const previousRating = previousRatings.length
      ? previousRatings.reduce((sum, row) => sum + row.note, 0) / previousRatings.length
      : 0

    const revenue = num(revenueRows._sum.montant)
    const previousRevenue = num(revenuePreviousRows._sum.montant)
    const commissions = num(commissionRows._sum.montant)
    const previousCommissions = num(commissionPreviousRows._sum.montant)
    const bonuses = num(bonusRows._sum.montant)
    const adjustments = num(adjustmentRows._sum.montant)
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
      wallet: { totalBalance: num(globalWalletBalance._sum.solde) },
      revenue: {
        current: revenue,
        previous: previousRevenue,
        commissions,
        previousCommissions,
        bonuses,
        adjustments,
      },
      orders30d,
      dailyOrders: Array.from(dailyMap.entries()).map(([date, value]) => ({
        label: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(new Date(date)),
        value,
      })),
      performance: {
        averageDeliveryMinutes: averageMinutes(currentCompletedSegments),
        previousAverageDeliveryMinutes: averageMinutes(previousCompletedSegments),
        acceptanceRate: currentSegments.length ? Math.round((currentAccepted / currentSegments.length) * 100) : 0,
        previousAcceptanceRate: previousSegments.length ? Math.round((previousAccepted / previousSegments.length) * 100) : 0,
        rating: Number(currentRating.toFixed(1)),
        previousRating: Number(previousRating.toFixed(1)),
        completedDeliveries: currentCompletedDeliveries,
        previousCompletedDeliveries: previousCompletedDeliveries,
        acceptedEligibleRate: currentEligible ? Math.round((currentAccepted / currentEligible) * 100) : 0,
        previousAcceptedEligibleRate: previousEligible ? Math.round((previousAccepted / previousEligible) * 100) : 0,
      },
      recentOrders: recent,
      recentTransactions: recentTransactions.map(t => ({
        ...t,
        montant: num(t.montant),
        reference: t.reference,
        moyen_paiement: t.moyen_paiement,
        description: t.description,
        date_operation: t.date_operation.toISOString(),
      })),
      returns: returns.map(r => ({
        id: r.id,
        date: r.date_retour.toISOString(),
        courier: `${r.livreur.prenom} ${r.livreur.nom}`,
        statut: r.statut,
      })),
      positions: positions.map(p => {
        const deliveryStatus = p.livreur.segments_destinataire[0]?.livraison.statut
        return {
          id: p.id,
          latitude: num(p.latitude),
          longitude: num(p.longitude),
          status: deliveryStatus ?? (p.statut_tracking === 'online' ? 'en_cours' : 'a_venir'),
          courier: `${p.livreur.prenom} ${p.livreur.nom}`,
        }
      }),
      generatedAt: now.toISOString(),
    })
  } catch (error) {
    console.error('GET /api/admin/dashboard', error)
    return NextResponse.json({ error: 'Impossible de charger les données du dashboard.' }, { status: 500 })
  }
}
