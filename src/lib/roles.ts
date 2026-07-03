import "server-only";

import { UserRole } from "@prisma/client";

export function getSuperadminId(): bigint | null {
  const id = process.env.SUPERADMIN_TELEGRAM_ID?.trim();
  if (!id || !/^\d+$/.test(id)) return null;
  return BigInt(id);
}

export function resolveUserRole(userId: bigint, dbRole: UserRole): UserRole {
  const superadminId = getSuperadminId();
  if (superadminId && userId === superadminId) return "SUPERADMIN";
  if (dbRole === "SUPERADMIN") return "ADMIN";
  return dbRole;
}

export function isModerator(role: UserRole): boolean {
  return role === "ADMIN" || role === "SUPERADMIN";
}

export function canManageAdmins(role: UserRole): boolean {
  return role === "SUPERADMIN";
}
