"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { apiRoot } from "@/lib/axios";
import { AxiosError } from "axios";

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
      <div className="mx-auto max-w-xl py-16 text-center">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-10">
          <h1 className="text-xl font-bold text-green-900">
            You&apos;re subscribed ✓
          </h1>
          <p className="mt-2 text-sm text-green-700">
            Status: {status}
            {currentPeriodEnd
              ? ` · renews by ${new Date(currentPeriodEnd).toLocaleDateString()}`
              : ""}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl py-16">
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
          Monthly Access
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-gray-900">₦5,000/mo</h1>
        <p className="mt-3 text-sm text-gray-500">
          One plan. Every story unlocked. Cancel anytime. Powered by
          Flutterwave (test mode).
        </p>
        <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm text-gray-700">
          <li>✓ Unlimited full-story reads</li>
          <li>✓ Titles + body, no per-article fees</li>
          <li>✓ Secure checkout via Flutterwave</li>
        </ul>
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Redirecting to Flutterwave…" : "Subscribe with Flutterwave"}
        </button>
        <p className="mt-3 text-xs text-gray-400">
          Test cards: success 4187427415564246 · 3DS 5399838383838381 (PIN 3310,
          OTP 12345) · fail 5258596203024182
        </p>
      </div>
    </div>
  );
}
