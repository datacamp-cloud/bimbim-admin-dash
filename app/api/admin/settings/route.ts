import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getVerifiedAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getVerifiedAdminSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })

  try {
    const admin = await prisma.administrateur.findUnique({
      where: { id: session.sub },
      select: { id: true, nom: true, email: true, login: true, role: true, statut: true, date_creation: true, date_maj: true },
    })
    return NextResponse.json({ organization: 'Bimbim Côte d’Ivoire', admin })
  } catch (error) {
    console.error('GET /api/admin/settings', error)
    return NextResponse.json({ error: 'Impossible de charger les paramètres.' }, { status: 500 })
  }
}
