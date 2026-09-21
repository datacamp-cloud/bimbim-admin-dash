import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const admin = await prisma.administrateur.findFirst({ where: { statut: 'actif' }, orderBy: { date_creation: 'asc' }, select: { id:true, nom:true, email:true, login:true, role:true, statut:true, date_creation:true, date_maj:true } })
    return NextResponse.json({ organization: 'Bimbim Côte d’Ivoire', admin })
  } catch (error) {
    console.error('GET /api/admin/settings', error)
    return NextResponse.json({ error: 'Impossible de charger les paramètres.' }, { status: 500 })
  }
}
