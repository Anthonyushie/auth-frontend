"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { AxiosError } from "axios";
import { FieldError, Kicker, btnPrimary } from "@/components/ui";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.push("/profile");
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const status = axiosErr.response?.status;
      const message = axiosErr.response?.data?.message;

      if (status === 401) {
        setError("Invalid email or password. Please try again.");
      } else if (status === 400) {
        setError(message || "Please check your input and try again.");
      } else {
        setError(message || "Something went wrong. Please try again later.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[440px] px-6 pb-16 pt-14">
      <Kicker>Sign in</Kicker>
      <h1 className="mt-2 text-[26px] font-extrabold tracking-[-0.02em] text-[#1c1917]">
        Welcome back
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-[#78716c]">
        Sign in to read, manage your subscription, and continue where you left off.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-7 rounded-lg border border-[#e7e5e4] bg-white p-6"
      >
        {error && (
          <div className="mb-5">
            <FieldError>{error}</FieldError>
          </div>
        )}

        <div>
          <label htmlFor="email" className="tynk-label">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="tynk-input"
            placeholder="you@example.com"
          />
        </div>

        <div className="mt-4">
          <label htmlFor="password" className="tynk-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="tynk-input"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={btnPrimary + " mt-6 w-full"}
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-90"
                  fill="currentColor"
                  d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
                />
              </svg>
              Signing in…
            </span>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[#78716c]">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-[#1c1917] underline decoration-[#ff751f] decoration-2 underline-offset-4 transition-colors hover:text-[#ff751f]"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
