import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getVerifiedAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getVerifiedAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const zones = await prisma.zone.findMany({
      orderBy: [{ ville: "asc" }, { nom_zone: "asc" }],
      include: { tarif_destination: true },
    });

    return NextResponse.json({
      zones: zones.map((zone) => ({
        id: zone.id,
        nom_zone: zone.nom_zone,
        ville: zone.ville,
        zone_active: zone.actif,
        montant: Number(zone.tarif_destination?.montant ?? 1000),
        actif: zone.tarif_destination?.actif ?? true,
        tarif_configure: Boolean(zone.tarif_destination),
      })),
      canEdit: session.role === "super_admin",
    });
  } catch (error) {
    console.error("GET /api/admin/destination-tariffs", error);
    return NextResponse.json(
      { error: "Impossible de charger les tarifs des zones." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getVerifiedAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (session.role !== "super_admin") {
    return NextResponse.json(
      { error: "Seul un super administrateur peut modifier les tarifs." },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as {
      zoneId?: unknown;
      montant?: unknown;
      actif?: unknown;
    };
    const zoneId = Number(body.zoneId);
    const montant = Number(body.montant);

    if (
      !Number.isSafeInteger(zoneId) ||
      zoneId <= 0 ||
      !Number.isSafeInteger(montant) ||
      montant < 1 ||
      montant > 10_000_000 ||
      typeof body.actif !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Données invalides. Le tarif doit être un montant entier positif en FCFA." },
        { status: 400 },
      );
    }

    const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) {
      return NextResponse.json({ error: "Zone introuvable." }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const previous = await tx.tarifDestination.findUnique({
        where: { zone_id: zoneId },
      });
      const saved = await tx.tarifDestination.upsert({
        where: { zone_id: zoneId },
        create: { zone_id: zoneId, montant, actif: body.actif as boolean },
        update: { montant, actif: body.actif as boolean },
      });

      await tx.auditAction.create({
        data: {
          admin_id: session.sub,
          action: "Modification du tarif de destination",
          table_cible: "tarifs_destinations",
          id_cible: saved.id,
          ancienne_valeur: previous
            ? { montant: Number(previous.montant), actif: previous.actif }
            : { montant: null, actif: null },
          nouvelle_valeur: { montant, actif: body.actif },
        },
      });

      return saved;
    });

    return NextResponse.json({
      success: true,
      tarif: {
        zoneId,
        montant: Number(result.montant),
        actif: result.actif,
      },
    });
  } catch (error) {
    console.error("PATCH /api/admin/destination-tariffs", error);
    return NextResponse.json(
      { error: "Impossible d’enregistrer ce tarif." },
      { status: 500 },
    );
  }
}
