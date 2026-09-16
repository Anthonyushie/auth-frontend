"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import api from "@/lib/axios";
import {
  Badge,
  EmptyState,
  Kicker,
  btnPrimary,
  btnSecondary,
} from "@/components/ui";

interface ProfileData {
  id?: string;
  userId?: string;
  email?: string;
  role?: string;
  createdAt?: string;
  [key: string]: unknown;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3.5">
      <dt className="shrink-0 text-[13px] text-[#78716c] dark:text-[#a8a29e]">{label}</dt>
      <dd className="min-w-0 truncate text-right text-[13.5px] font-semibold text-[#1c1917] dark:text-[#fafaf9]">
        {value}
      </dd>
    </div>
  );
}

export default function ProfilePage() {
  const { user: authUser, loading: authLoading, logout } = useAuth();
  const { hasAccess, status, currentPeriodEnd, loading: subLoading } =
    useSubscription();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push("/login");
    }
  }, [authLoading, authUser, router]);

  useEffect(() => {
    if (authLoading) return;

    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/profile");
        const resolved = data.data?.user || data.user || data.data || data;
        setProfile(resolved);
      } catch {
        if (authUser) {
          setProfile(authUser as unknown as ProfileData);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [authLoading, authUser]);

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 pb-16 pt-10">
        <div className="tynk-skeleton h-3 w-20 rounded" />
        <div className="tynk-skeleton mt-3 h-8 w-52 rounded-md" />
        <div className="mt-6 rounded-lg border border-[#e7e5e4] p-6 dark:border-[#292524] dark:bg-[#1c1917]">
          <div className="tynk-skeleton h-4 w-2/3 rounded" />
          <div className="tynk-skeleton mt-3 h-4 w-1/2 rounded" />
          <div className="tynk-skeleton mt-3 h-4 w-3/5 rounded" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-6 pb-16 pt-10">
        <EmptyState
          title="Could not load your profile"
          body="We couldn't retrieve your account details. Try signing in again."
          action={
            <Link href="/login" className={btnPrimary}>
              Sign in
            </Link>
          }
        />
      </div>
    );
  }

  const email = profile.email || "No email";
  const role = profile.role || "user";
  const userId = (profile.id || profile.userId || "—") as string;
  const joined = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="mx-auto max-w-2xl px-6 pb-16 pt-10">
      <Kicker>Account</Kicker>
      <h1 className="mt-2 text-[28px] font-extrabold tracking-[-0.02em] text-[#1c1917] dark:text-[#fafaf9]">
        Your account
      </h1>
      <p className="mt-1.5 text-sm text-[#78716c] dark:text-[#a8a29e]">
        Profile, role, and subscription in one place.
      </p>

      {/* Identity */}
      <div className="mt-7 flex items-center gap-4 border-y border-[#e7e5e4] py-5 dark:border-[#292524]">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1c1917] text-[15px] font-bold text-white dark:bg-[#fafaf9] dark:text-[#1c1917]"
        >
          {email.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold tracking-tight text-[#1c1917] dark:text-[#fafaf9]">
            {email}
          </p>
          <p className="mt-0.5 text-[13px] capitalize text-[#78716c] dark:text-[#a8a29e]">{role}</p>
        </div>
        <Badge tone={role === "admin" ? "dark" : "neutral"}>{role}</Badge>
      </div>

      {/* Details */}
      <section aria-label="Profile details" className="mt-2 divide-y divide-[#f0eeec] dark:divide-[#292524]">
        <Row label="Email" value={email} />
        <Row
          label="User ID"
          value={
            <span className="font-mono text-[12.5px] font-medium" title={userId}>
              {userId.length > 18 ? `${userId.slice(0, 12)}…` : userId}
            </span>
          }
        />
        <Row label="Role" value={<span className="capitalize">{role}</span>} />
        <Row label="Member since" value={joined} />
      </section>

      {/* Subscription */}
      <section aria-label="Subscription" className="mt-8 rounded-lg border border-[#e7e5e4] dark:border-[#292524] dark:bg-[#1c1917]">
        <div className="flex items-center justify-between border-b border-[#e7e5e4] px-5 py-3.5 dark:border-[#292524]">
          <h2 className="text-[13.5px] font-bold tracking-[-0.01em] text-[#1c1917] dark:text-[#fafaf9]">
            Subscription
          </h2>
          {subLoading ? (
            <span className="text-xs font-medium text-[#a8a29e] dark:text-[#78716c]">Checking…</span>
          ) : (
            <Badge tone={hasAccess ? "success" : "neutral"}>
              {hasAccess ? "Active" : "Inactive"}
            </Badge>
          )}
        </div>
        <div className="px-5 py-4">
          {hasAccess ? (
            <>
              <p className="text-sm leading-relaxed text-[#57534e] dark:text-[#d6d3d1]">
                <span className="font-semibold text-[#1c1917] dark:text-[#fafaf9]">
                  {status}
                </span>
                {currentPeriodEnd && (
                  <>
                    {" "}· renews by{" "}
                    {new Date(currentPeriodEnd).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </>
                )}
              </p>
              <div className="mt-4">
                <Link href="/" className={btnSecondary}>
                  Continue reading
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-[#57534e] dark:text-[#d6d3d1]">
                You don&apos;t have an active subscription.{" "}
                <span className="font-semibold text-[#1c1917] dark:text-[#fafaf9]">₦5,000/mo</span>{" "}
                unlocks every story.
              </p>
              <div className="mt-4">
                <Link href="/subscribe" className={btnPrimary}>
                  Subscribe — ₦5,000/mo
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <div className="mt-6">
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.push("/login");
          }}
          className="cursor-pointer text-[13px] font-semibold text-[#78716c] underline decoration-[#e7e5e4] underline-offset-4 transition-colors hover:text-[#ff751f] hover:decoration-[#ff751f] dark:text-[#a8a29e] dark:decoration-[#44403c]"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
