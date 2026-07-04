import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateInitData } from "@/lib/telegram";
import { PAGE_SIZE, USERNAME_REQUIRED_ERROR } from "@/lib/constants";
import { notifySubscribersAboutProduct } from "@/lib/bot/notifications";
import type { ProductStatus } from "@/types";
import { serializeProduct } from "@/lib/serialize-product";
import { optionalAuth, getViewerReportedProductIds } from "@/lib/product-access";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category") ?? "";
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const initData = req.headers.get("x-init-data") ?? "";
  const viewer = await optionalAuth(initData);

  let reportedIds: string[] = [];
  if (viewer) {
    reportedIds = await getViewerReportedProductIds(viewer.userId);
  }

  const where = {
    status: "ACTIVE" as const,
    ...(reportedIds.length > 0 ? { id: { notIn: reportedIds } } : {}),
    ...(category ? { category } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { user: true },
      orderBy: [{ bumpedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return NextResponse.json({
    products: products.map(serializeProduct),
    total,
    page,
    pageSize: PAGE_SIZE,
  });
}

export async function POST(req: NextRequest) {
  const initData = req.headers.get("x-init-data") ?? "";
  if (!initData) {
    return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  }

  let userId: number;
  let username: string | undefined;
  try {
    const session = validateInitData(initData);
    userId = session.user.id;
    username = session.user.username;
  } catch {
    return NextResponse.json({ error: "Невалідний initData" }, { status: 401 });
  }

  if (!username) {
    return NextResponse.json({ error: USERNAME_REQUIRED_ERROR }, { status: 400 });
  }

  const body = await req.json();
  const { title, description, price, isFree, category, images, status } = body as {
    title?: string;
    description?: string;
    price?: number;
    isFree?: boolean;
    category?: string;
    images?: string[];
    status?: ProductStatus;
  };

  if (!title || !description || !category) {
    return NextResponse.json({ error: "Заповніть усі обов'язкові поля" }, { status: 400 });
  }

  const free = Boolean(isFree);
  if (!free && (price == null || price <= 0)) {
    return NextResponse.json({ error: "Вкажіть коректну ціну або оберіть «безкоштовно»" }, { status: 400 });
  }

  const productStatus: ProductStatus =
    status === "DRAFT" ? "DRAFT" : "ACTIVE";

  const now = new Date();
  const product = await prisma.product.create({
    data: {
      title: title.trim(),
      description: description.trim(),
      price: free ? 0 : price!,
      isFree: free,
      category,
      images: images ?? [],
      status: productStatus,
      userId: BigInt(userId),
      bumpedAt: now,
    },
    include: { user: true },
  });

  if (productStatus === "ACTIVE") {
    notifySubscribersAboutProduct(product).catch(console.error);
  }

  return NextResponse.json(serializeProduct(product), { status: 201 });
}
