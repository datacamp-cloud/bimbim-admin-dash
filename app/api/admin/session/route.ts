import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();

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

  const initials = (() => {
    const parts = session.nom.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "AD";
    const first = parts[0]?.[0]?.toUpperCase() ?? "";
    const second = parts[1]?.[0]?.toUpperCase() ?? "";
    return `${first}${second}` || "AD";
  })();

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
