"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRoot } from "@/lib/axios";
import { useSubscription } from "@/context/SubscriptionContext";
import { AxiosError } from "axios";
import { Badge, CheckIcon, Kicker, btnPrimary, btnSecondary } from "@/components/ui";

function CallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshStatus } = useSubscription();

  const [state, setState] = useState<"verifying" | "success" | "failed">(
    "verifying"
  );
  const [message, setMessage] = useState("Confirming your payment with Flutterwave…");

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
        setMessage("Your subscription is active. Taking you back to stories…");
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
    <div className="mx-auto max-w-[480px] px-6 pb-16 pt-14">
      <Kicker>Checkout</Kicker>
      <h1 className="mt-2 text-[24px] font-extrabold tracking-[-0.02em] text-[#1c1917]">
        {state === "verifying" && "Verifying payment…"}
        {state === "success" && "Payment confirmed"}
        {state === "failed" && "Verification failed"}
      </h1>

      <div className="mt-6 rounded-lg border border-[#e7e5e4] p-6">
        <div className="flex items-center gap-3">
          {state === "verifying" && (
            <span
              aria-hidden="true"
              className="h-5 w-5 animate-spin rounded-full border-2 border-[#e7e5e4] border-t-[#ff751f]"
            />
          )}
          {state === "success" && (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0fdf4] text-[#15803d]">
              <CheckIcon />
            </span>
          )}
          {state === "failed" && <Badge tone="danger">Failed</Badge>}
          {state === "success" && <Badge tone="success">Active</Badge>}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-[#57534e]">{message}</p>

        {state === "failed" && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/subscribe" className={btnPrimary + " flex-1"}>
              Try again
            </Link>
            <Link href="/" className={btnSecondary + " flex-1"}>
              Back to stories
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
