import axios from "axios";

// ---------------------------------------------------------------------------
// Axios Instance
// ---------------------------------------------------------------------------
// Central Axios instance every component imports. `withCredentials` is
// critical — it tells the browser to include the HTTP-only refresh-token
// cookie on every request to the backend.
// ---------------------------------------------------------------------------

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/auth",
  withCredentials: true, // send & receive HTTP-only cookies
  headers: { "Content-Type": "application/json" },
});

// ---------------------------------------------------------------------------
// In-Memory Access Token Store
// ---------------------------------------------------------------------------
// The access token is NEVER written to localStorage / sessionStorage.
// Keeping it in a module-level variable means it survives across component
// re-renders but is wiped on a full page reload (which is the desired
// security behaviour — on reload we silently refresh via the cookie).
// ---------------------------------------------------------------------------

let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = () => inMemoryAccessToken;

// ---------------------------------------------------------------------------
// Request Interceptor — attach the access token
// ---------------------------------------------------------------------------
// Before every outgoing request, if we hold an access token in memory, we
// inject it as a Bearer token in the Authorization header.
// ---------------------------------------------------------------------------

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response Interceptor — silent token rotation on 401
// ---------------------------------------------------------------------------
// When the backend returns 401 (access token expired or invalid) we:
//   1. Pause the failing request.
//   2. Call POST /refresh — the browser automatically sends the HTTP-only
//      refresh-token cookie. The backend validates it, rotates the refresh
//      token (invalidating the old one), and returns a fresh access token.
//   3. Store the new access token in memory.
//   4. Retry the original request with the new token.
//
// If /refresh itself fails (e.g. refresh token expired, or the backend
// detected token reuse — a sign of theft), we clear state and redirect
// to /login so the user re-authenticates.
//
// A "refreshing" lock prevents multiple concurrent 401s from each
// independently hitting /refresh and causing race conditions.
// ---------------------------------------------------------------------------

let isRefreshing = false;

// Queue of requests that arrived while a refresh was in-flight.
// Each entry holds the resolve/reject of a Promise the caller is awaiting.
let failedQueue: {
  resolve: (token: string | null) => void;
  reject: (err: unknown) => void;
}[] = [];

/**
 * Flush the queue — either retry every queued request with the new token,
 * or reject them all if the refresh failed.
 */
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  // Happy path — pass successful responses straight through.
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 AND if we haven't already retried this
    // specific request (prevents infinite loops).
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If a refresh is already in progress, queue this request instead of
      // firing a second /refresh call.
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true; // mark so we don't retry again
      isRefreshing = true;

      try {
        // POST /refresh — the HTTP-only cookie is sent automatically.
        // The backend rotates the refresh token and returns a new access token.
        const { data } = await api.post("/refresh");

        const newAccessToken: string = data.accessToken;

        // Store the fresh access token in memory.
        setAccessToken(newAccessToken);

        // Retry every request that was queued while we were refreshing.
        processQueue(null, newAccessToken);

        // Retry the original request that triggered this whole flow.
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — token is invalid, expired, or reuse was detected.
        // Reject all queued requests and redirect to login.
        processQueue(refreshError, null);
        setAccessToken(null);

        // Only redirect on the client (avoid crashing during SSR).
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For non-401 errors, just propagate them normally.
    return Promise.reject(error);
  }
);

export default api;
