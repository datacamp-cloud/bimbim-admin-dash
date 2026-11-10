import { get } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getVerifiedAdminSession } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string; fileId: string }> },
) {
  const session = await getVerifiedAdminSession()
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 })

  const { id: rawId, fileId } = await context.params
  const courierId = Number(rawId)
  if (!Number.isInteger(courierId) || courierId <= 0) {
    return NextResponse.json({ error: "Identifiant coursier invalide." }, { status: 400 })
  }

  try {
    const courier = await prisma.livreur.findFirst({
      where: { id: courierId, documents: { some: {} } },
      select: {
        photo: true,
        documents: {
          where: { id: Number.isInteger(Number(fileId)) ? Number(fileId) : -1 },
          select: { chemin_fichier: true, nom_fichier: true, mime_type: true },
          take: 1,
        },
      },
    })
    if (!courier) return NextResponse.json({ error: "Dossier coursier introuvable." }, { status: 404 })

    const isSelfie = fileId === "selfie"
    const document = courier.documents[0]
    const pathname = isSelfie ? courier.photo : document?.chemin_fichier
    const filename = isSelfie ? "selfie-coursier" : document?.nom_fichier
    const mimeType = isSelfie ? "image/jpeg" : document?.mime_type

    if (!pathname || !filename || !mimeType) {
      return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 })
    }
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(mimeType)) {
      return NextResponse.json({ error: "Type de fichier non autorisé." }, { status: 415 })
    }

    const blob = await get(pathname, { access: "private" })
    if (!blob || !blob.stream) return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 })

    const safeFilename = filename.replace(/[\\r\\n"]/g, "_")
    return new Response(blob.stream, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${safeFilename}"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    })
  } catch (error) {
    console.error("GET /api/admin/courier-verifications/[id]/files/[fileId]", error)
    return NextResponse.json({ error: "Impossible de consulter ce fichier." }, { status: 500 })
  }
}
