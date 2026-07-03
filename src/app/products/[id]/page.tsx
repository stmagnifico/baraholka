import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatProductPrice } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { ProductDetail } from "./ProductDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      title: true,
      description: true,
      images: true,
      price: true,
      isFree: true,
      currency: true,
    },
  });

  if (!product) {
    return { title: `Оголошення не знайдено — ${APP_NAME}` };
  }

  const price = formatProductPrice({
    price: product.price.toString(),
    currency: product.currency,
    isFree: product.isFree,
  });
  const title = `${product.title} — ${price}`;
  const description =
    product.description.length > 200
      ? `${product.description.slice(0, 197)}…`
      : product.description;
  const image = product.images[0];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: APP_NAME,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  return <ProductDetail id={id} />;
}
