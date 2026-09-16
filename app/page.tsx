"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { apiRoot } from "@/lib/axios";
import type { ArticleListItem } from "@/types";
import { Badge, EmptyState, LockIcon, PageHeader, btnPrimary } from "@/components/ui";

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

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
      <div className="mx-auto max-w-2xl px-6 pb-16 pt-10">
        <div className="tynk-skeleton h-3 w-24 rounded" />
        <div className="tynk-skeleton mt-3 h-8 w-56 rounded-md" />
        <div className="tynk-skeleton mt-3 h-4 w-80 max-w-full rounded" />
        <div className="mt-8 border-t border-[#e7e5e4] dark:border-[#292524]">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border-b border-[#e7e5e4] py-6 dark:border-[#292524]">
              <div className="tynk-skeleton h-5 w-3/4 rounded" />
              <div className="tynk-skeleton mt-3 h-3.5 w-44 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pb-16 pt-10">
      <PageHeader
        kicker="Publication"
        title="Latest stories"
        lede={
          hasAccess
            ? "Full access — every story below is open to you."
            : "Independent writing, published regularly. Subscribe for ₦5,000/month to read everything in full."
        }
      />

      {!hasAccess && user && !loading && articles.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e7e5e4] bg-[#fafaf9] px-4 py-3 dark:border-[#292524] dark:bg-[#1c1917]">
          <p className="text-[13px] font-medium text-[#57534e] dark:text-[#d6d3d1]">
            <span className="font-bold text-[#1c1917] dark:text-[#fafaf9]">₦5,000/mo</span>
            <span className="mx-2 text-[#d6d3d1] dark:text-[#57534e]">·</span>
            One plan, every story unlocked.
          </p>
          <Link
            href="/subscribe"
            className="inline-flex h-8 items-center rounded-md bg-[#1c1917] px-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#ff751f] dark:bg-[#fafaf9] dark:text-[#1c1917] dark:hover:bg-[#ff751f] dark:hover:text-white"
          >
            Subscribe
          </Link>
        </div>
      )}

      <div className="mt-2">
        {loading ? (
          <div className="border-t border-[#e7e5e4] dark:border-[#292524]">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border-b border-[#e7e5e4] py-6 dark:border-[#292524]">
                <div className="tynk-skeleton h-5 w-3/4 rounded" />
                <div className="tynk-skeleton mt-3 h-3.5 w-44 rounded" />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No stories yet"
              body="Nothing has been published. Check back soon — new stories appear here first."
            />
          </div>
        ) : (
          <>
            <ol className="mt-2 border-t border-[#e7e5e4] dark:border-[#292524]">
              {articles.map((a) => {
                const locked = !a.hasAccess && !hasAccess;
                return (
                  <li key={a.id} className="border-b border-[#e7e5e4] dark:border-[#292524]">
                    <Link
                      href={`/articles/${a.slug}`}
                      className="group flex items-start justify-between gap-5 py-6"
                    >
                      <span className="min-w-0">
                        <span className="block text-[17px] font-bold leading-snug tracking-[-0.015em] text-[#1c1917] transition-colors duration-150 group-hover:text-[#ff751f] dark:text-[#fafaf9]">
                          {a.title}
                        </span>
                        <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[#78716c] dark:text-[#a8a29e]">
                          <span className="font-medium text-[#57534e] dark:text-[#d6d3d1]">
                            {a.authorEmail ?? "Tynk editorial"}
                          </span>
                          <span aria-hidden="true" className="text-[#d6d3d1] dark:text-[#57534e]">
                            ·
                          </span>
                          <time>{formatDate(a.createdAt)}</time>
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 pt-1">
                        {locked ? (
                          <Badge tone="neutral">
                            <LockIcon />
                            Locked
                          </Badge>
                        ) : (
                          <Badge tone="accent">Open</Badge>
                        )}
                        <span
                          aria-hidden="true"
                          className="hidden text-[15px] text-[#d6d3d1] transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-[#ff751f] sm:inline dark:text-[#57534e]"
                        >
                          →
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 text-xs font-medium text-[#a8a29e] dark:text-[#78716c]">
              {articles.length} {articles.length === 1 ? "story" : "stories"}
            </p>
          </>
        )}
      </div>

      {!hasAccess && user && !loading && articles.length === 0 && (
        <div className="mt-6">
          <Link href="/subscribe" className={btnPrimary}>
            Subscribe — ₦5,000/mo
          </Link>
        </div>
      )}
    </div>
  );
}
