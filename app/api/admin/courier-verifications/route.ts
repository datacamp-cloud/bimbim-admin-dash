import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getVerifiedAdminSession } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await getVerifiedAdminSession()
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 })

  try {
    const q = request.nextUrl.searchParams.get("q")?.trim()
    const status = request.nextUrl.searchParams.get("status")
    const allowedStatuses = ["en_verification", "actif", "rejete"] as const

    const where = {
      // Les dossiers avec documents sont issus du parcours d'inscription public.
      documents: { some: {} },
      ...(allowedStatuses.includes(status as (typeof allowedStatuses)[number])
        ? { statut_compte: status as (typeof allowedStatuses)[number] }
        : {}),
      ...(q
        ? {
            OR: [
              { nom: { contains: q, mode: "insensitive" as const } },
              { prenom: { contains: q, mode: "insensitive" as const } },
              { pseudo: { contains: q, mode: "insensitive" as const } },
              { telephone: { contains: q } },
            ],
          }
        : {}),
    }

    const [items, enAttente, valides, rejetes] = await Promise.all([
      prisma.livreur.findMany({
        where,
        orderBy: { date_creation: "desc" },
        take: 100,
        select: {
          id: true,
          pseudo: true,
          nom: true,
          prenom: true,
          telephone: true,
          photo: true,
          statut_compte: true,
          date_creation: true,
          type_engin: { select: { nom: true } },
          documents: {
            select: { id: true, type_document: true, statut: true, date_creation: true },
            orderBy: { date_creation: "asc" },
          },
        },
      }),
      prisma.livreur.count({ where: { documents: { some: {} }, statut_compte: "en_verification" } }),
      prisma.livreur.count({ where: { documents: { some: {} }, statut_compte: "actif" } }),
      prisma.livreur.count({ where: { documents: { some: {} }, statut_compte: "rejete" } }),
    ])

    return NextResponse.json({
      stats: { en_attente: enAttente, valides, rejetes },
      data: items.map((courier) => ({
        ...courier,
        photo: Boolean(courier.photo),
        documents: courier.documents.map(({ id, type_document, statut, date_creation }) => ({
          id, type_document, statut, date_creation,
        })),
      })),
    })
  } catch (error) {
    console.error("GET /api/admin/courier-verifications", error)
    return NextResponse.json({ error: "Impossible de charger les dossiers coursiers." }, { status: 500 })
  }
}
