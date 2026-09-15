import axios, { AxiosInstance } from "axios";

// ---------------------------------------------------------------------------
// Base URLs
// ---------------------------------------------------------------------------
// `api`     → /api/auth (login, register, refresh, profile, admin-dashboard)
// `apiRoot` → /api      (articles, payments) — same interceptors, same token.
// Both share the in-memory token + single refresh lock/queue below.
// ---------------------------------------------------------------------------

const getAuthBaseURL = (): string => {
  const raw = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/auth").trim().replace(/\/+$/, "");
  if (raw.endsWith("/api/auth")) return raw;
  if (raw.endsWith("/api")) return `${raw}/auth`;
  return `${raw}/api/auth`;
};

const getApiRootBaseURL = (): string => {
  return getAuthBaseURL().replace(/\/auth\/?$/, "");
};

const api = axios.create({
  baseURL: getAuthBaseURL(),
  withCredentials: true, // send & receive HTTP-only cookies
  headers: { "Content-Type": "application/json" },
});

export const apiRoot = axios.create({
  baseURL: getApiRootBaseURL(),
  withCredentials: true,
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
// Shared silent-refresh machinery (single lock + queue across both clients)
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

const attachInterceptors = (client: AxiosInstance) => {
  client.interceptors.request.use(
    (config) => {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    // Happy path — pass successful responses straight through.
    (response) => response,

    async (error) => {
      const originalRequest = error.config;

      // Only attempt refresh on 401 AND if we haven't already retried this
      const url = originalRequest.url || "";
      const isAuthEndpoint =
        url.includes("/login") ||
        url.includes("/register") ||
        url.includes("/refresh");

      // Only attempt refresh on 401 for protected API requests, not on auth routes themselves.
      if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
        // If a refresh is already in progress, queue this request instead of
        // firing a second /refresh call.
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return client(originalRequest);
          });
        }

        originalRequest._retry = true; // mark so we don't retry again
        isRefreshing = true;

        try {
          // POST /refresh on the AUTH client — the HTTP-only cookie is sent automatically.
          // The backend rotates the refresh token and returns a new access token.
          const { data } = await api.post("/refresh");

          const newAccessToken: string = data.data?.accessToken || data.accessToken;

          // Store the fresh access token in memory.
          setAccessToken(newAccessToken);

          // Retry every request that was queued while we were refreshing.
          processQueue(null, newAccessToken);

          // Retry the original request that triggered this whole flow.
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return client(originalRequest);
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
};

attachInterceptors(api);
attachInterceptors(apiRoot);

export default api;
