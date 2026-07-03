export type ProductStatus = "DRAFT" | "ACTIVE" | "SOLD" | "ARCHIVED";

export type UserRole = "USER" | "ADMIN" | "SUPERADMIN";

export interface TelegramUser {
  id: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
}

export interface User {
  id: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
  role?: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  isFree: boolean;
  currency: string;
  category: string;
  images: string[];
  status: ProductStatus;
  userId: string;
  adminEditedAt?: string | null;
  adminEditedById?: string | null;
  adminEditedBy?: Pick<User, "id" | "username" | "firstName" | "lastName" | "photoUrl"> | null;
  user?: Pick<User, "id" | "username" | "firstName" | "lastName" | "photoUrl">;
  bumpedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  error: string;
  reason?: "deleted" | "hidden" | "reported" | "unavailable";
}
