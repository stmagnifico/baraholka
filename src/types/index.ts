export type ProductStatus = "ACTIVE" | "SOLD" | "ARCHIVED";

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
  user?: Pick<User, "id" | "username" | "firstName" | "lastName" | "photoUrl">;
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
}
