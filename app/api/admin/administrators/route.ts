import { NextRequest, NextResponse } from "next/server";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import prisma from "@/lib/prisma";
import { getVerifiedAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const roles = ["super_admin", "support", "moderateur"] as const;
const statuses = ["actif", "inactif", "suspendu"] as const;

function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

function authorized(role: string) {
  return role === "super_admin";
}

export async function GET() {
  const session = await getVerifiedAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  if (!authorized(session.role)) return NextResponse.json({ error: "Accès réservé au super administrateur." }, { status: 403 });

  const admins = await prisma.administrateur.findMany({
    orderBy: { date_creation: "desc" },
    select: { id: true, nom: true, email: true, login: true, role: true, statut: true, connecte: true, date_connexion: true, date_creation: true },
  });
  return NextResponse.json({ data: admins });
}

export async function POST(request: NextRequest) {
  const session = await getVerifiedAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  if (!authorized(session.role)) return NextResponse.json({ error: "Accès réservé au super administrateur." }, { status: 403 });

  try {
    const body = await request.json();
    const nom = String(body?.nom ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const login = String(body?.login ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    const role = String(body?.role ?? "");
    if (!nom || !email || !login || password.length < 12 || !roles.includes(role as typeof roles[number])) {
      return NextResponse.json({ error: "Nom, email, identifiant, rôle et mot de passe (12 caractères minimum) sont requis." }, { status: 400 });
    }
    const created = await prisma.administrateur.create({
      data: { nom, email, login, role: role as typeof roles[number], mot_de_passe: hashPassword(password) },
      select: { id: true, nom: true, email: true, login: true, role: true, statut: true, date_creation: true },
    });
    await prisma.logSysteme.create({ data: { categorie: "admin.accounts", niveau: "info", message: `Compte administrateur créé: ${login}`, meta_json: { actor_id: session.sub, target_id: created.id } } });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("Unique") ? "Cet email ou cet identifiant est déjà utilisé." : "Impossible de créer le compte administrateur.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getVerifiedAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  if (!authorized(session.role)) return NextResponse.json({ error: "Accès réservé au super administrateur." }, { status: 403 });

  try {
    const body = await request.json();
    const id = Number(body?.id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
    const existing = await prisma.administrateur.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Administrateur introuvable." }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (body.role !== undefined) {
      if (!roles.includes(body.role)) return NextResponse.json({ error: "Rôle invalide." }, { status: 400 });
      data.role = body.role;
    }
    if (body.statut !== undefined) {
      if (!statuses.includes(body.statut)) return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
      if (existing.role === "super_admin" && existing.statut === "actif" && body.statut !== "actif") {
        const activeCount = await prisma.administrateur.count({ where: { role: "super_admin", statut: "actif" } });
        if (activeCount <= 1) return NextResponse.json({ error: "Impossible de désactiver le dernier super administrateur actif." }, { status: 409 });
      }
      data.statut = body.statut;
    }
    if (body.password !== undefined) {
      if (typeof body.password !== "string" || body.password.length < 12) return NextResponse.json({ error: "Le mot de passe doit contenir au moins 12 caractères." }, { status: 400 });
      data.mot_de_passe = hashPassword(body.password);
    }
    if (Object.keys(data).length === 0) return NextResponse.json({ error: "Aucune modification fournie." }, { status: 400 });
    const updated = await prisma.administrateur.update({
      where: { id }, data: data as any,
      select: { id: true, nom: true, email: true, login: true, role: true, statut: true, connecte: true, date_connexion: true },
    });
    await prisma.logSysteme.create({ data: { categorie: "admin.accounts", niveau: "warning", message: `Compte administrateur modifié: ${existing.login}`, meta_json: { actor_id: session.sub, target_id: id, fields: Object.keys(data) } } });
    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: "Impossible de modifier le compte administrateur." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getVerifiedAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  if (!authorized(session.role)) return NextResponse.json({ error: "Accès réservé au super administrateur." }, { status: 403 });
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  if (id === session.sub) return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte." }, { status: 409 });

  const target = await prisma.administrateur.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Administrateur introuvable." }, { status: 404 });
  if (target.role === "super_admin" && target.statut === "actif") {
    const activeCount = await prisma.administrateur.count({ where: { role: "super_admin", statut: "actif" } });
    if (activeCount <= 1) return NextResponse.json({ error: "Impossible de supprimer le dernier super administrateur actif." }, { status: 409 });
  }
  await prisma.administrateur.update({ where: { id }, data: { statut: "inactif", connecte: false } });
  await prisma.logSysteme.create({ data: { categorie: "admin.accounts", niveau: "warning", message: `Accès administrateur révoqué: ${target.login}`, meta_json: { actor_id: session.sub, target_id: id } } });
  return NextResponse.json({ success: true });
}
