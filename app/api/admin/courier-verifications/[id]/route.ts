import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getVerifiedAdminSession } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getVerifiedAdminSession()
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 })

  const id = Number((await context.params).id)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Identifiant coursier invalide." }, { status: 400 })
  }

  try {
    const courier = await prisma.livreur.findFirst({
      where: { id, documents: { some: {} } },
      select: {
        id: true, pseudo: true, nom: true, prenom: true, telephone: true,
        genre: true, photo: true, cni: true, permis: true, immatriculation: true,
        adresse: true, statut_compte: true, date_creation: true,
        type_engin: { select: { nom: true } },
        documents: {
          select: {
            id: true, type_document: true, nom_fichier: true, mime_type: true,
            taille: true, statut: true, date_creation: true,
          },
          orderBy: { date_creation: "asc" },
        },
      },
    })

    if (!courier) return NextResponse.json({ error: "Dossier coursier introuvable." }, { status: 404 })

    return NextResponse.json({
      data: {
        ...courier,
        photo: Boolean(courier.photo),
        cni: Boolean(courier.cni),
        permis: Boolean(courier.permis),
      },
    })
  } catch (error) {
    console.error("GET /api/admin/courier-verifications/[id]", error)
    return NextResponse.json({ error: "Impossible de charger ce dossier." }, { status: 500 })
  }
}
