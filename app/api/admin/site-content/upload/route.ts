import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getVerifiedAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

async function requireSuperAdmin() {
  const session = await getVerifiedAdminSession();
  if (!session) {
    return {
      error: NextResponse.json({ error: "Non autorisé." }, { status: 401 }),
    };
  }
  if (session.role !== "super_admin") {
    return {
      error: NextResponse.json(
        { error: "Accès réservé au super administrateur." },
        { status: 403 },
      ),
    };
  }
  return { session };
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Le stockage média n'est pas configuré sur ce déploiement." },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Aucun fichier image reçu." },
        { status: 400 },
      );
    }

    const extension = ALLOWED_TYPES.get(file.type);
    if (!extension) {
      return NextResponse.json(
        { error: "Format refusé. Utilisez JPG, PNG, WebP ou GIF." },
        { status: 415 },
      );
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "L'image doit peser entre 1 octet et 5 Mo." },
        { status: 413 },
      );
    }

    const pathname = `cms/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    await prisma.logSysteme.create({
      data: {
        categorie: "cms.media",
        niveau: "info",
        message: "Image ajoutée à la médiathèque du site public.",
        meta_json: {
          admin_id: auth.session.sub,
          pathname: blob.pathname,
          content_type: file.type,
          size: file.size,
        },
      },
    });

    return NextResponse.json(
      { data: { url: blob.url, pathname: blob.pathname, contentType: file.type, size: file.size } },
      { status: 201 },
    );
  } catch (error) {
    console.error("CMS media upload failed:", error);
    return NextResponse.json(
      { error: "L'envoi de l'image a échoué. Réessayez." },
      { status: 500 },
    );
  }
}
