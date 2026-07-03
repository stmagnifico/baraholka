import "server-only";

import { prisma } from "@/lib/prisma";
import { CATEGORY_MAP } from "@/lib/constants";
import { formatProductPrice } from "@/lib/utils";
import { getSuperadminId } from "@/lib/roles";
import { sendMessage, getWebAppUrl } from "./telegram-api";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function getModeratorIds(): Promise<bigint[]> {
  const superadminId = getSuperadminId();
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  const ids = new Set<bigint>();
  if (superadminId) ids.add(superadminId);
  for (const admin of admins) ids.add(admin.id);
  return [...ids];
}

export async function notifyModeratorsAboutReport(
  product: { id: string; title: string; category: string },
  reporterId: bigint,
  reportCount: number
) {
  const recipients = (await getModeratorIds()).filter((id) => id !== reporterId);
  if (recipients.length === 0) return;

  const reporter = await prisma.user.findUnique({
    where: { id: reporterId },
    select: { firstName: true, username: true },
  });
  const reporterName = reporter?.firstName ?? reporter?.username ?? "користувач";
  const categoryLabel = CATEGORY_MAP[product.category] ?? product.category;

  const text = [
    "🚩 <b>Нова скарга на оголошення</b>",
    "",
    `<b>${escapeHtml(product.title)}</b>`,
    `📂 ${escapeHtml(categoryLabel)}`,
    `👤 Скарга від: ${escapeHtml(reporterName)}`,
    `📊 Всього скарг: <b>${reportCount}</b>`,
    reportCount >= 3 ? "\n⚠️ Оголошення автоматично приховано." : "",
  ]
    .filter(Boolean)
    .join("\n");

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: "👀 Переглянути",
          web_app: { url: getWebAppUrl(`/products/${product.id}`) },
        },
      ],
    ],
  };

  await Promise.allSettled(
    recipients.map((userId) =>
      sendMessage(userId.toString(), text, { reply_markup: keyboard })
    )
  );
}
