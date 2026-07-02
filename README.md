# Барахолка ЖК — Telegram Mini App

Гіперлокальна барахолка для мешканців житлового комплексу.

## Стек

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** — адаптація до теми Telegram через CSS-змінні
- **Prisma 6** + PostgreSQL (Supabase / Vercel Postgres)
- **@tma.js/init-data-node v2** — серверна валідація `initData`
- **@tma.js/sdk v3** — клієнтський SDK Telegram WebApp

## Структура

```
src/
├── app/
│   ├── api/
│   │   ├── auth/route.ts           # POST /api/auth — upsert user
│   │   ├── products/
│   │   │   ├── route.ts            # GET (каталог) / POST (створити)
│   │   │   └── [id]/route.ts       # GET / PATCH (статус) / DELETE
│   │   └── users/[id]/products/    # GET власних оголошень
│   ├── products/
│   │   ├── [id]/page.tsx           # Деталі товару
│   │   └── new/page.tsx            # Форма додавання
│   ├── profile/page.tsx            # Профіль + управління оголошеннями
│   ├── page.tsx                    # Каталог (головна)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/Badge.tsx
│   ├── ui/Button.tsx
│   ├── BottomNav.tsx
│   ├── CategoryFilter.tsx
│   ├── EmptyState.tsx
│   ├── ProductCard.tsx
│   ├── ProductGrid.tsx
│   └── SearchBar.tsx
├── context/TelegramContext.tsx     # Provider + автоаутентифікація
├── hooks/useTelegram.ts            # Ініціалізація WebApp, тема, haptic
├── lib/
│   ├── constants.ts                # Категорії, мок-зображення
│   ├── prisma.ts                   # Singleton Prisma client
│   ├── telegram.ts                 # validateInitData (серверна)
│   └── utils.ts                    # cn(), formatPrice(), formatDate()
└── types/index.ts
```

## Запуск

### 1. Залежності

```bash
npm install
```

### 2. Змінні оточення

```bash
cp .env.example .env
# Заповніть DATABASE_URL, DIRECT_URL, TELEGRAM_BOT_TOKEN
```

### 3. База даних

```bash
npm run db:push      # Застосувати схему (розробка)
# або
npm run db:migrate   # Міграція з назвою (продакшн)
```

### 4. Запуск

```bash
npm run dev
```

## Деплой на Vercel

1. Підключіть репо до Vercel
2. Додайте PostgreSQL через Vercel Storage або підключіть Supabase
3. Встановіть змінні оточення (`DATABASE_URL`, `DIRECT_URL`, `TELEGRAM_BOT_TOKEN`)
4. Deploy

## Telegram Bot

1. Створіть бота через [@BotFather](https://t.me/BotFather) → `/newbot`
2. Скопіюйте токен у `TELEGRAM_BOT_TOKEN`
3. Додайте в `.env`:
   - `WEBAPP_URL` — публічний HTTPS URL застосунку
   - `TELEGRAM_SETUP_SECRET` — довільний секрет
   - `TELEGRAM_WEBHOOK_SECRET` — довільний секрет (рекомендовано)
4. Застосуйте оновлену схему БД: `npm run db:push`
5. Налаштуйте команди та webhook:

```bash
WEBAPP_URL=https://your-app.vercel.app \
TELEGRAM_SETUP_SECRET=your_secret \
npm run bot:setup
```

### Команди бота

| Команда | Опис |
|---|---|
| `/start` | Вітання + кнопка «Відкрити барахолку» (Mini App) |
| `/add` | Кнопка додавання оголошення |
| `/subscribe` | Підписка на категорію або `@username` |
| `/unsubscribe` | Керування підписками |
| `/help` | Довідка |

При публікації нового оголошення підписники отримують повідомлення в боті.

## Безпека

- `initData` валідується на сервері через HMAC-SHA256 з Bot Token
- Операції редагування/видалення перевіряють `userId` з `initData`
- BigInt Telegram ID зберігається нативно в PostgreSQL (`bigint`)
