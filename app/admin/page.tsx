"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { AxiosError } from "axios";

interface DashboardData {
  message?: string;
  [key: string]: unknown;
}

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
      <div className="mx-auto max-w-2xl animate-pulse space-y-6 py-12">
        <div className="h-8 w-56 rounded bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
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
  // Dashboard Content
  // -----------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-2xl py-12">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">
        Welcome to the admin panel. Here is your dashboard data.
      </p>

      {/* Render whatever the backend returned */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {dashboard?.message && (
          <p className="text-lg font-medium text-gray-800">
            {dashboard.message}
          </p>
        )}

        {/* Raw data dump for any extra fields */}
        <pre className="mt-4 overflow-x-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-600">
          {JSON.stringify(dashboard, null, 2)}
        </pre>
      </div>
    </div>
  );
}
