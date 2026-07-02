/**
 * Налаштування команд бота та webhook.
 *
 * Використання:
 *   WEBAPP_URL=https://your-app.vercel.app \
 *   TELEGRAM_SETUP_SECRET=your_secret \
 *   node scripts/setup-bot.mjs
 */

const baseUrl = process.env.WEBAPP_URL;
const secret = process.env.TELEGRAM_SETUP_SECRET;

if (!baseUrl || !secret) {
  console.error("Потрібні змінні WEBAPP_URL та TELEGRAM_SETUP_SECRET");
  process.exit(1);
}

const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/telegram/setup`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    webhookUrl: `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook`,
  }),
});

const data = await res.json();
console.log(res.status, data);
