import "server-only";

import { sendMessage } from "./telegram-api";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function notifyProductRemovedByAdmin(userId: bigint, productTitle: string) {
  const text = [
    "⚠️ <b>Оголошення видалено</b>",
    "",
    `Ваше оголошення «<b>${escapeHtml(productTitle)}</b>» було видалено адміністратором, оскільки воно порушує правила користування Telegram.`,
  ].join("\n");

  await sendMessage(userId.toString(), text);
}
