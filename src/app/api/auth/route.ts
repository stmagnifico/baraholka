import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateInitData } from "@/lib/telegram";
import { resolveUserRole } from "@/lib/roles";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData } = body as { initData?: string };

    if (!initData) {
      return NextResponse.json(
        { error: "initData відсутній" },
        { status: 400 }
      );
    }

    const { user } = validateInitData(initData);
    const userId = BigInt(user.id);

    const saved = await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        username: user.username ?? null,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        photoUrl: user.photoUrl ?? null,
      },
      update: {
        username: user.username ?? null,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        photoUrl: user.photoUrl ?? null,
      },
    });

    const role = resolveUserRole(userId, saved.role);

    return NextResponse.json({
      id: saved.id.toString(),
      username: saved.username,
      firstName: saved.firstName,
      lastName: saved.lastName,
      photoUrl: saved.photoUrl,
      role,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Помилка сервера";
    const status = message.includes("не налаштовано") ? 500 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
