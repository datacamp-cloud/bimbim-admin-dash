import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { adminSessionCookie, getAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getAdminSession();

  if (session) {
    await prisma.$transaction([
      prisma.administrateur.updateMany({
        where: { id: session.sub },
        data: { connecte: false, date_deconnexion: new Date() },
      }),
      prisma.logSysteme.create({
        data: {
          categorie: "auth.admin",
          niveau: "info",
          message: `Déconnexion administrateur: ${session.login}`,
          meta_json: { admin_id: session.sub },
        },
      }),
    ]);
  }

  const store = await cookies();
  store.set(adminSessionCookie.name, "", { ...adminSessionCookie, maxAge: 0 });

  return NextResponse.json({ success: true });
}
