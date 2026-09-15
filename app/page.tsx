"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { apiRoot } from "@/lib/axios";
import type { ArticleListItem } from "@/types";

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess } = useSubscription();
  const router = useRouter();

  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const fetchArticles = useCallback(async () => {
    try {
      const { data } = await apiRoot.get("/articles");
      const list = Array.isArray(data.data) ? data.data : [];
      setArticles(list);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      fetchArticles();
    }
  }, [authLoading, user, fetchArticles]);

  if (authLoading || (!user && loading)) {
    return (
      <div className="mx-auto max-w-2xl animate-pulse space-y-4 py-12">
        <div className="h-8 w-40 rounded bg-gray-200" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Latest stories</h1>
          <p className="mt-1 text-sm text-gray-500">
            {hasAccess
              ? "You have full access — happy reading."
              : "Subscribe for ₦5,000/month to unlock full stories."}
          </p>
        </div>
        {!hasAccess && user && (
          <Link
            href="/subscribe"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Subscribe
          </Link>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))
        ) : articles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center">
            <p className="text-sm text-gray-400">
              No stories yet. Check back soon.
            </p>
          </div>
        ) : (
          articles.map((a) => {
            const locked = !a.hasAccess && !hasAccess;
            return (
              <Link
                key={a.id}
                href={`/articles/${a.slug}`}
                className="group block rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-gray-900 group-hover:text-indigo-600">
                      {a.title}
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                      {a.authorEmail ?? "Staff"} ·{" "}
                      {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      locked
                        ? "bg-amber-50 text-amber-700"
                        : "bg-green-50 text-green-700"
                    }`}
                  >
                    {locked ? "🔒 Locked" : "Open"}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
