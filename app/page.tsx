"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
        Welcome to <span className="text-indigo-600">AuthApp</span>
      </h1>
      <p className="mt-4 max-w-md text-lg text-gray-500">
        A secure authentication system powered by JWT access tokens and
        HTTP-only refresh token cookies.
      </p>
      {!loading && !user && (
        <div className="mt-8 flex gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-indigo-600 px-6 py-2.5 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
          >
            Register
          </Link>
        </div>
      )}
    </div>
  );
}
