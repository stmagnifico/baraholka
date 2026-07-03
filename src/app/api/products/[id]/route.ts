import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProductStatus } from "@prisma/client";
import { notifySubscribersAboutProduct } from "@/lib/bot/notifications";
import { notifyProductRemovedByAdmin } from "@/lib/bot/admin-notifications";
import { requireAuth, authErrorResponse } from "@/lib/auth";
import { serializeProduct } from "@/lib/serialize-product";

const PRODUCT_INCLUDE = {
  user: true,
  adminEditedBy: {
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      photoUrl: true,
    },
  },
} as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: PRODUCT_INCLUDE,
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

  let auth;
  try {
    auth = await requireAuth(initData);
  } catch (err) {
    return authErrorResponse(err);
  }

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return NextResponse.json({ error: "Оголошення не знайдено" }, { status: 404 });
  }

  const isOwner = product.userId === auth.userId;
  if (!isOwner && !auth.isModerator) {
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
    if (!["DRAFT", "ACTIVE", "SOLD", "ARCHIVED"].includes(status)) {
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

  const contentFields = ["title", "description", "category", "images", "price", "isFree"] as const;
  const hasContentChange = contentFields.some((field) => data[field] !== undefined);

  if (auth.isModerator && !isOwner && hasContentChange) {
    data.adminEditedAt = new Date();
    data.adminEditedById = auth.userId;
  } else if (auth.isModerator && isOwner && hasContentChange) {
    data.adminEditedAt = null;
    data.adminEditedById = null;
  }

  const updated = await prisma.product.update({
    where: { id },
    data,
    include: PRODUCT_INCLUDE,
  });

  if (status === "ACTIVE" && product.status !== "ACTIVE") {
    notifySubscribersAboutProduct(updated).catch(console.error);
  }

  return NextResponse.json(serializeProduct(updated));
}

export async function DELETE(
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
    return NextResponse.json({ error: "Оголошення не знайдено" }, { status: 404 });
  }

  const isOwner = product.userId === auth.userId;
  if (!isOwner && !auth.isModerator) {
    return NextResponse.json({ error: "Немає прав" }, { status: 403 });
  }

  const notifyOwner = auth.isModerator && !isOwner;

  await prisma.product.delete({ where: { id } });

  if (notifyOwner) {
    notifyProductRemovedByAdmin(product.userId, product.title).catch(console.error);
  }

  return NextResponse.json({ success: true });
}
