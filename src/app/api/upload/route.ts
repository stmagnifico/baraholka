import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { validateInitData } from "@/lib/telegram";
import { getSupabaseAdmin, PRODUCT_IMAGES_BUCKET } from "@/lib/supabase";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export async function POST(req: NextRequest) {
  const initData = req.headers.get("x-init-data") ?? "";
  if (!initData) {
    return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  }

  let userId: number;
  try {
    const session = validateInitData(initData);
    userId = session.user.id;
  } catch {
    return NextResponse.json({ error: "Невалідний initData" }, { status: 401 });
  }

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Сховище не налаштоване";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передано" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Дозволені лише зображення (JPEG, PNG, WebP)" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Файл завеликий (макс. 5 МБ)" }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) {
    console.error("Supabase upload error:", error);
    return NextResponse.json({ error: "Не вдалося завантажити фото" }, { status: 500 });
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
