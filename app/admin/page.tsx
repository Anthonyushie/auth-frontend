"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { AxiosError } from "axios";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  // Allow flat fallback shapes
  adminUser?: AdminUser;
  metrics?: Metrics;
}

// ---------------------------------------------------------------------------
// Helper: human-readable labels for security protocol codes
// ---------------------------------------------------------------------------

const PROTOCOL_META: Record<string, { label: string; description: string }> = {
  JWT_ACCESS_15M: {
    label: "JWT Access (15 min)",
    description: "Short-lived access tokens expire every 15 minutes",
  },
  REFRESH_ROTATION: {
    label: "Refresh Rotation",
    description: "Refresh tokens are rotated on every use",
  },
  REUSE_DETECTION: {
    label: "Reuse Detection",
    description: "Detects and blocks stolen refresh token reuse",
  },
  RBAC: {
    label: "RBAC",
    description: "Role-Based Access Control enforcement",
  },
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

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

        // Explicitly handle 403 — user is authenticated but lacks the
        // admin role. Show a permission-denied component instead of crashing.
        if (axiosErr.response?.status === 403) {
          setForbidden(true);
        }
        // 401 is handled by the response interceptor (redirect to /login).
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [authLoading]);

  // -----------------------------------------------------------------------
  // Loading Skeleton
  // -----------------------------------------------------------------------

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse space-y-6 py-12">
        <div className="h-8 w-56 rounded bg-gray-200" />
        <div className="h-24 rounded-2xl bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl border border-gray-200 bg-white p-6"
            >
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="mt-4 h-6 w-14 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // 403 — Permission Denied
  // -----------------------------------------------------------------------

  if (forbidden) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-10 text-center shadow-sm">
          {/* Shield icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>

          <h2 className="mt-5 text-xl font-bold text-red-800">
            Permission Denied
          </h2>
          <p className="mt-2 text-sm text-red-600">
            Admins Only — You do not have the required permissions to access
            this dashboard. Please contact your administrator if you believe
            this is an error.
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Resolve nested data (handle both `data.data.x` and flat `data.x`)
  // -----------------------------------------------------------------------

  const adminUser: AdminUser | undefined =
    dashboard?.data?.adminUser ?? dashboard?.adminUser;
  const metrics: Metrics | undefined =
    dashboard?.data?.metrics ?? dashboard?.metrics;
  const message = dashboard?.message ?? "Welcome to the Admin Dashboard!";

  const systemStatus = metrics?.systemStatus ?? "unknown";
  const protocols = metrics?.activeSecurityProtocols ?? [];

  const isHealthy = systemStatus.toLowerCase() === "healthy";

  // -----------------------------------------------------------------------
  // Dashboard Content
  // -----------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-3xl py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            System overview and security status.
          </p>
        </div>
        <Link
          href="/admin/users"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          Manage Users
        </Link>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Welcome Banner                                                     */}
      {/* ----------------------------------------------------------------- */}
      <div className="mt-6 flex items-center gap-4 rounded-2xl border border-indigo-100 bg-indigo-50 px-6 py-5">
        {/* Avatar */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
          {adminUser?.email?.charAt(0).toUpperCase() ?? "A"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-indigo-900">{message}</p>
          {adminUser && (
            <p className="mt-0.5 truncate text-sm text-indigo-600">
              Signed in as{" "}
              <span className="font-medium">{adminUser.email}</span>
            </p>
          )}
        </div>
        {adminUser && (
          <span className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            {adminUser.role}
          </span>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Stats Cards                                                        */}
      {/* ----------------------------------------------------------------- */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {/* System Status */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
            System Status
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`inline-block h-3 w-3 rounded-full ${
                isHealthy ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span
              className={`text-lg font-bold capitalize ${
                isHealthy ? "text-green-700" : "text-red-700"
              }`}
            >
              {systemStatus}
            </span>
          </div>
        </div>

        {/* Active Protocols */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
            Security Protocols
          </p>
          <p className="mt-3 text-3xl font-bold text-gray-900">
            {protocols.length}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">active</p>
        </div>

        {/* Admin User ID */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
            Admin ID
          </p>
          <p
            className="mt-3 truncate text-sm font-mono font-medium text-gray-700"
            title={adminUser?.userId}
          >
            {adminUser?.userId
              ? `${adminUser.userId.slice(0, 8)}…`
              : "—"}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {adminUser?.email ?? "—"}
          </p>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Security Protocols Detail                                          */}
      {/* ----------------------------------------------------------------- */}
      {protocols.length > 0 && (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Active Security Protocols
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {protocols.map((code) => {
              const meta = PROTOCOL_META[code];
              return (
                <div
                  key={code}
                  className="flex items-center gap-4 px-6 py-4"
                >
                  {/* Check circle icon */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
                    <svg
                      className="h-4 w-4 text-green-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {meta?.label ?? code}
                    </p>
                    {meta?.description && (
                      <p className="mt-0.5 text-xs text-gray-500">
                        {meta.description}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    Active
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
