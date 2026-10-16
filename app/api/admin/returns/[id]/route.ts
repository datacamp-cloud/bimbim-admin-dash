import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getVerifiedAdminSession } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

const ALLOWED_STATUSES = ["valide", "rejete"] as const

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getVerifiedAdminSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 })
  }

  if (session.role !== "super_admin" && session.role !== "moderateur") {
    return NextResponse.json(
      { error: "Votre rôle ne permet pas de valider ou rejeter un retour." },
      { status: 403 },
    )
  }

  const { id: rawId } = await context.params
  const id = Number(rawId)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Identifiant de retour invalide." }, { status: 400 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const status = body?.status
    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Statut de retour invalide." }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.retourLivraison.findUnique({
        where: { id },
        select: { id: true, statut: true, id_admin_validation: true },
      })
      if (!existing) return { missing: true as const }
      if (existing.statut !== "en_attente") {
        return { conflict: true as const, status: existing.statut }
      }

      const updated = await tx.retourLivraison.update({
        where: { id },
        data: { statut: status, id_admin_validation: session.sub },
        select: { id: true, statut: true, id_admin_validation: true },
      })

      await tx.auditAction.create({
        data: {
          admin_id: session.sub,
          action: status === "valide" ? "validation_retour_livraison" : "rejet_retour_livraison",
          table_cible: "retours_livraisons",
          id_cible: id,
          ancienne_valeur: { statut: existing.statut },
          nouvelle_valeur: { statut: updated.statut },
        },
      })

      return { updated }
    })

    if ("missing" in result) {
      return NextResponse.json({ error: "Retour introuvable." }, { status: 404 })
    }
    if ("conflict" in result) {
      return NextResponse.json(
        { error: "Ce retour a déjà été traité.", status: result.status },
        { status: 409 },
      )
    }

    return NextResponse.json({ success: true, data: result.updated })
  } catch (error) {
    console.error("PATCH /api/admin/returns/[id]", error)
    return NextResponse.json({ error: "Impossible de mettre à jour ce retour." }, { status: 500 })
  }
}
