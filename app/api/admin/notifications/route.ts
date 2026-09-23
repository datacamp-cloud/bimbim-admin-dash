import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const channels = new Set(['sms', 'push', 'email'])

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const channel = params.get('channel') ?? ''
    const status = params.get('status') ?? ''
    const limit = Math.min(Math.max(Number(params.get('limit') ?? 100) || 100, 1), 200)

    const notifications = await prisma.notification.findMany({
      where: {
        user_type: 'admin',
        ...(channels.has(channel) ? { type_notification: channel as 'sms' | 'push' | 'email' } : {}),
        ...(status ? { statut_envoi: status as 'envoye' | 'echec' | 'en_attente' } : {}),
      },
      orderBy: { date_envoi: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      data: notifications.map((notification) => ({
        id: notification.id,
        category: notification.type_notification,
        title: notification.titre,
        description: notification.message,
        status: notification.statut_envoi,
        date: notification.date_envoi.toISOString(),
      })),
      filters: {
        channels: [...channels],
        statuses: ['envoye', 'en_attente', 'echec'],
      },
    })
  } catch (error) {
    console.error('GET /api/admin/notifications', error)
    return NextResponse.json({ error: 'Impossible de charger les notifications.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const id = Number(body?.id)

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'Identifiant de notification invalide.' }, { status: 400 })
    }

    const existing = await prisma.notification.findFirst({
      where: { id, user_type: 'admin' },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Notification introuvable.' }, { status: 404 })
    }

    await prisma.notification.delete({ where: { id } })
    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('DELETE /api/admin/notifications', error)
    return NextResponse.json({ error: 'Impossible de supprimer la notification.' }, { status: 500 })
  }
}
