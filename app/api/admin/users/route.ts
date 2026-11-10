import { NextRequest, NextResponse } from 'next/server'
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

    const typeFilter = { type_client: type === 'partners' ? 'entreprise' as const : 'particulier' as const }
    const searchFilter = q
      ? {
          OR: [
            { nom: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
            { telephone: { contains: q } },
          ],
        }
      : {}

    const statusFilter = status === 'actif' || status === 'inactif' || status === 'bloque' ? { statut: status } : {}
    const where = { ...typeFilter, ...searchFilter, ...statusFilter }

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
          _count: { select: { livraisons_expediees: true } },
        },
      }),
      prisma.client.count({ where: typeFilter }),
      prisma.client.count({ where: { ...typeFilter, statut: 'actif' } }),
      prisma.client.count({
        where: {
          ...typeFilter,
          date_creation: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) },
        },
      }),
    ])

    return NextResponse.json({
      stats: { total, actifs, nouveaux },
      data: data.map((u) => ({
        ...u,
        name: u.nom ?? 'Sans nom',
        deliveries: u._count.livraisons_expediees,
        adresse: u.adresse_principale,
        date_creation: u.date_creation.toISOString(),
      })),
    })
  } catch (error) {
    console.error('GET /api/admin/users', error)
    return NextResponse.json({ error: 'Impossible de charger les utilisateurs.' }, { status: 500 })
  }
}
