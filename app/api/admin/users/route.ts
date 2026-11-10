import { NextRequest, NextResponse } from 'next/server'
import { ClientStatut, Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { getVerifiedAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await getVerifiedAdminSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })

  try {
    const q = request.nextUrl.searchParams.get('q')?.trim()
    const type = request.nextUrl.searchParams.get('type')
    const status = request.nextUrl.searchParams.get('status')

    const typeFilter: Prisma.ClientWhereInput = {
      type_client: type === 'partners' ? 'entreprise' : 'particulier',
    }
    const searchFilter: Prisma.ClientWhereInput = q
      ? {
          OR: [
            { nom: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { telephone: { contains: q } },
          ],
        }
      : {}

    const statusFilter: Prisma.ClientWhereInput =
      status === 'actif' || status === 'inactif' || status === 'bloque'
        ? { statut: status as ClientStatut }
        : {}

    const where: Prisma.ClientWhereInput = {
      ...typeFilter,
      ...searchFilter,
      ...statusFilter,
    }

    const [data, total, actifs, nouveaux] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { date_creation: 'desc' },
        take: 100,
        select: {
          id: true,
          type_client: true,
          nom: true,
          email: true,
          telephone: true,
          adresse_principale: true,
          statut: true,
          date_creation: true,
        },
      }),
      prisma.client.count({ where: typeFilter }),
      prisma.client.count({ where: { ...typeFilter, statut: ClientStatut.actif } }),
      prisma.client.count({
        where: {
          ...typeFilter,
          date_creation: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) },
        },
      }),
    ])

    const deliveryCounts = data.length
      ? await prisma.livraison.groupBy({
          by: ['client_expediteur_id'],
          where: { client_expediteur_id: { in: data.map((client) => client.id) } },
          _count: { _all: true },
        })
      : []

    const deliveryCountByClient = new Map(
      deliveryCounts.map((item) => [item.client_expediteur_id, item._count._all]),
    )

    return NextResponse.json({
      stats: { total, actifs, nouveaux },
      data: data.map((u) => ({
        ...u,
        name: u.nom ?? 'Sans nom',
        deliveries: deliveryCountByClient.get(u.id) ?? 0,
        adresse: u.adresse_principale,
        date_creation: u.date_creation.toISOString(),
      })),
    })
  } catch (error) {
    console.error('GET /api/admin/users', error)
    return NextResponse.json({ error: 'Impossible de charger les utilisateurs.' }, { status: 500 })
  }
}
