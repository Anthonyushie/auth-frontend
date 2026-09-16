"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api, { apiRoot } from "@/lib/axios";
import { AxiosError } from "axios";
import type { ArticleListItem } from "@/types";
import {
  BackLink,
  Badge,
  CheckIcon,
  EmptyState,
  Kicker,
  PageHeader,
  btnSecondary,
} from "@/components/ui";

interface AdminUser {
  userId: string;
  email: string;
  role: string;
}

interface Metrics {
  systemStatus: string;
  activeSecurityProtocols: string[];
}

interface DashboardData {
  success?: boolean;
  message?: string;
  data?: {
    adminUser?: AdminUser;
    metrics?: Metrics;
  };
  adminUser?: AdminUser;
  metrics?: Metrics;
}

const PROTOCOL_META: Record<string, { label: string; description: string }> = {
  JWT_ACCESS_15M: {
    label: "JWT access · 15 min",
    description: "Short-lived access tokens, in-memory only",
  },
  REFRESH_ROTATION: {
    label: "Refresh rotation",
    description: "Refresh tokens rotate on every use",
  },
  REUSE_DETECTION: {
    label: "Reuse detection",
    description: "Stolen-token reuse is detected and blocked",
  },
  RBAC: {
    label: "RBAC",
    description: "Role-based access control enforced",
  },
};

export default function AdminDashboardPage() {
  const { loading: authLoading } = useAuth();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [articlesPreview, setArticlesPreview] = useState<ArticleListItem[]>([]);
  const [previewLoading, setPreviewLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const fetchDashboard = async () => {
      try {
        const { data } = await api.get("/admin-dashboard");
        setDashboard(data);
      } catch (err) {
        const axiosErr = err as AxiosError;
        if (axiosErr.response?.status === 403) {
          setForbidden(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [authLoading]);

  useEffect(() => {
    if (authLoading) return;

    const fetchPreview = async () => {
      try {
        const { data } = await apiRoot.get("/articles", {
          params: { status: "all" },
        });
        const list = Array.isArray(data.data) ? data.data : [];
        setArticlesPreview(list);
      } catch {
        setArticlesPreview([]);
      } finally {
        setPreviewLoading(false);
      }
    };

    fetchPreview();
  }, [authLoading]);

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 pb-16 pt-10">
        <div className="tynk-skeleton h-3 w-16 rounded" />
        <div className="tynk-skeleton mt-3 h-8 w-56 rounded-md" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-[#e7e5e4] dark:border-[#292524] p-5">
              <div className="tynk-skeleton h-3 w-24 rounded" />
              <div className="tynk-skeleton mt-3 h-6 w-20 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="mx-auto max-w-2xl px-6 pb-16 pt-14">
        <Kicker>403 · Restricted</Kicker>
        <h1 className="mt-2 text-[26px] font-extrabold tracking-[-0.02em] text-[#1c1917] dark:text-[#fafaf9]">
          Permission denied
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-[#78716c] dark:text-[#a8a29e]">
          This area is for admins only. If you believe this is an error,
          contact your administrator.
        </p>
        <div className="mt-6">
          <Link href="/" className={btnSecondary}>
            ← Return to articles
          </Link>
        </div>
      </div>
    );
  }

  const adminUser: AdminUser | undefined =
    dashboard?.data?.adminUser ?? dashboard?.adminUser;
  const metrics: Metrics | undefined =
    dashboard?.data?.metrics ?? dashboard?.metrics;

  const systemStatus = metrics?.systemStatus ?? "unknown";
  const protocols = metrics?.activeSecurityProtocols ?? [];
  const isHealthy = systemStatus.toLowerCase() === "healthy";

  return (
    <div className="mx-auto max-w-5xl px-6 pb-16 pt-10">
      <PageHeader
        kicker="Admin"
        title="Dashboard"
        lede="System status, security posture, and team management."
        action={
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/articles" className={btnSecondary}>
              Open publishing →
            </Link>
            <Link href="/admin/users" className={btnSecondary}>
              Manage users
            </Link>
          </div>
        }
      />

      {/* Overview */}
      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[#e7e5e4] dark:border-[#292524] bg-white dark:bg-[#1c1917] p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#a8a29e] dark:text-[#78716c]">
            System
          </p>
          <p className="mt-2.5 flex items-center gap-2 text-[15px] font-bold capitalize text-[#1c1917] dark:text-[#fafaf9]">
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${isHealthy ? "bg-[#16a34a]" : "bg-[#dc2626]"}`}
            />
            {systemStatus}
          </p>
        </div>
        <div className="rounded-lg border border-[#e7e5e4] dark:border-[#292524] bg-white dark:bg-[#1c1917] p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#a8a29e] dark:text-[#78716c]">
            Protocols
          </p>
          <p className="mt-2 text-[22px] font-extrabold tracking-tight text-[#1c1917] dark:text-[#fafaf9]">
            {protocols.length}
            <span className="ml-1.5 align-middle text-xs font-semibold text-[#78716c] dark:text-[#a8a29e]">
              active
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-[#e7e5e4] dark:border-[#292524] bg-white dark:bg-[#1c1917] p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#a8a29e] dark:text-[#78716c]">
            Signed in
          </p>
          <p className="mt-2 truncate text-[13.5px] font-bold text-[#1c1917] dark:text-[#fafaf9]">
            {adminUser?.email ?? "—"}
          </p>
          <div className="mt-1.5">
            <Badge tone="dark">{adminUser?.role ?? "admin"}</Badge>
          </div>
        </div>
      </div>

      {/* Protocols */}
      {protocols.length > 0 && (
        <section aria-label="Security protocols" className="mt-6 overflow-hidden rounded-lg border border-[#e7e5e4] dark:border-[#292524]">
          <div className="border-b border-[#e7e5e4] dark:border-[#292524] bg-[#fafaf9] dark:bg-[#1c1917] px-5 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#a8a29e] dark:text-[#78716c]">
              Active security protocols
            </p>
          </div>
          <ul className="divide-y divide-[#f0eeec] dark:divide-[#292524]">
            {protocols.map((code) => {
              const meta = PROTOCOL_META[code];
              return (
                <li key={code} className="flex items-center gap-3.5 px-5 py-3.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0fdf4] text-[#15803d] dark:bg-[#052e16] dark:text-[#4ade80]">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold text-[#1c1917] dark:text-[#fafaf9]">
                      {meta?.label ?? code}
                    </span>
                    {meta?.description && (
                      <span className="mt-0.5 block text-xs text-[#78716c] dark:text-[#a8a29e]">
                        {meta.description}
                      </span>
                    )}
                  </span>
                  <Badge tone="success">On</Badge>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Content summary */}
      <div className="mt-10 border-b border-[#e7e5e4] dark:border-[#292524] pb-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-bold tracking-[-0.01em] text-[#1c1917] dark:text-[#fafaf9]">
              Content
            </h2>
            <p className="mt-0.5 text-[13px] text-[#78716c] dark:text-[#a8a29e]">
              Publishing lives on its own page now.
            </p>
          </div>
          <Badge tone="neutral">
            {previewLoading
              ? "…"
              : `${articlesPreview.length} ${articlesPreview.length === 1 ? "article" : "articles"}`}
          </Badge>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-[#e7e5e4] dark:border-[#292524] bg-white dark:bg-[#1c1917]">
        {previewLoading ? (
          <div className="divide-y divide-[#f0eeec] dark:divide-[#292524]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-5 py-4">
                <div className="tynk-skeleton h-4 w-2/3 rounded" />
                <div className="tynk-skeleton mt-2 h-3 w-40 rounded" />
              </div>
            ))}
          </div>
        ) : articlesPreview.length === 0 ? (
          <div className="px-5 py-6">
            <p className="text-sm font-semibold text-[#1c1917] dark:text-[#fafaf9]">No articles yet</p>
            <p className="mt-1 text-[13px] text-[#78716c] dark:text-[#a8a29e]">
              Publish your first story from the publishing page.
            </p>
            <div className="mt-4">
              <Link href="/admin/articles" className={btnSecondary}>
                Open publishing →
              </Link>
            </div>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-[#f0eeec] dark:divide-[#292524]">
              {articlesPreview.slice(0, 4).map((a) => (
                <li key={a.id} className="px-5 py-3.5">
                  <p className="truncate text-[13.5px] font-semibold text-[#1c1917] dark:text-[#fafaf9]">
                    {a.title}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[11.5px] text-[#a8a29e] dark:text-[#78716c]">
                    /{a.slug} ·{" "}
                    {new Date(a.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </li>
              ))}
            </ul>
            <div className="border-t border-[#e7e5e4] dark:border-[#292524] bg-[#fafaf9] dark:bg-[#1c1917] px-5 py-3.5">
              <Link
                href="/admin/articles"
                className="text-[13px] font-semibold text-[#1c1917] dark:text-[#fafaf9] transition-colors hover:text-[#ff751f]"
              >
                Open publishing →
              </Link>
            </div>
          </>
        )}
      </div>

      <div className="mt-8">
        <BackLink href="/">View public feed</BackLink>
      </div>

      {dashboard && !adminUser && !metrics && (
        <div className="mt-6">
          <EmptyState
            title="No dashboard data"
            body="The admin endpoint returned successfully but included no overview data."
          />
        </div>
      )}
    </div>
  );
}
