export function serializeProduct(p: {
  id: string;
  title: string;
  description: string;
  price: { toString: () => string };
  isFree: boolean;
  currency: string;
  category: string;
  images: string[];
  status: string;
  userId: bigint;
  adminEditedAt?: Date | null;
  adminEditedById?: bigint | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: bigint;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    photoUrl: string | null;
  } | null;
  adminEditedBy?: {
    id: bigint;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    photoUrl: string | null;
  } | null;
}) {
  return {
    ...p,
    price: p.price.toString(),
    userId: p.userId.toString(),
    adminEditedAt: p.adminEditedAt?.toISOString() ?? null,
    adminEditedById: p.adminEditedById?.toString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    user: p.user ? { ...p.user, id: p.user.id.toString() } : undefined,
    adminEditedBy: p.adminEditedBy
      ? { ...p.adminEditedBy, id: p.adminEditedBy.id.toString() }
      : undefined,
  };
}
