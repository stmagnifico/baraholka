import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { requireAuth, authErrorResponse } from "@/lib/auth";
import { getSuperadminId, resolveUserRole } from "@/lib/roles";

function serializeUser(user: {
  id: bigint;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  role: UserRole;
}) {
  return {
    id: user.id.toString(),
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    photoUrl: user.photoUrl,
    role: resolveUserRole(user.id, user.role),
  };
}

export async function GET(req: NextRequest) {
  const initData = req.headers.get("x-init-data") ?? "";

  let auth;
  try {
    auth = await requireAuth(initData);
  } catch (err) {
    return authErrorResponse(err);
  }

  if (!auth.canManageAdmins) {
    return NextResponse.json({ error: "Немає прав" }, { status: 403 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            ...( /^\d+$/.test(q) ? [{ id: BigInt(q) }] : []),
          ],
        }
      : { role: "ADMIN" },
    orderBy: [{ role: "desc" }, { firstName: "asc" }],
    take: 20,
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      photoUrl: true,
      role: true,
    },
  });

  return NextResponse.json({
    users: users.map(serializeUser),
  });
}

export async function PATCH(req: NextRequest) {
  const initData = req.headers.get("x-init-data") ?? "";

  let auth;
  try {
    auth = await requireAuth(initData);
  } catch (err) {
    return authErrorResponse(err);
  }

  if (!auth.canManageAdmins) {
    return NextResponse.json({ error: "Немає прав" }, { status: 403 });
  }

  const body = await req.json();
  const { userId, role } = body as { userId?: string; role?: "ADMIN" | "USER" };

  if (!userId || !role || !["ADMIN", "USER"].includes(role)) {
    return NextResponse.json({ error: "Невалідні дані" }, { status: 400 });
  }

  const targetId = BigInt(userId);
  const superadminId = getSuperadminId();

  if (superadminId && targetId === superadminId) {
    return NextResponse.json({ error: "Неможливо змінити роль суперадміна" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) {
    return NextResponse.json({ error: "Користувача не знайдено" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { role },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      photoUrl: true,
      role: true,
    },
  });

  return NextResponse.json({ user: serializeUser(updated) });
}
