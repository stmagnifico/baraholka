"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Search, Shield, UserMinus, UserPlus } from "lucide-react";
import { useTelegramContext } from "@/context/TelegramContext";
import { UserRole } from "@/types";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { getDisplayName } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
  role: UserRole;
}

export default function AdminsPage() {
  const router = useRouter();
  const { initData, isSuperAdmin, isReady } = useTelegramContext();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadUsers = useCallback(
    async (q = "") => {
      setSearching(true);
      try {
        const params = q ? `?q=${encodeURIComponent(q)}` : "";
        const res = await fetch(`/api/admin/users${params}`, {
          headers: { "x-init-data": initData },
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users);
        }
      } finally {
        setSearching(false);
        setLoading(false);
      }
    },
    [initData]
  );

  useEffect(() => {
    if (!isReady) return;
    if (!isSuperAdmin) {
      router.replace("/profile");
      return;
    }
    loadUsers();
  }, [isReady, isSuperAdmin, loadUsers, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(query.trim());
  };

  const setRole = async (userId: string, role: "ADMIN" | "USER") => {
    setUpdatingId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-init-data": initData,
        },
        body: JSON.stringify({ userId, role }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Помилка");
      }
      const data = await res.json();
      setUsers((prev) => {
        const exists = prev.some((u) => u.id === data.user.id);
        if (exists) {
          return prev.map((u) => (u.id === data.user.id ? data.user : u));
        }
        return [data.user, ...prev];
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Помилка");
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isReady || !isSuperAdmin) return null;

  return (
    <div className="px-4 pt-4 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[var(--tg-theme-text-color,#111)]">
            Керування адмінами
          </h1>
          <p className="text-xs text-[var(--tg-theme-hint-color,#888)]">
            Призначайте та знімайте адміністраторів
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--tg-theme-hint-color,#888)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Username, ім'я або Telegram ID…"
            className="w-full pl-9 pr-4 py-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color,#f5f5f5)] text-sm text-[var(--tg-theme-text-color,#111)] outline-none"
          />
        </div>
        <Button type="submit" loading={searching}>
          Знайти
        </Button>
      </form>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <p className="text-sm text-[var(--tg-theme-hint-color,#888)] text-center py-8">
          {query ? "Користувачів не знайдено" : "Поки немає адмінів"}
        </p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--tg-theme-bg-color,#fff)] border border-black/5"
            >
              <div className="relative w-11 h-11 flex-shrink-0">
                {u.photoUrl ? (
                  <Image
                    src={u.photoUrl}
                    alt={getDisplayName(u)}
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[var(--tg-theme-button-color,#2481cc)] flex items-center justify-center text-white font-bold">
                    {(u.firstName?.[0] ?? u.username?.[0] ?? "?").toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--tg-theme-text-color,#111)] truncate">
                  {getDisplayName(u)}
                </p>
                <p className="text-xs text-[var(--tg-theme-hint-color,#888)]">
                  {u.username ? `@${u.username}` : `ID: ${u.id}`}
                </p>
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0",
                  u.role === "SUPERADMIN"
                    ? "bg-purple-100 text-purple-700"
                    : u.role === "ADMIN"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600"
                )}
              >
                {USER_ROLE_LABELS[u.role]}
              </span>
              {u.role === "USER" && (
                <button
                  type="button"
                  disabled={updatingId === u.id}
                  onClick={() => setRole(u.id, "ADMIN")}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-green-50 text-green-600"
                  title="Зробити адміном"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              )}
              {u.role === "ADMIN" && (
                <button
                  type="button"
                  disabled={updatingId === u.id}
                  onClick={() => setRole(u.id, "USER")}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 text-red-500"
                  title="Зняти адміна"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              )}
              {u.role === "SUPERADMIN" && (
                <div className="w-9 h-9 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-purple-600" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
