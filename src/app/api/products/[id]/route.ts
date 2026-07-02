import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateInitData } from "@/lib/telegram";
import { ProductStatus } from "@prisma/client";

function serializeProduct(p: {
  id: string;
  title: string;
  description: string;
  price: { toString: () => string };
  currency: string;
  category: string;
  images: string[];
  status: string;
  userId: bigint;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: bigint;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    photoUrl: string | null;
  } | null;
}) {
  return {
    ...p,
    price: p.price.toString(),
    userId: p.userId.toString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    user: p.user
      ? { ...p.user, id: p.user.id.toString() }
      : undefined,
  };
}

// GET /api/products/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Оголошення не знайдено" }, { status: 404 });
  }

  return NextResponse.json(serializeProduct(product));
}

// PATCH /api/products/:id — change status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return NextResponse.json({ error: "Оголошення не знайдено" }, { status: 404 });
  }

  if (product.userId !== BigInt(userId)) {
    return NextResponse.json({ error: "Немає прав" }, { status: 403 });
  }

  const body = await req.json();
  const { status } = body as { status?: ProductStatus };

  if (!status || !["ACTIVE", "SOLD", "ARCHIVED"].includes(status)) {
    return NextResponse.json({ error: "Невалідний статус" }, { status: 400 });
  }

  const updated = await prisma.product.update({
    where: { id },
    data: { status },
    include: { user: true },
  });

  return NextResponse.json(serializeProduct(updated));
}

// DELETE /api/products/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return NextResponse.json({ error: "Оголошення не знайдено" }, { status: 404 });
  }

  if (product.userId !== BigInt(userId)) {
    return NextResponse.json({ error: "Немає прав" }, { status: 403 });
  }

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
