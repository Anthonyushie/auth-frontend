"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { AxiosError } from "axios";
import { FieldError, Kicker, btnPrimary } from "@/components/ui";

export default function RegisterPage() {
  const { register } = useAuth();
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
      await register(email, password);
      router.push("/login");
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const status = axiosErr.response?.status;
      const message = axiosErr.response?.data?.message;

      if (status === 409) {
        setError("An account with this email already exists.");
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
      <Kicker>Create account</Kicker>
      <h1 className="mt-2 text-[26px] font-extrabold tracking-[-0.02em] text-[#1c1917]">
        Join Tynk
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-[#78716c]">
        One free account. Subscribe later for ₦5,000/month to unlock every story.
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
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="tynk-input"
            placeholder="Minimum 6 characters"
          />
          <p className="mt-1.5 text-xs text-[#a8a29e]">
            Minimum 6 characters.
          </p>
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
              Creating account…
            </span>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[#78716c]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#1c1917] underline decoration-[#ff751f] decoration-2 underline-offset-4 transition-colors hover:text-[#ff751f]"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
