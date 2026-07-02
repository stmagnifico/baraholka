import "server-only";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : null;

export function getWebAppUrl(path = ""): string {
  const base = process.env.WEBAPP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}

export async function callTelegramApi<T = unknown>(
  method: string,
  body?: Record<string, unknown>
): Promise<T> {
  if (!API_BASE) throw new Error("TELEGRAM_BOT_TOKEN не налаштовано");

  const res = await fetch(`${API_BASE}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json()) as { ok: boolean; result?: T; description?: string };
  if (!data.ok) {
    throw new Error(data.description ?? `Telegram API error: ${method}`);
  }

  return data.result as T;
}

export async function sendMessage(
  chatId: number | string,
  text: string,
  extra?: Record<string, unknown>
) {
  return callTelegramApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...extra,
  });
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  return callTelegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
    show_alert: false,
  });
}

export async function setWebhook(url: string, secretToken?: string) {
  return callTelegramApi("setWebhook", {
    url,
    secret_token: secretToken,
    allowed_updates: ["message", "callback_query"],
  });
}

export async function setMyCommands() {
  return callTelegramApi("setMyCommands", {
    commands: [
      { command: "start", description: "Відкрити барахолку" },
      { command: "add", description: "Додати оголошення" },
      { command: "subscribe", description: "Підписатися на оновлення" },
      { command: "unsubscribe", description: "Керувати підписками" },
      { command: "help", description: "Допомога" },
    ],
  });
}

export function webAppKeyboardButton(text: string, url?: string) {
  return {
    text,
    web_app: { url: url ?? getWebAppUrl() },
  };
}
