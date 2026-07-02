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

1. Створіть бота через [@BotFather](https://t.me/BotFather)
2. Скопіюйте токен у `TELEGRAM_BOT_TOKEN`
3. Команда `/newapp` → вкажіть URL задеплоєного додатку
4. Відкрийте Mini App через бота — `initData` буде валідним

## Безпека

- `initData` валідується на сервері через HMAC-SHA256 з Bot Token
- Операції редагування/видалення перевіряють `userId` з `initData`
- BigInt Telegram ID зберігається нативно в PostgreSQL (`bigint`)
