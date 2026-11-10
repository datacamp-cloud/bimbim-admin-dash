import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getVerifiedAdminSession } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getVerifiedAdminSession()
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 })

  if (session.role !== "super_admin" && session.role !== "moderateur") {
    return NextResponse.json({ error: "Votre rôle ne permet pas de traiter les dossiers coursiers." }, { status: 403 })
  }

  const id = Number((await context.params).id)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Identifiant coursier invalide." }, { status: 400 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const decision = body?.decision
    const reason = typeof body?.reason === "string" ? body.reason.trim() : ""

    if (decision !== "valider" && decision !== "rejeter") {
      return NextResponse.json({ error: "Décision invalide." }, { status: 400 })
    }
    if (decision === "rejeter" && (reason.length < 5 || reason.length > 1000)) {
      return NextResponse.json({ error: "Le motif de rejet doit contenir entre 5 et 1 000 caractères." }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const courier = await tx.livreur.findFirst({
        where: { id, documents: { some: {} } },
        select: {
          id: true, statut_compte: true, photo: true,
          documents: { select: { type_document: true, statut: true } },
        },
      })
      if (!courier) return { missing: true as const }
      if (courier.statut_compte !== "en_verification") {
        return { conflict: true as const, status: courier.statut_compte }
      }

      if (decision === "valider") {
        const hasIdentityDocument = courier.documents.some((doc) =>
          ["cni", "piece_identite", "identite"].includes(doc.type_document.toLowerCase()),
        )
        if (!hasIdentityDocument || !courier.photo) {
          return { incomplete: true as const }
        }
      }

      const nextStatus = decision === "valider" ? "actif" : "rejete"
      const updated = await tx.livreur.update({
        where: { id },
        data: { statut_compte: nextStatus },
        select: { id: true, statut_compte: true },
      })

      await tx.livreurDocument.updateMany({
        where: { livreur_id: id },
        data: { statut: decision === "valider" ? "verifie" : "rejete" },
      })

      await tx.auditAction.create({
        data: {
          admin_id: session.sub,
          action: decision === "valider" ? "validation_dossier_coursier" : "rejet_dossier_coursier",
          table_cible: "livreurs",
          id_cible: id,
          ancienne_valeur: { statut_compte: courier.statut_compte },
          nouvelle_valeur: {
            statut_compte: updated.statut_compte,
            ...(decision === "rejeter" ? { motif: reason } : {}),
          },
        },
      })

      return { updated }
    })

    if ("missing" in result) return NextResponse.json({ error: "Dossier coursier introuvable." }, { status: 404 })
    if ("conflict" in result) return NextResponse.json({ error: "Ce dossier a déjà été traité.", status: result.status }, { status: 409 })
    if ("incomplete" in result) return NextResponse.json({ error: "Dossier incomplet : la pièce d'identité et le selfie sont obligatoires." }, { status: 422 })

    return NextResponse.json({ success: true, data: result.updated })
  } catch (error) {
    console.error("PATCH /api/admin/courier-verifications/[id]/decision", error)
    return NextResponse.json({ error: "Impossible d'enregistrer cette décision." }, { status: 500 })
  }
}
