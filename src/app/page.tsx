"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, ShoppingBag } from "lucide-react";
import { CategoryFilter } from "@/components/CategoryFilter";
import { SearchBar } from "@/components/SearchBar";
import { ProductGrid } from "@/components/ProductGrid";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/Button";
import { Product } from "@/types";
import { APP_NAME } from "@/lib/constants";
import { useDebounce } from "@/hooks/useDebounce";

export default function CatalogPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);

  const fetchProducts = useCallback(
    async (cat: string, q: string, pg: number, replace = false) => {
      if (replace) setLoading(true);
      try {
        const params = new URLSearchParams({
          ...(cat ? { category: cat } : {}),
          ...(q ? { search: q } : {}),
          page: String(pg),
        });
        const res = await fetch(`/api/products?${params}`);
        const data = await res.json();
        setProducts((prev) => (replace ? data.products : [...prev, ...data.products]));
        setTotal(data.total);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    setPage(1);
    fetchProducts(category, debouncedSearch, 1, true);
  }, [category, debouncedSearch, fetchProducts]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchProducts(category, search, 1, true);
  };

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchProducts(category, debouncedSearch, next, false);
  };

  const hasMore = products.length < total;

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--tg-theme-text-color,#111)]">
            {APP_NAME}
          </h1>
          <p className="text-xs text-[var(--tg-theme-hint-color,#888)] mt-0.5">
            Знайдено {total} оголошень
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)] text-[var(--tg-theme-text-color,#111)] active:scale-95 transition-transform disabled:opacity-50"
          aria-label="Оновити"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="mb-3">
        <SearchBar value={search} onChange={setSearch} />
      </div>

      <div className="mb-4">
        <CategoryFilter selected={category} onChange={setCategory} />
      </div>

      {loading && products.length === 0 ? (
        <ProductGridSkeleton />
      ) : products.length === 0 ? (
        <EmptyState
          Icon={ShoppingBag}
          title="Оголошень поки немає"
          description="Будьте першим, хто додасть товар у барахолку вашого ЖК!"
          action={
            <Button onClick={() => router.push("/products/new")}>
              Додати оголошення
            </Button>
          }
        />
      ) : (
        <>
          <ProductGrid products={products} />

          {hasMore && (
            <div className="flex justify-center mt-6 mb-4">
              <Button variant="secondary" onClick={handleLoadMore} loading={loading}>
                Завантажити ще
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden bg-[var(--tg-theme-bg-color,#fff)] animate-pulse">
          <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
