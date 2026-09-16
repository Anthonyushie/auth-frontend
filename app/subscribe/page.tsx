"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { apiRoot } from "@/lib/axios";
import { AxiosError } from "axios";
import {
  BackLink,
  Badge,
  CheckIcon,
  FieldError,
  Kicker,
  btnPrimary,
} from "@/components/ui";

const BENEFITS = [
  "Unlimited full-story reads",
  "Every article unlocked — no per-story fees",
  "Secure checkout via Flutterwave",
];

export default function SubscribePage() {
  const { user } = useAuth();
  const { hasAccess, status, currentPeriodEnd } = useSubscription();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiRoot.post("/payments/checkout");
      if (data.alreadySubscribed) {
        router.push("/");
        return;
      }
      const link = data.data?.paymentLink;
      if (!link) throw new Error("No payment link returned");
      window.location.href = link;
    } catch (err) {
      const axiosErr = err as AxiosError<any>;
      setError(
        axiosErr.response?.data?.message ??
          "Could not start checkout. Please try again."
      );
      setLoading(false);
    }
  };

  if (hasAccess) {
    return (
      <div className="mx-auto max-w-2xl px-6 pb-16 pt-10">
        <BackLink href="/">All stories</BackLink>
        <div className="mt-6 rounded-lg border border-[#e7e5e4] p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0fdf4] text-[#15803d]">
              <CheckIcon />
            </span>
            <Badge tone="success">Active</Badge>
          </div>
          <h1 className="mt-4 text-[22px] font-extrabold tracking-[-0.02em] text-[#1c1917]">
            You&apos;re subscribed
          </h1>
          <p className="mt-1.5 text-sm text-[#57534e]">
            {status}
            {currentPeriodEnd
              ? ` · renews by ${new Date(currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              : ""}
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-md bg-[#1c1917] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#ff751f]"
            >
              Continue reading
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pb-16 pt-10">
      <BackLink href="/">All stories</BackLink>

      <div className="mt-6">
        <Kicker>Membership</Kicker>
        <h1 className="mt-2 text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] text-[#1c1917] sm:text-[32px]">
          One plan. Every story.
        </h1>
        <p className="mt-2 max-w-lg text-[14.5px] leading-relaxed text-[#78716c]">
          Support independent writing and get unlimited access. Cancel anytime.
        </p>
      </div>

      <div className="mt-7 rounded-lg border border-[#e7e5e4]">
        <div className="border-b border-[#e7e5e4] px-6 py-6">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[34px] font-extrabold tracking-[-0.02em] text-[#1c1917]">
              ₦5,000
            </span>
            <span className="text-sm font-medium text-[#78716c]">/month</span>
          </div>
          <ul className="mt-5 space-y-2.5 text-[14px] text-[#44403c]">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2.5">
                <span className="mt-0.5 text-[#ff751f]">
                  <CheckIcon />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="px-6 py-6">
          {error && (
            <div className="mb-4">
              <FieldError>{error}</FieldError>
            </div>
          )}
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className={btnPrimary + " w-full sm:w-auto sm:px-8"}
          >
            {loading ? "Redirecting to Flutterwave…" : "Subscribe with Flutterwave"}
          </button>
          <p className="mt-3 text-xs leading-relaxed text-[#a8a29e]">
            Secure checkout · Cancel anytime. Powered by Flutterwave (test mode).
          </p>
          <details className="mt-4 rounded-md bg-[#fafaf9] px-4 py-3 text-xs leading-relaxed text-[#78716c]">
            <summary className="cursor-pointer font-semibold text-[#57534e]">
              Test cards
            </summary>
            <p className="mt-2 font-mono">
              success 4187427415564246 · 3DS 5399838383838381 (PIN 3310, OTP
              12345) · fail 5258596203024182
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
