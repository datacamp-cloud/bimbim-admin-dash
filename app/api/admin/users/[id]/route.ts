import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getVerifiedAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getVerifiedAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });

  try {
    const client = await prisma.client.findUnique({
      where: { id },
      select: {
        id: true, type_client: true, nom: true, photo: true, email: true, telephone: true,
        adresse_principale: true, est_verifie: true, date_verification: true, statut: true,
        points_cumules: true, livraisons_gratuites: true, date_creation: true, date_maj: true,
        documents: { select: { id: true, type_document: true, nom_fichier: true, chemin_fichier: true, statut: true, date_creation: true }, orderBy: { date_creation: "desc" } },
        commandes: { select: { id: true, statut: true, total_livraisons: true, total_montant: true, date_creation: true }, orderBy: { date_creation: "desc" }, take: 10 },
        _count: { select: { livraisons_expediees: true, commandes: true } },
      },
    });
    if (!client) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    return NextResponse.json({ data: {
      ...client,
      livraisons: client._count.livraisons_expediees,
      commandes_count: client._count.commandes,
      date_creation: client.date_creation.toISOString(),
      date_maj: client.date_maj.toISOString(),
    } });
  } catch (error) {
    console.error("GET /api/admin/users/[id]", error);
    return NextResponse.json({ error: "Impossible de charger la fiche utilisateur." }, { status: 500 });
  }
}
