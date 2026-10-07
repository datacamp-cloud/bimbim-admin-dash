import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getVerifiedAdminSession } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

const RETURN_STATUSES = ["en_attente", "valide", "rejete"] as const

export async function GET(request: NextRequest) {
  const session = await getVerifiedAdminSession()

  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 })
  }

  try {
    const q = request.nextUrl.searchParams.get("q")?.trim()
    const status = request.nextUrl.searchParams.get("status")

    const where = {
      ...(status && RETURN_STATUSES.includes(status as (typeof RETURN_STATUSES)[number])
        ? { statut: status as (typeof RETURN_STATUSES)[number] }
        : {}),
      ...(q
        ? {
            OR: [
              { motif: { contains: q, mode: "insensitive" as const } },
              {
                livraison: {
                  adresse_ramassage: {
                    contains: q,
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                livraison: {
                  adresse_livraison: {
                    contains: q,
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                livreur: {
                  nom: { contains: q, mode: "insensitive" as const },
                },
              },
              {
                livreur: {
                  prenom: { contains: q, mode: "insensitive" as const },
                },
              },
            ],
          }
        : {}),
    }

    const data = await prisma.retourLivraison.findMany({
      where,
      orderBy: { date_retour: "desc" },
      take: 100,
      include: {
        livraison: {
          select: {
            id: true,
            adresse_ramassage: true,
            adresse_livraison: true,
            statut: true,
          },
        },
        livreur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            telephone: true,
          },
        },
      },
    })

    return NextResponse.json({
      data: data.map((item) => ({
        id: item.id,
        status: item.statut,
        motif: item.motif ?? "Motif non renseigné",
        date: item.date_retour.toISOString(),
        causeSysteme: item.cause_systeme,
        livraison: item.livraison,
        livreur: item.livreur,
      })),
    })
  } catch (error) {
    console.error("GET /api/admin/returns", error)

    return NextResponse.json(
      { error: "Impossible de charger les retours." },
      { status: 500 },
    )
  }
}
