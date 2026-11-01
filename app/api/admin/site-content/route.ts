import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getVerifiedAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

async function requireSuperAdmin() {
  const session = await getVerifiedAdminSession();
  if (!session) return { error: NextResponse.json({ error: "Non autorisé." }, { status: 401 }) };
  if (session.role !== "super_admin") return { error: NextResponse.json({ error: "Accès réservé au super administrateur." }, { status: 403 }) };
  return { session };
}

function normalize(body: Record<string, unknown>) {
  const key = String(body.key ?? "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  const section = String(body.section ?? "").trim();
  const imageUrl = body.image_url == null ? null : String(body.image_url).trim();
  const buttonUrl = body.button_url == null ? null : String(body.button_url).trim();
  if (!key || key.length > 100 || !section || section.length > 100) throw new Error("Une clé et une section valides sont requises.");
  if (imageUrl && !/^https:\/\//i.test(imageUrl) && !imageUrl.startsWith("/")) throw new Error("L’image doit utiliser une URL HTTPS ou un chemin local.");
  if (buttonUrl && !/^(https:\/\/|\/|#)/i.test(buttonUrl)) throw new Error("Le lien du bouton est invalide.");
  return {
    key, section,
    title: body.title == null ? null : String(body.title).slice(0, 255),
    body: body.body == null ? null : String(body.body),
    image_url: imageUrl,
    button_label: body.button_label == null ? null : String(body.button_label).slice(0, 100),
    button_url: buttonUrl,
    enabled: body.enabled !== false,
    sort_order: Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0,
  };
}

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;
  const data = await prisma.siteContent.findMany({ orderBy: [{ section: "asc" }, { sort_order: "asc" }, { id: "asc" }] });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;
  try {
    const data = normalize(await request.json());
    const created = await prisma.siteContent.create({ data });
    await prisma.logSysteme.create({ data: { categorie: "cms.site", niveau: "info", message: `Contenu public créé: ${created.key}`, meta_json: { admin_id: auth.session.sub, content_id: created.id } } });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Création impossible." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;
  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
    const data = normalize(body);
    const updated = await prisma.siteContent.update({ where: { id }, data });
    await prisma.logSysteme.create({ data: { categorie: "cms.site", niveau: "info", message: `Contenu public modifié: ${updated.key}`, meta_json: { admin_id: auth.session.sub, content_id: id } } });
    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Modification impossible." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  try {
    await prisma.siteContent.delete({ where: { id } });
    await prisma.logSysteme.create({ data: { categorie: "cms.site", niveau: "warning", message: `Contenu public supprimé: #${id}`, meta_json: { admin_id: auth.session.sub, content_id: id } } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Suppression impossible." }, { status: 404 });
  }
}
