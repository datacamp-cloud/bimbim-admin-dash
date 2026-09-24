import { NextRequest, NextResponse } from "next/server";
import { scryptSync, timingSafeEqual } from "node:crypto";
import prisma from "@/lib/prisma";
import { adminSessionCookie, createAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;

  try {
    const derived = scryptSync(password, Buffer.from(salt, "base64url"), 64);
    const expected = Buffer.from(hash, "base64url");
    return expected.length === derived.length && timingSafeEqual(expected, derived);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const login = String(body?.login ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!login || !password) {
      return NextResponse.json({ error: "Identifiant et mot de passe requis." }, { status: 400 });
    }

    const admin = await prisma.administrateur.findFirst({
      where: {
        OR: [{ login }, { email: login }],
      },
      select: {
        id: true,
        nom: true,
        login: true,
        mot_de_passe: true,
        role: true,
        statut: true,
      },
    });

    if (!admin || admin.statut !== "actif" || !verifyPassword(password, admin.mot_de_passe)) {
      return NextResponse.json({ error: "Identifiant ou mot de passe incorrect." }, { status: 401 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    await prisma.$transaction([
      prisma.administrateur.update({
        where: { id: admin.id },
        data: {
          connecte: true,
          date_connexion: new Date(),
          ip_connexion: ip,
        },
      }),
      prisma.logSysteme.create({
        data: {
          categorie: "auth.admin",
          niveau: "info",
          message: `Connexion administrateur: ${admin.login}`,
          meta_json: { admin_id: admin.id, ip },
        },
      }),
    ]);

    const response = NextResponse.json({
      success: true,
      admin: { id: admin.id, nom: admin.nom, login: admin.login, role: admin.role },
    });

    response.cookies.set(
      adminSessionCookie.name,
      createAdminSession({
        sub: admin.id,
        login: admin.login,
        nom: admin.nom,
        role: admin.role,
      }),
      adminSessionCookie,
    );

    return response;
  } catch (error) {
    console.error("POST /api/auth/admin/login", error);
    return NextResponse.json({ error: "Impossible de se connecter." }, { status: 500 });
  }
}
