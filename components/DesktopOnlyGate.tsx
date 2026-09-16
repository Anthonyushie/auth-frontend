"use client";

import { useEffect, useState } from "react";

type Status = "checking" | "desktop" | "mobile";

function hasMobileUATokens(ua: string): boolean {
  return /Android|iPhone|iPad|iPod|Mobile|Phone|BlackBerry|IEMobile|Opera Mini|webOS/i.test(
    ua
  );
}

/**
 * Balanced desktop check that survives mobile "Desktop site / Desktop mode".
 *
 * Why this works when width + UA-string checks fail:
 * - Desktop mode spoofs the UA string to Windows + expands innerWidth to ~980px+,
 *   so `min-width` breakpoints and `/Mobile/i` regexes pass incorrectly.
 * - Desktop mode does NOT spoof: Client Hints (`userAgentData.mobile`),
 *   `pointer: coarse`, `hover: none`, or touch capability.
 *
 * Balanced rule (allows touchscreen laptops like Surface):
 * - Allowed = has fine pointer + hover AND no explicit mobile hint.
 * - Blocked = explicit mobile hint, or (touch + coarse/no-hover), or mobile UA tokens.
 */
function isDesktopDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const nav = navigator as Navigator & {
    userAgentData?: { mobile?: boolean };
    maxTouchPoints?: number;
  };

  const uaMobileHint = nav.userAgentData?.mobile === true;
  const ua = typeof nav.userAgent === "string" ? nav.userAgent : "";

  const canMatchMedia = typeof window.matchMedia === "function";
  const coarse = canMatchMedia
    ? window.matchMedia("(pointer: coarse)").matches
    : false;
  const noHover = canMatchMedia
    ? window.matchMedia("(hover: none)").matches
    : false;
  const fineHover = canMatchMedia
    ? window.matchMedia("(hover: hover) and (pointer: fine)").matches
    : false;
  const hasTouch =
    (typeof nav.maxTouchPoints === "number" && nav.maxTouchPoints > 0) ||
    "ontouchstart" in window;

  // Real desktop (including touchscreen laptops with a mouse/trackpad).
  if (fineHover && !uaMobileHint) {
    return true;
  }

  // Strongest signal: Chromium Client Hint stays mobile:true even in desktop mode.
  if (uaMobileHint) {
    return false;
  }

  // Classic phone/tablet posture: touch + coarse pointer and/or no hover.
  if (hasTouch && (coarse || noHover)) {
    return false;
  }

  // Fallback for Safari/Firefox (no userAgentData): UA tokens aren't spoofed
  // unless the user explicitly requested desktop mode, and even then the
  // pointer/touch checks above usually already caught it.
  if (hasMobileUATokens(ua)) {
    return false;
  }

  // Last resort: a touch device reporting a tiny physical screen is a phone,
  // even if the viewport was expanded by desktop mode.
  if (hasTouch && typeof window.screen !== "undefined") {
    const smallestSide = Math.min(
      window.screen.width,
      window.screen.height
    );
    if (smallestSide > 0 && smallestSide <= 500) {
      return false;
    }
  }

  return true;
}

export default function DesktopOnlyGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const update = () => {
      setStatus(isDesktopDevice() ? "desktop" : "mobile");
    };

    update();

    const mqls: MediaQueryList[] = [];
    if (typeof window.matchMedia === "function") {
      mqls.push(
        window.matchMedia("(pointer: coarse)"),
        window.matchMedia("(hover: hover) and (pointer: fine)"),
        window.matchMedia("(hover: none)")
      );
    }

    const onChange = () => update();
    for (const mql of mqls) {
      if (typeof mql.addEventListener === "function") {
        mql.addEventListener("change", onChange);
      } else if (
        typeof (mql as unknown as { addListener?: (fn: () => void) => void })
          .addListener === "function"
      ) {
        (mql as unknown as { addListener: (fn: () => void) => void }).addListener(
          onChange
        );
      }
    }
    window.addEventListener("resize", onChange);
    window.addEventListener("orientationchange", onChange);

    return () => {
      for (const mql of mqls) {
        if (typeof mql.removeEventListener === "function") {
          mql.removeEventListener("change", onChange);
        } else if (
          typeof (
            mql as unknown as { removeListener?: (fn: () => void) => void }
          ).removeListener === "function"
        ) {
          (
            mql as unknown as { removeListener: (fn: () => void) => void }
          ).removeListener(onChange);
        }
      }
      window.removeEventListener("resize", onChange);
      window.removeEventListener("orientationchange", onChange);
    };
  }, []);

  if (status === "checking") {
    // Avoid flashing the real UI before detection resolves (also avoids hydration mismatch).
    return <div className="min-h-screen bg-white dark:bg-[#0c0a09]" aria-hidden="true" />;
  }

  if (status === "mobile") {
    return (
      <div
        data-desktop-gate="blocked"
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-white p-6 dark:bg-[#0c0a09]"
        role="alert"
      >
        <div className="w-full max-w-md rounded-xl border border-[#e7e5e4] bg-[#fafaf9] p-8 text-center dark:border-[#292524] dark:bg-[#1c1917]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fff4ec] text-[#ff751f] dark:bg-[#292524]">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect width="18" height="12" x="3" y="4" rx="2" />
              <path d="M8 20h8M12 16v4" />
            </svg>
          </div>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[#a8a29e]">
            Desktop only
          </p>
          <h1 className="mt-2 text-[22px] font-extrabold tracking-[-0.02em] text-[#1c1917] dark:text-[#fafaf9]">
            Please visit Tynk on a computer
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#78716c] dark:text-[#a8a29e]">
            This publication is designed for desktop browsers only and
            isn&apos;t available on phones or tablets — even with
            “Desktop site” turned on.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
