"use client";

import { useEffect, useState, FormEvent, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import type { Task } from "@/types";

// ---------------------------------------------------------------------------
// Tasks Page — Full CRUD with JWT-protected requests
// ---------------------------------------------------------------------------
// Every API call below uses the custom Axios instance from `@/lib/axios`.
// This means:
//   • The request interceptor automatically attaches the in-memory JWT
//     access token as an `Authorization: Bearer <token>` header.
//   • The response interceptor catches any 401, silently refreshes the
//     token via the HTTP-only cookie, and retries the failed request.
//   • `withCredentials: true` ensures the browser sends/receives the
//     HTTP-only refresh-token cookie on every request.
// We don't need to manually manage tokens anywhere in this component.
// ---------------------------------------------------------------------------

// Base URL resolution for tasks:
// If baseURL ends with '/auth', strip it so requests target `/api/tasks`
// instead of `/api/auth/tasks`, while keeping all interceptors active.
const tasksConfig = {
  baseURL: api.defaults.baseURL
    ? api.defaults.baseURL.replace(/\/auth\/?$/, "")
    : undefined,
};

export default function TasksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // -----------------------------------------------------------------------
  // Auth Guard — redirect to /login if the user is not authenticated.
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // -----------------------------------------------------------------------
  // READ — Fetch all tasks on mount (GET /api/tasks)
  // -----------------------------------------------------------------------
  // The custom Axios instance automatically attaches the access token.
  // If it's expired, the interceptor refreshes it before retrying.
  // -----------------------------------------------------------------------

  const fetchTasks = useCallback(async () => {
    try {
      // Using the custom `api` instance with tasksConfig — JWT interceptor handled automatically.
      const { data } = await api.get("/tasks", tasksConfig);
      setTasks(data.tasks ?? data);
    } catch {
      // 401 → interceptor redirects to /login
      // Other errors → leave task list empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      fetchTasks();
    }
  }, [authLoading, user, fetchTasks]);

  // -----------------------------------------------------------------------
  // CREATE — Add a new task (POST /api/tasks)
  // -----------------------------------------------------------------------
  // After creating, we prepend the new task to local state (optimistic)
  // so the UI updates instantly without a full refetch.
  // -----------------------------------------------------------------------

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsCreating(true);
    try {
      // The interceptor attaches the Bearer token automatically.
      const { data } = await api.post("/tasks", { title: newTitle.trim() }, tasksConfig);
      const created: Task = data.task ?? data;

      // Optimistic update — add to the top of the list immediately.
      setTasks((prev) => [created, ...prev]);
      setNewTitle("");
    } catch {
      // If creation fails, refetch to ensure UI is in sync.
      await fetchTasks();
    } finally {
      setIsCreating(false);
    }
  };

  // -----------------------------------------------------------------------
  // UPDATE — Toggle completed status (PUT /api/tasks/:id)
  // -----------------------------------------------------------------------
  // We optimistically flip the `completed` boolean in local state first,
  // then send the request. If it fails, we revert by refetching.
  // -----------------------------------------------------------------------

  const handleToggle = async (task: Task) => {
    const updatedCompleted = !task.completed;

    // Optimistic update — flip immediately in the UI.
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, completed: updatedCompleted } : t
      )
    );

    try {
      // The custom Axios instance handles auth headers & token refresh.
      await api.put(`/tasks/${task.id}`, { completed: updatedCompleted }, tasksConfig);
    } catch {
      // Revert on failure — refetch the real state from the server.
      await fetchTasks();
    }
  };

  // -----------------------------------------------------------------------
  // DELETE — Remove a task (DELETE /api/tasks/:id)
  // -----------------------------------------------------------------------
  // We optimistically remove the task from local state. If the server
  // rejects the request, we refetch to restore the correct list.
  // -----------------------------------------------------------------------

  const handleDelete = async (taskId: string) => {
    // Optimistic update — remove from UI immediately.
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      // Auth header is injected by the request interceptor.
      await api.delete(`/tasks/${taskId}`, tasksConfig);
    } catch {
      // Revert on failure.
      await fetchTasks();
    }
  };

  // -----------------------------------------------------------------------
  // Loading / Auth Guard UI
  // -----------------------------------------------------------------------

  if (authLoading || (!user && !loading)) {
    return (
      <div className="mx-auto max-w-2xl animate-pulse space-y-4 py-12">
        <div className="h-8 w-40 rounded bg-gray-200" />
        <div className="h-12 rounded-xl bg-gray-200" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-2xl py-12">
      <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
      <p className="mt-1 text-sm text-gray-500">
        Create, complete, and delete your tasks.
      </p>

      {/* ----------------------------------------------------------------- */}
      {/* CREATE — New task form                                            */}
      {/* ----------------------------------------------------------------- */}
      <form onSubmit={handleCreate} className="mt-6 flex gap-3">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <button
          type="submit"
          disabled={isCreating || !newTitle.trim()}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCreating ? (
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
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
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : (
            /* Plus icon */
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          )}
          Add
        </button>
      </form>

      {/* ----------------------------------------------------------------- */}
      {/* READ — Task list                                                  */}
      {/* ----------------------------------------------------------------- */}
      <div className="mt-6 space-y-2">
        {loading ? (
          // Loading skeleton
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl bg-gray-100"
            />
          ))
        ) : tasks.length === 0 ? (
          // Empty state
          <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center">
            <p className="text-sm text-gray-400">
              No tasks yet. Add one above to get started!
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition hover:shadow-md"
            >
              {/* UPDATE — Toggle checkbox */}
              <button
                onClick={() => handleToggle(task)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
                  task.completed
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-gray-300 hover:border-indigo-400"
                }`}
                aria-label={
                  task.completed ? "Mark as incomplete" : "Mark as complete"
                }
              >
                {task.completed && (
                  <svg
                    className="h-3 w-3"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                )}
              </button>

              {/* Task title */}
              <span
                className={`flex-1 text-sm transition ${
                  task.completed
                    ? "text-gray-400 line-through"
                    : "text-gray-800"
                }`}
              >
                {task.title}
              </span>

              {/* DELETE — Trash button */}
              <button
                onClick={() => handleDelete(task.id)}
                className="rounded-lg p-1.5 text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                aria-label="Delete task"
              >
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Task count footer */}
      {!loading && tasks.length > 0 && (
        <p className="mt-4 text-xs text-gray-400">
          {tasks.filter((t) => !t.completed).length} of {tasks.length} task
          {tasks.length !== 1 ? "s" : ""} remaining
        </p>
      )}
    </div>
  );
}
