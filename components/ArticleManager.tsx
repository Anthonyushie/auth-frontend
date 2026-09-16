"use client";

import { useEffect, useState, FormEvent } from "react";
import { apiRoot } from "@/lib/axios";
import { AxiosError } from "axios";
import type { ArticleListItem } from "@/types";
import {
  Badge,
  FieldError,
  Notice,
  btnPrimary,
  btnSecondary,
  btnSmallDanger,
  btnSmallSecondary,
} from "@/components/ui";

interface FormState {
  id: string | null;
  title: string;
  body: string;
  coverImageUrl: string;
  status: "Draft" | "Published";
}

const EMPTY_FORM: FormState = {
  id: null,
  title: "",
  body: "",
  coverImageUrl: "",
  status: "Draft",
};

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

export default function ArticleManager() {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchArticles = async () => {
    try {
      const { data } = await apiRoot.get("/articles", {
        params: { status: "all" },
      });
      setArticles(Array.isArray(data.data) ? data.data : []);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (form.title.trim().length < 3) {
      setError("Title must be at least 3 characters.");
      return;
    }
    if (form.body.trim().length < 50) {
      setError("Body must be at least 50 characters.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        body: form.body,
        coverImageUrl: form.coverImageUrl.trim() || undefined,
        status: form.status,
      };
      if (form.id) {
        await apiRoot.put(`/articles/${form.id}`, payload);
        setNotice("Article updated.");
      } else {
        await apiRoot.post("/articles", payload);
        setNotice("Article created.");
      }
      setForm(EMPTY_FORM);
      await fetchArticles();
    } catch (err) {
      const axiosErr = err as AxiosError<any>;
      setError(axiosErr.response?.data?.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const { data } = await apiRoot.get(`/articles/${id}`);
      const a = data.data;
      setForm({
        id: a.id,
        title: a.title ?? "",
        body: a.body ?? "",
        coverImageUrl: a.coverImageUrl ?? "",
        status: a.status === "Published" ? "Published" : "Draft",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Could not load article for editing.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this article? This cannot be undone.")) return;
    try {
      await apiRoot.delete(`/articles/${id}`);
      setNotice("Article deleted.");
      await fetchArticles();
    } catch {
      setError("Delete failed.");
    }
  };

  const editing = Boolean(form.id);

  return (
    <div className="overflow-hidden rounded-lg border border-[#e7e5e4] dark:border-[#292524] bg-white dark:bg-[#1c1917]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e7e5e4] dark:border-[#292524] px-5 py-4">
        <div>
          <h3 className="text-[14px] font-bold tracking-[-0.01em] text-[#1c1917] dark:text-[#fafaf9]">
            {editing ? "Edit article" : "New article"}
          </h3>
          <p className="mt-0.5 text-xs text-[#78716c] dark:text-[#a8a29e]">
            Markdown supported · Title min 3 chars · Body min 50 chars
          </p>
        </div>
        <Badge tone="neutral">
          {articles.length} {articles.length === 1 ? "article" : "articles"}
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 border-b border-[#e7e5e4] dark:border-[#292524] px-5 py-5">
        {error && <FieldError>{error}</FieldError>}
        {notice && <Notice>{notice}</Notice>}

        <div>
          <label htmlFor="am-title" className="tynk-label">
            Title
          </label>
          <input
            id="am-title"
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="A clear, specific headline"
            className="tynk-input"
          />
        </div>

        <div>
          <label htmlFor="am-body" className="tynk-label">
            Body
          </label>
          <textarea
            id="am-body"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Write the full story…"
            rows={7}
            className="tynk-input resize-y font-normal"
          />
          <p className="mt-1.5 text-xs text-[#a8a29e] dark:text-[#78716c]">
            {form.body.trim().length}/50 minimum characters
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
          <div>
            <label htmlFor="am-cover" className="tynk-label">
              Cover image URL <span className="font-normal text-[#a8a29e] dark:text-[#78716c]">(optional)</span>
            </label>
            <input
              id="am-cover"
              type="url"
              value={form.coverImageUrl}
              onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
              placeholder="https://…"
              className="tynk-input"
            />
          </div>
          <div>
            <label htmlFor="am-status" className="tynk-label">
              Status
            </label>
            <select
              id="am-status"
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as FormState["status"] })
              }
              className="tynk-input w-full"
            >
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <button type="submit" disabled={saving} className={btnPrimary}>
            {saving ? "Saving…" : editing ? "Save changes" : "Publish article"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setForm(EMPTY_FORM);
                setError(null);
                setNotice(null);
              }}
              className={btnSecondary}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div>
        <div className="border-b border-[#e7e5e4] dark:border-[#292524] bg-[#fafaf9] dark:bg-[#1c1917] px-5 py-2.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#a8a29e]">
            All articles
          </p>
        </div>
        {loading ? (
          <div className="divide-y divide-[#f0eeec] dark:divide-[#292524]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-5 py-4">
                <div className="tynk-skeleton h-4 w-2/3 rounded" />
                <div className="tynk-skeleton mt-2 h-3 w-40 rounded" />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[#78716c] dark:text-[#a8a29e]">
            No articles yet. Publish your first story above.
          </p>
        ) : (
          <ul className="divide-y divide-[#f0eeec] dark:divide-[#292524]">
            {articles.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[#fafaf9] dark:hover:bg-[#292524]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-[#1c1917] dark:text-[#fafaf9]">
                    {a.title}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[11.5px] text-[#a8a29e] dark:text-[#78716c]">
                    /{a.slug} · {formatDate(a.createdAt)}
                  </p>
                </div>
                <div className="hidden shrink-0 sm:block">
                  <Badge tone={a.hasAccess ? "success" : "neutral"}>
                    {a.hasAccess ? "Open" : "Gated"}
                  </Badge>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(a.id)}
                    className={btnSmallSecondary + " cursor-pointer"}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(a.id)}
                    className={btnSmallDanger + " cursor-pointer"}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
