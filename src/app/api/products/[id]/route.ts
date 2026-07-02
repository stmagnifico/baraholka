import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateInitData } from "@/lib/telegram";
import { ProductStatus } from "@prisma/client";

function serializeProduct(p: {
  id: string;
  title: string;
  description: string;
  price: { toString: () => string };
  isFree: boolean;
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
    user: p.user ? { ...p.user, id: p.user.id.toString() } : undefined,
  };
}

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
  const { status, title, description, price, isFree, category, images } = body as {
    status?: ProductStatus;
    title?: string;
    description?: string;
    price?: number;
    isFree?: boolean;
    category?: string;
    images?: string[];
  };

  const data: Record<string, unknown> = {};

  if (status) {
    if (!["ACTIVE", "SOLD", "ARCHIVED"].includes(status)) {
      return NextResponse.json({ error: "Невалідний статус" }, { status: 400 });
    }
    data.status = status;
  }

  if (title !== undefined) data.title = title.trim();
  if (description !== undefined) data.description = description.trim();
  if (category !== undefined) data.category = category;
  if (images !== undefined) data.images = images;

  if (isFree !== undefined) {
    data.isFree = isFree;
    if (isFree) data.price = 0;
  }

  if (price !== undefined && !isFree) {
    if (price <= 0) {
      return NextResponse.json({ error: "Вкажіть коректну ціну" }, { status: 400 });
    }
    data.price = price;
    data.isFree = false;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Немає даних для оновлення" }, { status: 400 });
  }

  const updated = await prisma.product.update({
    where: { id },
    data,
    include: { user: true },
  });

  return NextResponse.json(serializeProduct(updated));
}

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
