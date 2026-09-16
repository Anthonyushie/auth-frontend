"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";

function NavLink({
  href,
  children,
  active,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative py-1 text-[13.5px] font-semibold tracking-[-0.01em] transition-colors duration-150 ${
        active ? "text-[#1c1917]" : "text-[#78716c] hover:text-[#ff751f]"
      }`}
    >
      {children}
      {active && (
        <span
          aria-hidden="true"
          className="absolute -bottom-[3px] left-0 h-[2px] w-full rounded-full bg-[#ff751f]"
        />
      )}
    </Link>
  );
}

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { hasAccess } = useSubscription();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const handleLogout = async () => {
    setLeaving(true);
    try {
      await logout();
    } finally {
      setOpen(false);
      setLeaving(false);
      router.push("/login");
    }
  };

  const close = () => setOpen(false);
  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b border-[#e7e5e4] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-6">
        <Link href="/" onClick={close} className="flex items-center" aria-label="Tynk home">
          <Image
            src="/tynk_logo.png"
            alt="Tynk"
            width={148}
            height={42}
            priority
            className="h-7 w-auto object-contain"
          />
        </Link>

        {/* Desktop */}
        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {!loading && (
            <>
              {user ? (
                <>
                  <NavLink href="/" active={pathname === "/"}>
                    Articles
                  </NavLink>
                  <NavLink
                    href="/profile"
                    active={pathname === "/profile"}
                  >
                    Profile
                  </NavLink>
                  {isAdmin && (
                    <NavLink
                      href="/admin"
                      active={pathname.startsWith("/admin")}
                    >
                      Admin
                    </NavLink>
                  )}
                  {!hasAccess && (
                    <Link
                      href="/subscribe"
                      className={`h-9 inline-flex items-center rounded-md border px-3.5 text-[13px] font-semibold transition-colors duration-150 ${
                        pathname === "/subscribe"
                          ? "border-[#ff751f] text-[#ff751f]"
                          : "border-[#d6d3d1] text-[#1c1917] hover:border-[#ff751f] hover:text-[#ff751f]"
                      }`}
                    >
                      Subscribe
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={leaving}
                    className="inline-flex h-9 cursor-pointer items-center rounded-md bg-[#ff751f] px-3.5 text-[13px] font-semibold text-white transition-all duration-150 hover:bg-[#d95e0b] active:translate-y-px active:bg-[#b94e08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff751f]/40 disabled:opacity-60"
                  >
                    {leaving ? "Signing out…" : "Logout"}
                  </button>
                </>
              ) : (
                <>
                  <NavLink href="/login" active={pathname === "/login"}>
                    Sign in
                  </NavLink>
                  <Link
                    href="/register"
                    className="inline-flex h-9 items-center rounded-md bg-[#1c1917] px-3.5 text-[13px] font-semibold text-white transition-colors duration-150 hover:bg-[#ff751f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff751f]/40"
                  >
                    Create account
                  </Link>
                </>
              )}
            </>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#e7e5e4] text-[#1c1917] transition-colors hover:border-[#ff751f] hover:text-[#ff751f] md:hidden"
        >
          {open ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav
          aria-label="Mobile"
          className="border-t border-[#e7e5e4] bg-white md:hidden"
        >
          <div className="mx-auto max-w-5xl space-y-1 px-6 py-4">
            {!loading && (
              <>
                {user ? (
                  <>
                    <MobileLink href="/" onClick={close} active={pathname === "/"}>
                      Articles
                    </MobileLink>
                    <MobileLink href="/profile" onClick={close} active={pathname === "/profile"}>
                      Profile
                    </MobileLink>
                    {isAdmin && (
                      <MobileLink href="/admin" onClick={close} active={pathname.startsWith("/admin")}>
                        Admin
                      </MobileLink>
                    )}
                    {!hasAccess && (
                      <MobileLink href="/subscribe" onClick={close} active={pathname === "/subscribe"}>
                        Subscribe — ₦5,000/mo
                      </MobileLink>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={leaving}
                      className="mt-2 inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-md bg-[#ff751f] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#d95e0b] active:bg-[#b94e08] disabled:opacity-60"
                    >
                      {leaving ? "Signing out…" : "Logout"}
                    </button>
                  </>
                ) : (
                  <>
                    <MobileLink href="/login" onClick={close} active={pathname === "/login"}>
                      Sign in
                    </MobileLink>
                    <MobileLink href="/register" onClick={close} active={pathname === "/register"}>
                      Create account
                    </MobileLink>
                  </>
                )}
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

function MobileLink({
  href,
  children,
  onClick,
  active,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-[44px] items-center rounded-md px-2 text-[15px] font-semibold tracking-tight transition-colors ${
        active ? "bg-[#fff4ec] text-[#ff751f]" : "text-[#1c1917] hover:bg-[#f5f5f4]"
      }`}
    >
      {children}
    </Link>
  );
}
