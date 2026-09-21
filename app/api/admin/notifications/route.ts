import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await prisma.notification.findMany({ where: { user_type: 'admin' }, orderBy: { date_envoi: 'desc' }, take: 100 })
    return NextResponse.json({ data: data.map(n => ({ id:n.id, category:n.type_notification, title:n.titre, description:n.message, status:n.statut_envoi, date:n.date_envoi.toISOString() })) })
  } catch (error) {
    console.error('GET /api/admin/notifications', error)
    return NextResponse.json({ error: 'Impossible de charger les notifications.' }, { status: 500 })
  }
}
