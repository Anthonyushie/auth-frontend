# Next.js Authentication & Paid Content Client

A production-ready client built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS**. Medium-style paid content gated by a Flutterwave single-tier subscription (₦5,000/mo). Auth uses short-lived in-memory **JWT Access Tokens** and long-lived **HTTP-only cookie Refresh Tokens** with automated token rotation and request queuing.

---

## 🔒 Security Architecture

### 1. In-Memory Access Tokens (XSS Protection)
- Access tokens are stored exclusively in **memory** (module-level state via `lib/axios.ts` and `context/AuthContext.tsx`).
- They are **never** persisted to `localStorage` or `sessionStorage`, protecting user credentials from cross-site scripting (XSS) extraction attacks.

### 2. HTTP-Only Cookies (Refresh Tokens)
- Long-lived refresh tokens are stored in secure, `HttpOnly`, `SameSite` cookies managed directly by the browser and Express backend.
- JavaScript cannot read or modify this cookie.
- Every Axios request includes `withCredentials: true` to transmit cookies across origins.

### 3. Silent Token Rotation on 401
The custom Axios interceptor (`lib/axios.ts`) orchestrates seamless session recovery:
1. **Detection**: Listens for `401 Unauthorized` responses on protected API calls.
2. **Locking & Queuing**: Uses an `isRefreshing` lock flag. If multiple concurrent requests fail with 401 simultaneously, only **one** `/refresh` call is dispatched; all subsequent requests are placed into a pending Promise queue (`failedQueue`).
3. **Rotation**: Dispatches `POST /api/auth/refresh`. The browser sends the HTTP-only cookie, and the backend returns a new access token while rotating the refresh token.
4. **Retry & Drain**: The in-memory token is updated, and all queued requests—as well as the original failed request—are re-executed with the new `Authorization: Bearer <token>` header.
5. **Rejection & Redirect**: If the refresh token is expired, revoked, or caught in token reuse detection, all queued requests reject, in-memory state is purged, and the user is redirected to `/login`.

---

## 📁 Project Structure

```
auth-frontend/
├── app/
│   ├── admin/
│   │   └── page.tsx          # Admin dashboard + article editor (explicit 403 handler)
│   ├── articles/
│   │   └── [slug]/page.tsx   # Gated reader (402 → paywall card, else markdown body)
│   ├── subscribe/
│   │   ├── page.tsx          # Checkout → Flutterwave paymentLink redirect
│   │   └── callback/page.tsx # Verify transaction_id+tx_ref → activate → redirect
│   ├── login/
│   │   └── page.tsx          # Login form with error mapping (401, 400)
│   ├── profile/
│   │   └── page.tsx          # Protected User Profile (skeleton loader, account details)
│   ├── register/
│   │   └── page.tsx          # Registration form (role selection, 409 conflict handling)
│   ├── globals.css           # Tailwind CSS styles
│   ├── layout.tsx            # Root layout with AuthProvider + SubscriptionProvider & Navbar
│   └── page.tsx              # Articles feed (titles only, lock icons)
├── components/
│   ├── ArticleManager.tsx    # Admin CRUD form + table for articles
│   └── Navbar.tsx            # Navigation bar with Articles / Subscribe / Admin links
├── context/
│   ├── AuthContext.tsx       # Auth context (in-memory token, user, login, register, logout)
│   └── SubscriptionContext.tsx # Subscription status (hasAccess, refreshStatus)
├── lib/
│   └── axios.ts              # `api` (/api/auth) + `apiRoot` (/api) sharing token/refresh
├── types/
│   └── index.ts              # TypeScript interfaces (ArticleListItem, ArticleFull, etc.)
├── .env.local                # Local environment variables
├── next.config.ts            # Next.js configuration
├── package.json              # Project dependencies and scripts
├── postcss.config.mjs        # PostCSS configuration for Tailwind
└── tsconfig.json             # TypeScript configuration
```

---

## 🚀 API Endpoints Integrated

| Endpoint | Method | Auth Required | Description |
|---|---|---|---|
| `/api/auth/register` | `POST` | No | Register new user (`email`, `password`, `role`) |
| `/api/auth/login` | `POST` | No | Authenticate user, receive access token, set refresh cookie |
| `/api/auth/refresh` | `POST` | Cookie | Rotate refresh token via HTTP-only cookie, return new access token |
| `/api/auth/logout` | `POST` | Optional | Invalidate session and clear refresh cookie |
| `/api/auth/profile` | `GET` | Bearer Token | Fetch authenticated user profile |
| `/api/auth/admin-dashboard` | `GET` | Bearer + Admin | Access admin panel (returns 403 for non-admin users) |
| `/api/auth/users` | `GET` | Bearer + Admin | List all users |
| `/api/auth/users/:id/role` | `PUT` | Bearer + Admin | Update a user's role |
| `/api/auth/users/:id` | `DELETE` | Bearer + Admin | Delete a user |
| `/api/articles` | `GET` | Bearer Token | List titles/metadata only (no body) |
| `/api/articles/:slug` | `GET` | Bearer Token | Full body if subscribed, else `402` |
| `/api/articles` | `POST` | Bearer + Admin | Create article (`title>=3`, `body>=50`) |
| `/api/articles/:id` | `PUT` | Bearer + Admin | Update article |
| `/api/articles/:id` | `DELETE` | Bearer + Admin | Delete article |
| `/api/payments/checkout` | `POST` | Bearer Token | Start sub, returns `{paymentLink,txRef}` |
| `/api/payments/verify` | `GET` | Bearer Token | Verify `transaction_id+tx_ref` → activate |
| `/api/payments/status` | `GET` | Bearer Token | `{hasAccess,status,currentPeriodEnd}` |

---

## 💻 Pages & Features

### 1. Authentication Context (`context/AuthContext.tsx`)
- Provides `user`, `accessToken`, `loading`, `login`, `register`, and `logout`.
- **Auto-Session Hydration**: On initial application load or hard reload, attempts a silent refresh call to `/refresh` to restore the user session seamlessly if a valid cookie is present.

### 2. Login & Register (`app/login/page.tsx` & `app/register/page.tsx`)
- Clean, responsive Tailwind forms.
- Dynamic submission states (animated spinners, button disabling).
- Maps backend HTTP status codes to user-friendly inline messages:
  - `401 Unauthorized` → *"Invalid email or password. Please try again."*
  - `409 Conflict` → *"An account with this email already exists."*
  - `400 Bad Request` → Displays validation error messages from the backend.

### 3. Protected Profile (`app/profile/page.tsx`)
- Fetches user data via `GET /api/auth/profile`.
- Displays an animated loading skeleton during fetch or token validation.
- Renders user avatar initials, role badge, email, and joined date.

### 4. Admin Dashboard with RBAC (`app/admin/page.tsx` + `components/ArticleManager.tsx`)
- Targets `GET /api/auth/admin-dashboard` and user management endpoints (`/api/auth/users*`).
- **Explicit 403 Forbidden Handling**: If an authenticated non-admin user attempts access, the page renders a stylized **"Permission Denied: Admins Only"** shield card rather than crashing.
- **Article Editor**: Admins create/edit/delete paywalled stories (`title>=3`, `body>=50`, Draft/Published).

### 5. Articles Feed + Paywall (`app/page.tsx`, `app/articles/[slug]/page.tsx`)
- **Route Guard**: Redirects unauthenticated users to `/login`.
- **Feed**: Titles/metadata only, lock badge when `!hasAccess`.
- **Detail**: `402` → paywall card + Subscribe CTA; else markdown body via `react-markdown`.
- **JWT & Token Refresh**: All operations use `api`/`apiRoot` from `lib/axios.ts`.

### 6. Subscribe Flow (`app/subscribe/page.tsx`, `callback/page.tsx`)
- Checkout → `window.location=paymentLink` (Flutterwave Standard, plan 243392).
- Callback verifies `transaction_id+tx_ref` server-side, refreshes status, redirects to `/`.

### 7. Subscription State (`context/SubscriptionContext.tsx`)
- Fetches `GET /payments/status` after login; exposes `hasAccess, refreshStatus()`.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18.x or higher
- Express backend running on `http://localhost:5000`

### 1. Environment Configuration
Create or edit `.env.local` in the project root:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/auth
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build
```bash
npm run build
npm run start
```
