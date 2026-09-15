"use client";

import { useEffect, useState, FormEvent } from "react";
import { apiRoot } from "@/lib/axios";
import { AxiosError } from "axios";
import type { ArticleListItem } from "@/types";

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
      setError("Could not load article for editing (subscription check bypassed for admins only).");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this article?")) return;
    try {
      await apiRoot.delete(`/articles/${id}`);
      setNotice("Article deleted.");
      await fetchArticles();
    } catch {
      setError("Delete failed.");
    }
  };

  return (
    <div className="mt-10 rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-sm font-semibold text-gray-900">
          Articles — Admin Editor
        </h2>
        <p className="mt-0.5 text-xs text-gray-500">
          Publish paywalled stories. List shows titles only to readers.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 px-6 py-5">
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
            {notice}
          </p>
        )}
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Title (min 3 chars)"
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <textarea
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          placeholder="Body — markdown supported (min 50 chars)"
          rows={6}
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="url"
            value={form.coverImageUrl}
            onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
            placeholder="Cover image URL (optional)"
            className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <select
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as FormState["status"] })
            }
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
          >
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : form.id ? "Update article" : "Publish article"}
          </button>
          {form.id && (
            <button
              type="button"
              onClick={() => setForm(EMPTY_FORM)}
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm text-gray-600"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="divide-y divide-gray-100 border-t border-gray-100">
        {loading ? (
          <p className="px-6 py-6 text-sm text-gray-400">Loading articles…</p>
        ) : articles.length === 0 ? (
          <p className="px-6 py-6 text-sm text-gray-400">No articles yet.</p>
        ) : (
          articles.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-6 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {a.title}
                </p>
                <p className="text-xs text-gray-500">
                  /{a.slug} · {new Date(a.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleEdit(a.id)}
                className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(a.id)}
                className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
