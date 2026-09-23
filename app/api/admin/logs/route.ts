import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const allowedLevels = new Set(['info', 'warning', 'error'])

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const level = params.get('level') ?? ''
    const category = params.get('category')?.trim() ?? ''
    const search = params.get('search')?.trim() ?? ''
    const limit = Math.min(Math.max(Number(params.get('limit') ?? 100) || 100, 1), 200)

    const logs = await prisma.logSysteme.findMany({
      where: {
        ...(allowedLevels.has(level) ? { niveau: level as 'info' | 'warning' | 'error' } : {}),
        ...(category ? { categorie: { contains: category, mode: 'insensitive' } } : {}),
        ...(search
          ? {
              OR: [
                { categorie: { contains: search, mode: 'insensitive' } },
                { message: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { date_log: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      data: logs.map((log) => ({
        id: log.id,
        source: 'system',
        category: log.categorie,
        level: log.niveau,
        message: log.message,
        meta: log.meta_json,
        date: log.date_log.toISOString(),
      })),
    })
  } catch (error) {
    console.error('GET /api/admin/logs', error)
    return NextResponse.json({ error: 'Impossible de charger les logs système.' }, { status: 500 })
  }
}
