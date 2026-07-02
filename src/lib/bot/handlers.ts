import "server-only";

import { prisma } from "@/lib/prisma";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/constants";
import {
  sendMessage,
  answerCallbackQuery,
  getWebAppUrl,
  webAppKeyboardButton,
} from "./telegram-api";

interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}

interface TelegramMessage {
  message_id: number;
  chat: { id: number };
  text?: string;
  from?: TelegramUser;
}

interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  data?: string;
  message?: TelegramMessage;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

async function upsertBotUser(from: TelegramUser) {
  return prisma.user.upsert({
    where: { id: BigInt(from.id) },
    create: {
      id: BigInt(from.id),
      username: from.username ?? null,
      firstName: from.first_name ?? null,
      lastName: from.last_name ?? null,
    },
    update: {
      username: from.username ?? null,
      firstName: from.first_name ?? null,
      lastName: from.last_name ?? null,
    },
  });
}

function mainKeyboard() {
  return {
    inline_keyboard: [
      [webAppKeyboardButton("🛍 Відкрити барахолку")],
      [webAppKeyboardButton("➕ Додати оголошення", getWebAppUrl("/products/new"))],
    ],
  };
}

async function handleStart(chatId: number, from: TelegramUser) {
  await upsertBotUser(from);
  await sendMessage(
    chatId,
    [
      "👋 <b>Вітаємо в барахолці Парк Совіньйон!</b>",
      "",
      "Тут мешканці ЖК продають, віддають і обмінюють речі поруч із вами.",
      "",
      "Натисніть кнопку нижче, щоб відкрити міні-додаток, або скористайтеся командами:",
      "/add — додати оголошення",
      "/subscribe — підписка на категорію або сусіда",
      "/unsubscribe — керувати підписками",
      "/help — допомога",
    ].join("\n"),
    { reply_markup: mainKeyboard() }
  );
}

async function handleHelp(chatId: number) {
  await sendMessage(
    chatId,
    [
      "ℹ️ <b>Допомога</b>",
      "",
      "<b>Команди бота:</b>",
      "/start — головне меню з кнопкою міні-додатку",
      "/add — швидко додати оголошення",
      "/subscribe — підписатися на нові оголошення",
      "/unsubscribe — переглянути та скасувати підписки",
      "",
      "<b>Підписки:</b>",
      "• /subscribe electronics — на категорію",
      "• /subscribe @username — на оголошення конкретного сусіда",
    ].join("\n"),
    { reply_markup: mainKeyboard() }
  );
}

async function handleAdd(chatId: number) {
  await sendMessage(chatId, "➕ Натисніть кнопку, щоб додати оголошення:", {
    reply_markup: {
      inline_keyboard: [[webAppKeyboardButton("➕ Додати оголошення", getWebAppUrl("/products/new"))]],
    },
  });
}

async function handleSubscribe(chatId: number, from: TelegramUser, args: string) {
  await upsertBotUser(from);

  if (!args) {
    const buttons = CATEGORIES.map((cat) => [
      {
        text: `${cat.emoji} ${cat.label}`,
        callback_data: `sub_cat:${cat.id}`,
      },
    ]);

    await sendMessage(chatId, "Оберіть категорію для підписки:", {
      reply_markup: { inline_keyboard: buttons },
    });
    return;
  }

  if (args.startsWith("@")) {
    const username = args.slice(1).toLowerCase();
    const target = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    });

    if (!target) {
      await sendMessage(chatId, `Користувача ${args} не знайдено в барахолці.`);
      return;
    }

    if (target.id === BigInt(from.id)) {
      await sendMessage(chatId, "Не можна підписатися на себе 🙂");
      return;
    }

    const existing = await prisma.subscription.findFirst({
      where: {
        userId: BigInt(from.id),
        type: "USER",
        targetUserId: target.id,
      },
    });

    if (existing) {
      await sendMessage(chatId, "Ви вже підписані на цього користувача.");
      return;
    }

    await prisma.subscription.create({
      data: {
        userId: BigInt(from.id),
        type: "USER",
        targetUserId: target.id,
      },
    });

    const name = target.firstName ?? target.username ?? "користувача";
    await sendMessage(chatId, `✅ Підписано на оголошення від <b>${name}</b>.`);
    return;
  }

  const category = args.toLowerCase();
  if (!CATEGORY_MAP[category]) {
    await sendMessage(
      chatId,
      `Невідома категорія. Доступні: ${CATEGORIES.map((c) => c.id).join(", ")}`
    );
    return;
  }

  const existing = await prisma.subscription.findFirst({
    where: {
      userId: BigInt(from.id),
      type: "CATEGORY",
      category,
    },
  });

  if (existing) {
    await sendMessage(chatId, "Ви вже підписані на цю категорію.");
    return;
  }

  await prisma.subscription.create({
    data: {
      userId: BigInt(from.id),
      type: "CATEGORY",
      category,
    },
  });

  await sendMessage(
    chatId,
    `✅ Підписано на категорію «${CATEGORY_MAP[category]}».`
  );
}

async function handleUnsubscribe(chatId: number, from: TelegramUser) {
  const subs = await prisma.subscription.findMany({
    where: { userId: BigInt(from.id) },
    orderBy: { createdAt: "desc" },
  });

  if (subs.length === 0) {
    await sendMessage(chatId, "У вас немає активних підписок.");
    return;
  }

  const buttons = await Promise.all(
    subs.map(async (sub) => {
      let label = "Підписка";
      if (sub.type === "CATEGORY" && sub.category) {
        label = `📂 ${CATEGORY_MAP[sub.category] ?? sub.category}`;
      }
      if (sub.type === "USER" && sub.targetUserId) {
        const target = await prisma.user.findUnique({ where: { id: sub.targetUserId } });
        const name = target?.firstName ?? target?.username ?? sub.targetUserId.toString();
        label = `👤 ${name}`;
      }
      return [{ text: `❌ ${label}`, callback_data: `unsub:${sub.id}` }];
    })
  );

  await sendMessage(chatId, "Натисніть, щоб скасувати підписку:", {
    reply_markup: { inline_keyboard: buttons },
  });
}

async function handleCallback(callback: TelegramCallbackQuery) {
  const data = callback.data ?? "";
  const chatId = callback.message?.chat.id ?? callback.from.id;

  if (data.startsWith("sub_cat:")) {
    const category = data.replace("sub_cat:", "");
    await handleSubscribe(chatId, callback.from, category);
    await answerCallbackQuery(callback.id, "Підписано");
    return;
  }

  if (data.startsWith("unsub:")) {
    const subId = data.replace("unsub:", "");
    const sub = await prisma.subscription.findUnique({ where: { id: subId } });

    if (!sub || sub.userId !== BigInt(callback.from.id)) {
      await answerCallbackQuery(callback.id, "Підписку не знайдено");
      return;
    }

    await prisma.subscription.delete({ where: { id: subId } });
    await answerCallbackQuery(callback.id, "Підписку скасовано");
    await sendMessage(chatId, "✅ Підписку скасовано.");
    return;
  }

  await answerCallbackQuery(callback.id);
}

async function handleMessage(message: TelegramMessage) {
  const text = message.text?.trim() ?? "";
  const chatId = message.chat.id;
  const from = message.from;

  if (!from || !text.startsWith("/")) return;

  const [command, ...rest] = text.split(/\s+/);
  const args = rest.join(" ").trim();
  const cmd = command.split("@")[0].toLowerCase();

  switch (cmd) {
    case "/start":
      await handleStart(chatId, from);
      break;
    case "/help":
      await handleHelp(chatId);
      break;
    case "/add":
      await handleAdd(chatId);
      break;
    case "/subscribe":
      await handleSubscribe(chatId, from, args);
      break;
    case "/unsubscribe":
      await handleUnsubscribe(chatId, from);
      break;
    default:
      await sendMessage(chatId, "Невідома команда. Спробуйте /help");
  }
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  if (update.callback_query) {
    await handleCallback(update.callback_query);
    return;
  }

  if (update.message) {
    await handleMessage(update.message);
  }
}
