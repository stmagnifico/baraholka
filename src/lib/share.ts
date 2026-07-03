import { formatProductPrice } from "@/lib/utils";

export const BOT_USERNAME = "baraholka_sauvignon_bot";

export function getProductWebUrl(productId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/products/${productId}`;
  }
  const base = process.env.NEXT_PUBLIC_WEBAPP_URL ?? "https://baraholka-sigma.vercel.app";
  return `${base.replace(/\/$/, "")}/products/${productId}`;
}

/** Відкриває міні-додаток на сторінці товару (start_param → p_{id}) */
export function getProductMiniAppUrl(productId: string): string {
  return `https://t.me/${BOT_USERNAME}?startapp=p_${productId}`;
}

export function getProductShareText(product: {
  title: string;
  isFree: boolean;
  price: string;
}): string {
  const price = formatProductPrice({
    price: product.price,
    currency: "UAH",
    isFree: product.isFree,
  });
  return `🛍 ${product.title} — ${price}`;
}

export function getTelegramShareUrl(url: string, text: string): string {
  const params = new URLSearchParams({ url, text });
  return `https://t.me/share/url?${params.toString()}`;
}

export function shareProductInTelegram(
  webApp: { openTelegramLink?: (url: string) => void } | null,
  product: { id: string; title: string; isFree: boolean; price: string }
) {
  const url = getProductMiniAppUrl(product.id);
  const text = getProductShareText(product);
  const shareUrl = getTelegramShareUrl(url, text);

  if (webApp?.openTelegramLink) {
    webApp.openTelegramLink(shareUrl);
    return;
  }

  window.open(shareUrl, "_blank", "noopener,noreferrer");
}

export function parseProductStartParam(startParam?: string): string | null {
  if (!startParam) return null;
  if (startParam.startsWith("p_")) return startParam.slice(2);
  return null;
}
