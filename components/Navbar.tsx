"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link href="/" className="text-lg font-bold tracking-tight text-indigo-600">
          AuthApp
        </Link>

        {/* Navigation links */}
        {!loading && (
          <div className="flex items-center gap-4 text-sm font-medium">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="text-gray-600 transition hover:text-indigo-600"
                >
                  Profile
                </Link>
                <Link
                  href="/tasks"
                  className="text-gray-600 transition hover:text-indigo-600"
                >
                  Tasks
                </Link>
                <Link
                  href="/admin"
                  className="text-gray-600 transition hover:text-indigo-600"
                >
                  Admin
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-white transition hover:bg-indigo-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-600 transition hover:text-indigo-600"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-white transition hover:bg-indigo-700"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
