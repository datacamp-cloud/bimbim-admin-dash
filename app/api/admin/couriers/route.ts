import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim()
    const status = request.nextUrl.searchParams.get('status')

    const where = {
      ...(q
        ? {
            OR: [
              { nom: { contains: q, mode: 'insensitive' as const } },
              { prenom: { contains: q, mode: 'insensitive' as const } },
              { pseudo: { contains: q, mode: 'insensitive' as const } },
              { matricule: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(status === 'disponible' ? { disponibilite: true } : {}),
      ...(status === 'offline' ? { disponibilite: false } : {}),
      ...(status === 'actif' ? { statut_compte: 'actif' as const } : {}),
    }

    const [items, total, actifs, disponibles, offline] = await Promise.all([
      prisma.livreur.findMany({
        where,
        orderBy: { date_maj: 'desc' },
        take: 100,
        include: {
          type_engin: true,
          _count: { select: { segments_destinataire: true, segments_source: true } },
        },
      }),
      prisma.livreur.count(),
      prisma.livreur.count({ where: { statut_compte: 'actif' } }),
      prisma.livreur.count({ where: { disponibilite: true, statut_compte: 'actif' } }),
      prisma.livreur.count({ where: { disponibilite: false } }),
    ])

    return NextResponse.json({
      stats: { total, actifs, disponibles, offline },
      data: items.map((c) => {
        const displayName = [c.prenom, c.nom].filter(Boolean).join(' ') || c.pseudo || 'Sans nom'
        const initials = displayName
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0])
          .join('')
          .toUpperCase() || 'L'

        return {
          id: c.id,
          matricule: c.matricule,
          name: displayName,
          initials,
          phone: c.telephone,
          vehicle: c.type_engin.nom,
          status: c.disponibilite ? 'Disponible' : c.statut_compte === 'actif' ? 'Hors ligne' : c.statut_compte,
          deliveries: c._count.segments_destinataire + c._count.segments_source,
          rating: Number(c.note_moyenne),
          zone: c.adresse ?? '—',
          updatedAt: c.date_maj.toISOString(),
        }
      }),
    })
  } catch (error) {
    console.error('GET /api/admin/couriers', error)
    return NextResponse.json({ error: 'Impossible de charger les coursiers.' }, { status: 500 })
  }
}
