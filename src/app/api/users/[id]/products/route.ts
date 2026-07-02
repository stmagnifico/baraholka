import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateInitData } from "@/lib/telegram";

export async function GET(
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

  if (id !== userId.toString()) {
    return NextResponse.json({ error: "Немає прав" }, { status: 403 });
  }

  const products = await prisma.product.findMany({
    where: { userId: BigInt(userId) },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    products.map((p) => ({
      ...p,
      price: p.price.toString(),
      userId: p.userId.toString(),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }))
  );
}
