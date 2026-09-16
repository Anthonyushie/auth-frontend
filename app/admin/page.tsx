"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { AxiosError } from "axios";
import ArticleManager from "@/components/ArticleManager";
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

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 pb-16 pt-10">
        <div className="tynk-skeleton h-3 w-16 rounded" />
        <div className="tynk-skeleton mt-3 h-8 w-56 rounded-md" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-[#e7e5e4] p-5">
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
        <h1 className="mt-2 text-[26px] font-extrabold tracking-[-0.02em] text-[#1c1917]">
          Permission denied
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-[#78716c]">
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
        lede="System status, security posture, and publishing controls."
        action={
          <Link href="/admin/users" className={btnSecondary}>
            Manage users
          </Link>
        }
      />

      {/* Overview */}
      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[#e7e5e4] bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#a8a29e]">
            System
          </p>
          <p className="mt-2.5 flex items-center gap-2 text-[15px] font-bold capitalize text-[#1c1917]">
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${isHealthy ? "bg-[#16a34a]" : "bg-[#dc2626]"}`}
            />
            {systemStatus}
          </p>
        </div>
        <div className="rounded-lg border border-[#e7e5e4] bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#a8a29e]">
            Protocols
          </p>
          <p className="mt-2 text-[22px] font-extrabold tracking-tight text-[#1c1917]">
            {protocols.length}
            <span className="ml-1.5 align-middle text-xs font-semibold text-[#78716c]">
              active
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-[#e7e5e4] bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#a8a29e]">
            Signed in
          </p>
          <p className="mt-2 truncate text-[13.5px] font-bold text-[#1c1917]">
            {adminUser?.email ?? "—"}
          </p>
          <div className="mt-1.5">
            <Badge tone="dark">{adminUser?.role ?? "admin"}</Badge>
          </div>
        </div>
      </div>

      {/* Protocols */}
      {protocols.length > 0 && (
        <section aria-label="Security protocols" className="mt-6 overflow-hidden rounded-lg border border-[#e7e5e4]">
          <div className="border-b border-[#e7e5e4] bg-[#fafaf9] px-5 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#a8a29e]">
              Active security protocols
            </p>
          </div>
          <ul className="divide-y divide-[#f0eeec]">
            {protocols.map((code) => {
              const meta = PROTOCOL_META[code];
              return (
                <li key={code} className="flex items-center gap-3.5 px-5 py-3.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0fdf4] text-[#15803d]">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold text-[#1c1917]">
                      {meta?.label ?? code}
                    </span>
                    {meta?.description && (
                      <span className="mt-0.5 block text-xs text-[#78716c]">
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

      {/* Content */}
      <div className="mt-10 border-b border-[#e7e5e4] pb-3">
        <h2 className="text-[15px] font-bold tracking-[-0.01em] text-[#1c1917]">
          Content
        </h2>
        <p className="mt-0.5 text-[13px] text-[#78716c]">
          Publish and maintain paywalled stories.
        </p>
      </div>
      <div className="mt-5">
        <ArticleManager />
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
