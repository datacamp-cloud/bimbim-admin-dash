import { NextResponse } from "next/server";
import { getVerifiedAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getVerifiedAdminSession();

  if (!session) {
    return NextResponse.json({ admin: null }, { status: 401 });
  }

  const roleLabel =
    session.role === "super_admin"
      ? "Super administrateur"
      : session.role === "support"
        ? "Support"
        : session.role === "moderateur"
          ? "Modérateur"
          : "Administrateur";

  const parts = session.nom.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length
    ? `${parts[0]?.[0]?.toUpperCase() ?? ""}${parts[1]?.[0]?.toUpperCase() ?? ""}` || "AD"
    : "AD";

  return NextResponse.json({
    admin: {
      nom: session.nom,
      login: session.login,
      role: session.role,
      roleLabel,
      initials,
    },
  });
}
