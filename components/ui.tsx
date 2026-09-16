import Link from "next/link";
import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Buttons — single source of truth                                    */
/* ------------------------------------------------------------------ */

export const btnPrimary =
  "inline-flex h-10 items-center justify-center rounded-md bg-[#ff751f] px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#d95e0b] active:bg-[#b94e08] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff751f]/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#ff751f] disabled:active:translate-y-0";

export const btnSecondary =
  "inline-flex h-10 items-center justify-center rounded-md border border-[#d6d3d1] bg-white px-4 text-sm font-semibold text-[#1c1917] transition-colors duration-150 hover:border-[#ff751f] hover:text-[#ff751f] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff751f]/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[#d6d3d1] disabled:hover:text-[#1c1917] dark:border-[#44403c] dark:bg-[#1c1917] dark:text-[#fafaf9] dark:disabled:hover:border-[#44403c] dark:disabled:hover:text-[#fafaf9]";

export const btnSmall =
  "inline-flex h-8 items-center justify-center rounded-md px-3 text-[13px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff751f]/30";

export const btnSmallSecondary =
  btnSmall +
  " border border-[#d6d3d1] bg-white text-[#44403c] hover:border-[#ff751f] hover:text-[#ff751f] dark:border-[#44403c] dark:bg-[#1c1917] dark:text-[#d6d3d1]";

export const btnSmallDanger =
  btnSmall +
  " border border-[#fecaca] bg-white text-[#b91c1c] hover:bg-[#fef2f2] hover:border-[#fca5a5] dark:border-[#7f1d1d] dark:bg-[#1c1917] dark:text-[#fca5a5] dark:hover:bg-[#292524]";

/* ------------------------------------------------------------------ */
/* Typography                                                          */
/* ------------------------------------------------------------------ */

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#a8a29e] dark:text-[#78716c]">
      {children}
    </p>
  );
}

export function PageHeader({
  kicker,
  title,
  lede,
  action,
}: {
  kicker: string;
  title: string;
  lede?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <Kicker>{kicker}</Kicker>
        <h1 className="mt-2 text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] text-[#1c1917] sm:text-[32px] dark:text-[#fafaf9]">
          {title}
        </h1>
        {lede && (
          <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-[#78716c] dark:text-[#a8a29e]">
            {lede}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 pb-0.5">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Badges — compact, secondary to content                              */
/* ------------------------------------------------------------------ */

type BadgeTone = "neutral" | "accent" | "dark" | "success" | "danger";

const badgeTones: Record<BadgeTone, string> = {
  neutral:
    "border-[#e7e5e4] bg-[#f5f5f4] text-[#78716c] dark:border-[#44403c] dark:bg-[#292524] dark:text-[#a8a29e]",
  accent:
    "border-[#ffd9bd] bg-[#fff4ec] text-[#c2570b] dark:border-[#7c2d12] dark:bg-[#431407] dark:text-[#fdba74]",
  dark: "border-[#1c1917] bg-[#1c1917] text-white dark:border-[#fafaf9] dark:bg-[#fafaf9] dark:text-[#1c1917]",
  success:
    "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d] dark:border-[#14532d] dark:bg-[#052e16] dark:text-[#4ade80]",
  danger:
    "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c] dark:border-[#7f1d1d] dark:bg-[#450a0a] dark:text-[#fca5a5]",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] ${badgeTones[tone]}`}
    >
      {children}
    </span>
  );
}

export function LockIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

export function Section({
  title,
  lede,
  action,
  children,
}: {
  title: string;
  lede?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-4 border-b border-[#e7e5e4] pb-3 dark:border-[#292524]">
        <div>
          <h2 className="text-[15px] font-bold tracking-[-0.01em] text-[#1c1917] dark:text-[#fafaf9]">
            {title}
          </h2>
          {lede && <p className="mt-0.5 text-[13px] text-[#78716c] dark:text-[#a8a29e]">{lede}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-y border-[#e7e5e4] py-12 text-left dark:border-[#292524]">
      <h3 className="text-[16px] font-bold tracking-tight text-[#1c1917] dark:text-[#fafaf9]">
        {title}
      </h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[#78716c] dark:text-[#a8a29e]">
        {body}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-xl pt-14">
      <Kicker>Error</Kicker>
      <h1 className="mt-2 text-[24px] font-extrabold tracking-[-0.02em] text-[#1c1917] dark:text-[#fafaf9]">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[#78716c] dark:text-[#a8a29e]">{body}</p>
      {action && <div className="mt-6 flex flex-wrap gap-3">{action}</div>}
    </div>
  );
}

export function FieldError({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-3.5 py-2.5 text-[13.5px] font-medium leading-relaxed text-[#b91c1c] dark:border-[#7f1d1d] dark:bg-[#450a0a] dark:text-[#fca5a5]"
    >
      {children}
    </div>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="rounded-md border border-[#bbf7d0] bg-[#f0fdf4] px-3.5 py-2.5 text-[13.5px] font-medium text-[#15803d] dark:border-[#14532d] dark:bg-[#052e16] dark:text-[#4ade80]"
    >
      {children}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#78716c] transition-colors hover:text-[#ff751f] dark:text-[#a8a29e]"
    >
      <span aria-hidden="true">←</span> {children}
    </Link>
  );
}
