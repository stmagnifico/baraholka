import { NextRequest, NextResponse } from "next/server";
import { setWebhook, setMyCommands } from "@/lib/bot/telegram-api";

export async function POST(req: NextRequest) {
  const setupSecret = process.env.TELEGRAM_SETUP_SECRET;
  if (!setupSecret) {
    return NextResponse.json(
      { error: "TELEGRAM_SETUP_SECRET не налаштовано" },
      { status: 500 }
    );
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${setupSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const webhookUrl =
    (body as { webhookUrl?: string }).webhookUrl ??
    `${process.env.WEBAPP_URL?.replace(/\/$/, "")}/api/telegram/webhook`;

  await setMyCommands();
  await setWebhook(webhookUrl, process.env.TELEGRAM_WEBHOOK_SECRET);

  return NextResponse.json({
    ok: true,
    webhookUrl,
    message: "Команди бота та webhook налаштовано",
  });
}
