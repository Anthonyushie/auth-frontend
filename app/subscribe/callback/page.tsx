"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRoot } from "@/lib/axios";
import { useSubscription } from "@/context/SubscriptionContext";
import { AxiosError } from "axios";

function CallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshStatus } = useSubscription();

  const [state, setState] = useState<"verifying" | "success" | "failed">(
    "verifying"
  );
  const [message, setMessage] = useState("Verifying your payment…");

  useEffect(() => {
    const transactionId = searchParams.get("transaction_id");
    const txRef = searchParams.get("tx_ref");
    const fwStatus = searchParams.get("status");

    if (!transactionId || !txRef) {
      setState("failed");
      setMessage("Missing payment details in callback URL.");
      return;
    }

    if (fwStatus && fwStatus.toLowerCase() === "cancelled") {
      setState("failed");
      setMessage("Payment was cancelled before completion.");
      return;
    }

    const verify = async () => {
      try {
        await apiRoot.get("/payments/verify", {
          params: { transaction_id: transactionId, tx_ref: txRef },
        });
        await refreshStatus();
        setState("success");
        setMessage("Subscription activated! Redirecting…");
        setTimeout(() => router.push("/"), 1500);
      } catch (err) {
        const axiosErr = err as AxiosError<any>;
        setState("failed");
        setMessage(
          axiosErr.response?.data?.message ??
            "Verification failed. If you were charged, contact support."
        );
      }
    };

    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <div
        className={`rounded-2xl border p-10 shadow-sm ${
          state === "success"
            ? "border-green-200 bg-green-50"
            : state === "failed"
            ? "border-red-200 bg-red-50"
            : "border-gray-200 bg-white"
        }`}
      >
        <h1 className="text-lg font-bold text-gray-900">
          {state === "verifying" && "Verifying payment…"}
          {state === "success" && "Subscribed ✓"}
          {state === "failed" && "Verification failed"}
        </h1>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        {state === "failed" && (
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/subscribe"
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Try again
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600"
            >
              Feed
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SubscribeCallbackPage() {
  return (
    <Suspense>
      <CallbackInner />
    </Suspense>
  );
}
