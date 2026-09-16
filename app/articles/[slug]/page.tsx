"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/context/AuthContext";
import { apiRoot } from "@/lib/axios";
import { AxiosError } from "axios";
import type { ArticleFull } from "@/types";
import {
  BackLink,
  Badge,
  CheckIcon,
  Kicker,
  LockIcon,
  btnPrimary,
  btnSecondary,
} from "@/components/ui";

function formatDate(value?: string) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

export default function ArticleDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [article, setArticle] = useState<ArticleFull | null>(null);
  const [paywalled, setPaywalled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !user || !params.slug) return;

    const fetchArticle = async () => {
      try {
        const { data } = await apiRoot.get(`/articles/${params.slug}`);
        setArticle(data.data);
      } catch (err) {
        const axiosErr = err as AxiosError;
        if (axiosErr.response?.status === 402) {
          setPaywalled(true);
          const preview = (axiosErr.response.data as any)?.data;
          if (preview) {
            setArticle({ ...preview, body: "" });
          }
        } else if (axiosErr.response?.status === 404) {
          router.push("/");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [authLoading, user, params.slug, router]);

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-[680px] px-6 pb-20 pt-10">
        <div className="tynk-skeleton h-3.5 w-28 rounded" />
        <div className="tynk-skeleton mt-5 h-9 w-4/5 rounded-md" />
        <div className="tynk-skeleton mt-3 h-9 w-3/5 rounded-md" />
        <div className="tynk-skeleton mt-5 h-4 w-52 rounded" />
        <div className="mt-8 space-y-3 border-t border-[#e7e5e4] pt-8">
          <div className="tynk-skeleton h-4 w-full rounded" />
          <div className="tynk-skeleton h-4 w-full rounded" />
          <div className="tynk-skeleton h-4 w-2/3 rounded" />
        </div>
      </div>
    );
  }

  if (paywalled) {
    return (
      <div className="mx-auto max-w-[680px] px-6 pb-20 pt-10">
        <BackLink href="/">All stories</BackLink>

        <div className="mt-6 flex items-center gap-2">
          <Badge tone="neutral">
            <LockIcon />
            Members only
          </Badge>
          {article?.createdAt && (
            <span className="text-[13px] text-[#78716c]">
              {formatDate(article.createdAt)}
            </span>
          )}
        </div>

        <h1 className="mt-4 text-[30px] font-extrabold leading-[1.18] tracking-[-0.025em] text-[#1c1917] sm:text-[36px]">
          {article?.title ?? "This story is for subscribers"}
        </h1>
        <p className="mt-3 text-[14px] text-[#78716c]">
          By {article?.authorEmail ?? "Tynk editorial"}
        </p>

        <div className="mt-8 border-t border-[#e7e5e4] pt-8">
          <div className="rounded-lg border border-[#e7e5e4] bg-[#fafaf9] p-6 sm:p-8">
            <Kicker>Subscription required</Kicker>
            <h2 className="mt-2 text-[20px] font-extrabold tracking-[-0.02em] text-[#1c1917]">
              Keep reading with Tynk
            </h2>
            <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[#57534e]">
              This full story is available to subscribers. One plan unlocks
              every article — no per-story fees.
            </p>

            <div className="mt-5 flex items-baseline gap-1.5">
              <span className="text-[28px] font-extrabold tracking-tight text-[#1c1917]">
                ₦5,000
              </span>
              <span className="text-sm font-medium text-[#78716c]">/month</span>
            </div>

            <ul className="mt-5 space-y-2.5 border-t border-[#e7e5e4] pt-5 text-[14px] text-[#44403c]">
              {[
                "Unlimited full-story reads",
                "Every article unlocked, no exceptions",
                "Secure checkout via Flutterwave",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-[#ff751f]">
                    <CheckIcon />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/subscribe" className={btnPrimary + " flex-1 sm:flex-none sm:px-8"}>
                Subscribe to read
              </Link>
              <Link href="/" className={btnSecondary + " flex-1 sm:flex-none"}>
                Back to stories
              </Link>
            </div>
            <p className="mt-4 text-xs text-[#a8a29e]">
              Secure payment · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!article) return null;

  return (
    <article className="mx-auto max-w-[680px] px-6 pb-20 pt-10">
      <BackLink href="/">All stories</BackLink>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">Full story</Badge>
          {article.createdAt && (
            <span className="text-[13px] text-[#78716c]">
              {formatDate(article.createdAt)}
            </span>
          )}
        </div>
        <h1 className="mt-4 text-[30px] font-extrabold leading-[1.18] tracking-[-0.025em] text-[#1c1917] sm:text-[38px]">
          {article.title}
        </h1>
        <div className="mt-4 flex items-center gap-3 border-b border-[#e7e5e4] pb-6">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1c1917] text-[13px] font-bold text-white"
          >
            {(article.authorEmail ?? "T").charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="text-[13.5px] font-semibold text-[#1c1917]">
              {article.authorEmail ?? "Tynk editorial"}
            </p>
            {article.updatedAt && article.updatedAt !== article.createdAt && (
              <p className="text-xs text-[#a8a29e]">
                Updated {formatDate(article.updatedAt)}
              </p>
            )}
          </div>
        </div>
      </header>

      {article.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.coverImageUrl}
          alt={article.title}
          className="mt-8 aspect-[16/9] w-full rounded-lg border border-[#e7e5e4] object-cover"
        />
      )}

      <div className="tynk-prose mt-8">
        <ReactMarkdown>{article.body}</ReactMarkdown>
      </div>

      <footer className="mt-12 flex items-center justify-between border-t border-[#e7e5e4] pt-6">
        <BackLink href="/">All stories</BackLink>
        <Link
          href="/subscribe"
          className="text-[13px] font-semibold text-[#78716c] transition-colors hover:text-[#ff751f]"
        >
          Membership
        </Link>
      </footer>
    </article>
  );
}
