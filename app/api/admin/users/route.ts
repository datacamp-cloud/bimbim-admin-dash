import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim()
    const where = q ? { OR: [{ nom: { contains: q, mode: 'insensitive' as const } }, { email: { contains: q, mode: 'insensitive' as const } }, { telephone: { contains: q } }] } : {}
    const [data, total, actifs, nouveaux] = await Promise.all([
      prisma.client.findMany({ where, orderBy: { date_creation: 'desc' }, take: 100, select: { id: true, nom: true, email: true, telephone: true, statut: true, date_creation: true, _count: { select: { livraisons_expediees: true } } } }),
      prisma.client.count(),
      prisma.client.count({ where: { statut: 'actif' } }),
      prisma.client.count({ where: { date_creation: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) } } }),
    ])
    return NextResponse.json({ stats: { total, actifs, nouveaux }, data: data.map(u => ({ ...u, deliveries: u._count.livraisons_expediees, date_creation: u.date_creation.toISOString() })) })
  } catch (error) {
    console.error('GET /api/admin/users', error)
    return NextResponse.json({ error: 'Impossible de charger les utilisateurs.' }, { status: 500 })
  }
}
