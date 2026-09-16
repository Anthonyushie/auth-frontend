"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { AxiosError } from "axios";
import {
  BackLink,
  Badge,
  EmptyState,
  FieldError,
  Kicker,
  btnSecondary,
  btnSmallDanger,
} from "@/components/ui";

interface UserData {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

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

export default function AdminUsersPage() {
  const { loading: authLoading, user: currentUser } = useAuth();

  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/users");
      setUsers(data.data || []);
      setError(null);
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (axiosErr.response?.status === 403) {
        setForbidden(true);
      } else {
        setError("Failed to fetch users");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update role");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

    try {
      await api.delete(`/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 pb-16 pt-10">
        <div className="tynk-skeleton h-3 w-16 rounded" />
        <div className="tynk-skeleton mt-3 h-8 w-56 rounded-md" />
        <div className="mt-6 overflow-hidden rounded-lg border border-[#e7e5e4]">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 border-b border-[#f0eeec] px-5 py-4 last:border-0">
              <div className="tynk-skeleton h-8 w-8 rounded-full" />
              <div className="tynk-skeleton h-4 w-48 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="mx-auto max-w-2xl px-6 pb-16 pt-14">
        <Kicker>403 · Restricted</Kicker>
        <h1 className="mt-2 text-[26px] font-extrabold tracking-[-0.02em] text-[#1c1917]">
          Permission denied
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-[#78716c]">
          This area is for admins only. If you believe this is an error,
          contact your administrator.
        </p>
        <div className="mt-6">
          <Link href="/" className={btnSecondary}>
            ← Return to articles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pb-16 pt-10">
      <BackLink href="/admin">Dashboard</BackLink>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Kicker>Admin · Users</Kicker>
          <h1 className="mt-2 text-[28px] font-extrabold tracking-[-0.02em] text-[#1c1917]">
            Users
          </h1>
          <p className="mt-1.5 text-sm text-[#78716c]">
            {users.length} {users.length === 1 ? "account" : "accounts"} · roles
            and access control.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-5">
          <FieldError>{error}</FieldError>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-lg border border-[#e7e5e4] bg-white">
        {users.length === 0 ? (
          <div className="px-5 py-8">
            <EmptyState
              title="No users found"
              body="No registered accounts matched this view."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e7e5e4] bg-[#fafaf9]">
                  <th className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#a8a29e]">
                    User
                  </th>
                  <th className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#a8a29e]">
                    Role
                  </th>
                  <th className="hidden px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#a8a29e] sm:table-cell">
                    Joined
                  </th>
                  <th className="px-5 py-2.5 text-right text-[11px] font-bold uppercase tracking-[0.12em] text-[#a8a29e]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eeec]">
                {users.map((u) => {
                  // @ts-ignore - shape varies by backend version
                  const isSelf = Boolean(currentUser && (currentUser.id === u.id || (currentUser as any).userId === u.id));

                  return (
                    <tr key={u.id} className="transition-colors hover:bg-[#fafaf9]">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f5f5f4] text-xs font-bold text-[#57534e]"
                          >
                            {u.email.charAt(0).toUpperCase()}
                          </span>
                          <span className="min-w-0">
                            <span className="flex flex-wrap items-center gap-2 text-[13.5px] font-semibold text-[#1c1917]">
                              <span className="truncate">{u.email}</span>
                              {isSelf && <Badge tone="accent">You</Badge>}
                            </span>
                            <span className="mt-0.5 block truncate font-mono text-[11px] text-[#a8a29e]">
                              {u.id}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={isSelf}
                          aria-label={`Role for ${u.email}`}
                          className="tynk-input h-9 cursor-pointer text-[13px] disabled:cursor-not-allowed disabled:bg-[#f5f5f4] disabled:text-[#a8a29e]"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="hidden whitespace-nowrap px-5 py-3.5 text-[13px] text-[#78716c] sm:table-cell">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(u.id)}
                          disabled={isSelf}
                          className={
                            btnSmallDanger +
                            " cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                          }
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
