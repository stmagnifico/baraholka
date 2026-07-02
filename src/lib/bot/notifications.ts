import "server-only";

import { prisma } from "@/lib/prisma";
import { CATEGORY_MAP } from "@/lib/constants";
import { formatProductPrice } from "@/lib/utils";
import { sendMessage, getWebAppUrl } from "./telegram-api";

interface ProductForNotify {
  id: string;
  title: string;
  price: { toString: () => string };
  isFree: boolean;
  currency: string;
  category: string;
  userId: bigint;
}

export async function notifySubscribersAboutProduct(product: ProductForNotify) {
  const [categorySubs, userSubs] = await Promise.all([
    prisma.subscription.findMany({
      where: { type: "CATEGORY", category: product.category },
    }),
    prisma.subscription.findMany({
      where: { type: "USER", targetUserId: product.userId },
    }),
  ]);

  const recipientIds = new Set<bigint>();
  for (const sub of [...categorySubs, ...userSubs]) {
    if (sub.userId !== product.userId) {
      recipientIds.add(sub.userId);
    }
  }

  if (recipientIds.size === 0) return;

  const categoryLabel = CATEGORY_MAP[product.category] ?? product.category;
  const priceLabel = formatProductPrice({
    price: product.price.toString(),
    currency: product.currency,
    isFree: product.isFree,
  });

  const text = [
    "🆕 <b>Нове оголошення від сусіда</b>",
    "",
    `<b>${escapeHtml(product.title)}</b>`,
    `📂 ${escapeHtml(categoryLabel)}`,
    `💰 ${escapeHtml(priceLabel)}`,
  ].join("\n");

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
    [...recipientIds].map((userId) =>
      sendMessage(userId.toString(), text, { reply_markup: keyboard })
    )
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
