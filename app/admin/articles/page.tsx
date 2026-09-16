"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { AxiosError } from "axios";
import ArticleManager from "@/components/ArticleManager";
import { BackLink, Kicker, PageHeader, btnSecondary } from "@/components/ui";

export default function AdminArticlesPage() {
  const { loading: authLoading } = useAuth();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const check = async () => {
      try {
        await api.get("/admin-dashboard");
        setAllowed(true);
      } catch (err) {
        const axiosErr = err as AxiosError;
        if (axiosErr.response?.status === 403) {
          setForbidden(true);
        }
      } finally {
        setLoading(false);
      }
    };

    check();
  }, [authLoading]);

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 pb-16 pt-10">
        <div className="tynk-skeleton h-3 w-28 rounded" />
        <div className="tynk-skeleton mt-3 h-8 w-56 rounded-md" />
        <div className="mt-6 rounded-lg border border-[#e7e5e4] p-5">
          <div className="tynk-skeleton h-4 w-1/3 rounded" />
          <div className="tynk-skeleton mt-3 h-24 w-full rounded-md" />
        </div>
        <div className="mt-4 space-y-0 divide-y divide-[#f0eeec] rounded-lg border border-[#e7e5e4]">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-5 py-4">
              <div className="tynk-skeleton h-4 w-2/3 rounded" />
              <div className="tynk-skeleton mt-2 h-3 w-40 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (forbidden || !allowed) {
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

  return (
    <div className="mx-auto max-w-5xl px-6 pb-16 pt-10">
      <BackLink href="/admin">Dashboard</BackLink>
      <div className="mt-4">
        <PageHeader
          kicker="Admin · Content"
          title="Articles"
          lede="Publish and maintain paywalled stories."
        />
      </div>
      <div className="mt-6">
        <ArticleManager />
      </div>
    </div>
  );
}
