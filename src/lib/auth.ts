import "server-only";

import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validateInitData } from "@/lib/telegram";
import { resolveUserRole, isModerator, canManageAdmins } from "@/lib/roles";

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export interface AuthContext {
  userId: bigint;
  role: UserRole;
  isModerator: boolean;
  canManageAdmins: boolean;
}

export async function requireAuth(initData: string): Promise<AuthContext> {
  if (!initData) {
    throw new AuthError("Не авторизовано", 401);
  }

  let userId: number;
  try {
    const session = validateInitData(initData);
    userId = session.user.id;
  } catch {
    throw new AuthError("Невалідний initData", 401);
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: BigInt(userId) },
    select: { role: true },
  });

  const role = resolveUserRole(BigInt(userId), dbUser?.role ?? "USER");

  return {
    userId: BigInt(userId),
    role,
    isModerator: isModerator(role),
    canManageAdmins: canManageAdmins(role),
  };
}

export function authErrorResponse(err: unknown) {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  return NextResponse.json({ error: "Помилка сервера" }, { status: 500 });
}
