import "server-only";

import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validateInitData } from "@/lib/telegram";
import { resolveUserRole, isModerator } from "@/lib/roles";

export type UnavailableReason = "deleted" | "hidden" | "reported" | "unavailable";

export interface OptionalAuth {
  userId: bigint;
  role: UserRole;
  isModerator: boolean;
}

export async function optionalAuth(initData: string): Promise<OptionalAuth | null> {
  if (!initData) return null;
  try {
    const session = validateInitData(initData);
    const dbUser = await prisma.user.findUnique({
      where: { id: BigInt(session.user.id) },
      select: { role: true },
    });
    const role = resolveUserRole(BigInt(session.user.id), dbUser?.role ?? "USER");
    return {
      userId: BigInt(session.user.id),
      role,
      isModerator: isModerator(role),
    };
  } catch {
    return null;
  }
}

export async function getViewerReportedProductIds(userId: bigint): Promise<string[]> {
  const reports = await prisma.productReport.findMany({
    where: { userId },
    select: { productId: true },
  });
  return reports.map((r) => r.productId);
}

export function checkProductVisibility(
  product: { status: string; userId: bigint } | null,
  viewer: OptionalAuth | null,
  isReportedByViewer: boolean
): { visible: true } | { visible: false; reason: UnavailableReason; status: number } {
  if (!product) {
    return { visible: false, reason: "deleted", status: 410 };
  }

  const isOwner = viewer?.userId === product.userId;
  const canModerate = viewer?.isModerator ?? false;

  if (isReportedByViewer && !isOwner && !canModerate) {
    return { visible: false, reason: "reported", status: 404 };
  }

  if (product.status === "DRAFT" && !isOwner && !canModerate) {
    return { visible: false, reason: "unavailable", status: 404 };
  }

  if (product.status === "ARCHIVED" && !isOwner && !canModerate) {
    return { visible: false, reason: "hidden", status: 410 };
  }

  return { visible: true };
}
