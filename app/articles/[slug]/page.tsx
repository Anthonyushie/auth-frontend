"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/context/AuthContext";
import { apiRoot } from "@/lib/axios";
import { AxiosError } from "axios";
import type { ArticleFull } from "@/types";

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
      <div className="mx-auto max-w-2xl animate-pulse space-y-4 py-12">
        <div className="h-8 w-3/4 rounded bg-gray-200" />
        <div className="h-4 w-40 rounded bg-gray-200" />
        <div className="h-64 rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (paywalled) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-10 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl">
            🔒
          </div>
          <h1 className="mt-4 text-xl font-bold text-gray-900">
            {article?.title ?? "This story is for subscribers"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            You&apos;re seeing the title only. Subscribe for ₦5,000/month to
            unlock the full story.
          </p>
          <Link
            href="/subscribe"
            className="mt-6 inline-block rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Subscribe to read
          </Link>
          <div className="mt-4">
            <Link href="/" className="text-sm text-gray-500 hover:text-indigo-600">
              ← Back to feed
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!article) return null;

  return (
    <article className="mx-auto max-w-2xl py-12">
      <Link href="/" className="text-sm text-gray-500 hover:text-indigo-600">
        ← Back to feed
      </Link>
      {article.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.coverImageUrl}
          alt={article.title}
          className="mt-6 max-h-80 w-full rounded-2xl object-cover"
        />
      )}
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-gray-900">
        {article.title}
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        {article.authorEmail ?? "Staff"} ·{" "}
        {article.createdAt
          ? new Date(article.createdAt).toLocaleDateString()
          : ""}
      </p>
      <div className="prose mt-8 max-w-none text-gray-800">
        <ReactMarkdown>{article.body}</ReactMarkdown>
      </div>
    </article>
  );
}
