import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, authErrorResponse } from "@/lib/auth";
import { BUMP_COOLDOWN_DAYS } from "@/lib/constants";
import { serializeProduct } from "@/lib/serialize-product";

const COOLDOWN_MS = BUMP_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const initData = req.headers.get("x-init-data") ?? "";

  let auth;
  try {
    auth = await requireAuth(initData);
  } catch (err) {
    return authErrorResponse(err);
  }

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return NextResponse.json({ error: "Оголошення не знайдено", reason: "deleted" }, { status: 410 });
  }

  if (product.userId !== auth.userId) {
    return NextResponse.json({ error: "Немає прав" }, { status: 403 });
  }

  if (product.status !== "ACTIVE") {
    return NextResponse.json({ error: "Підняти можна лише активне оголошення" }, { status: 400 });
  }

  const lastBump = product.bumpedAt ?? product.createdAt;
  const nextBumpAt = new Date(lastBump.getTime() + COOLDOWN_MS);
  const now = new Date();

  if (now < nextBumpAt) {
    return NextResponse.json(
      {
        error: `Підняти знову можна ${nextBumpAt.toLocaleDateString("uk-UA")}`,
        nextBumpAt: nextBumpAt.toISOString(),
      },
      { status: 400 }
    );
  }

  const updated = await prisma.product.update({
    where: { id },
    data: { bumpedAt: now },
    include: { user: true },
  });

  const newNextBumpAt = new Date(now.getTime() + COOLDOWN_MS);

  return NextResponse.json({
    product: serializeProduct(updated),
    nextBumpAt: newNextBumpAt.toISOString(),
  });
}
