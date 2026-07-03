import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, authErrorResponse } from "@/lib/auth";
import { REPORT_AUTO_HIDE_THRESHOLD } from "@/lib/constants";
import { notifyModeratorsAboutReport } from "@/lib/bot/report-notifications";

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

  if (product.userId === auth.userId) {
    return NextResponse.json({ error: "Не можна поскаржитись на власне оголошення" }, { status: 400 });
  }

  if (product.status !== "ACTIVE") {
    return NextResponse.json({ error: "На це оголошення не можна поскаржитись" }, { status: 400 });
  }

  const existing = await prisma.productReport.findUnique({
    where: { productId_userId: { productId: id, userId: auth.userId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Ви вже поскаржились на це оголошення" }, { status: 400 });
  }

  await prisma.productReport.create({
    data: { productId: id, userId: auth.userId },
  });

  const reportCount = await prisma.productReport.count({ where: { productId: id } });

  if (reportCount >= REPORT_AUTO_HIDE_THRESHOLD) {
    await prisma.product.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
  }

  notifyModeratorsAboutReport(product, auth.userId, reportCount).catch(console.error);

  return NextResponse.json({
    success: true,
    hidden: true,
    autoHidden: reportCount >= REPORT_AUTO_HIDE_THRESHOLD,
  });
}
