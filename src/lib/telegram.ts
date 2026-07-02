import "server-only";

import { validate, parse } from "@tma.js/init-data-node";

export interface TelegramUserData {
  id: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
}

export interface ValidatedSession {
  user: TelegramUserData;
  authDate: Date;
}

/**
 * Validates Telegram initData string using HMAC-SHA256 with the bot token.
 * Throws if invalid or expired (24h by default).
 *
 * Uses @tma.js/init-data-node v2 which returns snake_case from parse().
 */
export function validateInitData(initData: string): ValidatedSession {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken || botToken.startsWith("your_bot")) {
    throw new Error("TELEGRAM_BOT_TOKEN не налаштовано");
  }

  // Throws on invalid signature or expiry
  validate(initData, botToken, { expiresIn: 86400 });

  // parse() returns snake_case fields per @tma.js/init-data-node v2 API
  const parsed = parse(initData);

  if (!parsed.user) {
    throw new Error("Дані користувача відсутні в initData");
  }

  return {
    user: {
      id: parsed.user.id,
      username: parsed.user.username,
      firstName: parsed.user.first_name,
      lastName: parsed.user.last_name,
      photoUrl: parsed.user.photo_url,
    },
    authDate: parsed.auth_date,
  };
}
