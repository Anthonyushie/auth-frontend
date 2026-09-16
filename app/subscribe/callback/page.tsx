"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRoot } from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { AxiosError } from "axios";
import { Badge, CheckIcon, Kicker, btnPrimary, btnSecondary } from "@/components/ui";

type CallbackState =
  | "restoring"
  | "verifying"
  | "success"
  | "failed"
  | "session-expired";

function CallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { refreshStatus } = useSubscription();

  const [state, setState] = useState<CallbackState>("restoring");
  const [message, setMessage] = useState("Restoring your session…");
  const verifiedRef = useRef(false);

  // Preserve the full callback URL so login can send the user back here
  // to retry verification (payment may already have succeeded server-side).
  const callbackUrl =
    typeof window !== "undefined"
      ? `${window.location.pathname}?${searchParams.toString()}`
      : `/subscribe/callback?${searchParams.toString()}`;
  const loginHref = `/login?next=${encodeURIComponent(callbackUrl)}`;

  useEffect(() => {
    // 1. Still restoring session (silent refresh after Flutterwave hop
    //    wiped the in-memory token)? Wait — don't verify yet, otherwise we
    //    fire an unauthenticated /payments/verify and risk a concurrent
    //    refresh race / misleading 401.
    if (authLoading) {
      setState("restoring");
      setMessage("Restoring your session…");
      return;
    }

    // 2. Validate callback params once auth is settled.
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

    // 3. No session after silent refresh -> don't call verify (it requires
    //    Bearer). Show re-login instead of bouncing to /login silently.
    //    The payment may still have activated via webhook, so logging back
    //    in + retrying will pick it up.
    if (!user) {
      setState("session-expired");
      setMessage(
        "Your session expired while paying. If you were charged, your payment is safe — please log in again to confirm your subscription."
      );
      return;
    }

    // 4. Authenticated — verify exactly once (StrictMode safe).
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    const verify = async () => {
      setState("verifying");
      setMessage("Confirming your payment with Flutterwave…");
      try {
        await apiRoot.get("/payments/verify", {
          params: { transaction_id: transactionId, tx_ref: txRef },
          // Never hard-redirect to /login from here (see lib/axios.ts).
          // A 401 is handled below as session-expired.
          skipAuthRedirect: true,
        } as any);
        await refreshStatus();
        setState("success");
        setMessage("Your subscription is active. Taking you back to stories…");
        const t = setTimeout(() => router.push("/"), 1500);
        return () => clearTimeout(t);
      } catch (err) {
        const axiosErr = err as AxiosError<any>;
        if (axiosErr.response?.status === 401) {
          setState("session-expired");
          setMessage(
            "Your session expired while paying. If you were charged, your payment is safe — please log in again to confirm your subscription."
          );
        } else {
          setState("failed");
          setMessage(
            axiosErr.response?.data?.message ??
              "Verification failed. If you were charged, contact support."
          );
        }
      }
    };

    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, searchParams]);

  const title =
    state === "restoring"
      ? "Restoring session…"
      : state === "verifying"
        ? "Verifying payment…"
        : state === "success"
          ? "Payment confirmed"
          : state === "session-expired"
            ? "Please log in again"
            : "Verification failed";

  return (
    <div className="mx-auto max-w-[480px] px-6 pb-16 pt-14">
      <Kicker>Checkout</Kicker>
      <h1 className="mt-2 text-[24px] font-extrabold tracking-[-0.02em] text-[#1c1917]">
        {title}
      </h1>

      <div className="mt-6 rounded-lg border border-[#e7e5e4] p-6">
        <div className="flex items-center gap-3">
          {(state === "restoring" || state === "verifying") && (
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
          {(state === "failed" || state === "session-expired") && (
            <Badge tone="danger">
              {state === "session-expired" ? "Session expired" : "Failed"}
            </Badge>
          )}
          {state === "success" && <Badge tone="success">Active</Badge>}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-[#57534e]">{message}</p>

        {state === "session-expired" && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href={loginHref} className={btnPrimary + " flex-1"}>
              Log in to confirm
            </Link>
            <Link href="/subscribe" className={btnSecondary + " flex-1"}>
              Back to plans
            </Link>
          </div>
        )}

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

        {state === "success" && (
          <div className="mt-6">
            <Link href="/" className={btnPrimary + " w-full"}>
              Continue reading
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
