export const CATEGORIES = [
  { id: "electronics", label: "Електроніка", emoji: "📱" },
  { id: "kids", label: "Дитячі речі", emoji: "🧸" },
  { id: "home", label: "Дім та затишок", emoji: "🏠" },
  { id: "clothing", label: "Одяг та взуття", emoji: "👗" },
  { id: "other", label: "Різне", emoji: "📦" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.label])
) as Record<string, string>;

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Чернетка",
  ACTIVE: "Активне",
  SOLD: "Продано",
  ARCHIVED: "Приховано",
};

export const PRODUCT_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-orange-100 text-orange-700",
  ACTIVE: "bg-green-100 text-green-700",
  SOLD: "bg-gray-100 text-gray-500",
  ARCHIVED: "bg-yellow-100 text-yellow-700",
};

export const MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
  "https://images.unsplash.com/photo-1572635196233-8f3f794b910e?w=800&q=80",
  "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
  "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80",
];

export const APP_NAME = "Барахолка Парк Совіньйон";
export const PAGE_SIZE = 20;

export const USERNAME_REQUIRED_ERROR =
  "Щоб продавати на барахолці, задайте username в Telegram: Налаштування → Редагувати профіль → Ім'я користувача.";

export const ADMIN_EDITED_NOTICE = "Оголошення відредаговано адміністратором";

export const USER_ROLE_LABELS: Record<string, string> = {
  USER: "Користувач",
  ADMIN: "Адмін",
  SUPERADMIN: "Суперадмін",
};
