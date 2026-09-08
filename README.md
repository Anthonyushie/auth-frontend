# Next.js Authentication & Tasks Client

A production-ready client built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS**. Designed to connect securely to an Express backend using short-lived in-memory **JWT Access Tokens** and long-lived **HTTP-only cookie Refresh Tokens** with automated token rotation and request queuing.

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
│   │   └── page.tsx          # Protected Admin Dashboard (explicit 403 Forbidden handler)
│   ├── login/
│   │   └── page.tsx          # Login form with error mapping (401, 400)
│   ├── profile/
│   │   └── page.tsx          # Protected User Profile (skeleton loader, account details)
│   ├── register/
│   │   └── page.tsx          # Registration form (role selection, 409 conflict handling)
│   ├── tasks/
│   │   └── page.tsx          # Protected Tasks CRUD (optimistic updates, toggle, delete)
│   ├── globals.css           # Tailwind CSS styles
│   ├── layout.tsx            # Root layout with AuthProvider & Navbar
│   └── page.tsx              # Landing page
├── components/
│   └── Navbar.tsx            # Navigation bar with dynamic auth links
├── context/
│   └── AuthContext.tsx       # Auth context (in-memory token, user, login, register, logout)
├── lib/
│   └── axios.ts              # Custom Axios instance with request/response interceptors
├── types/
│   └── index.ts              # TypeScript interfaces (Task, User, etc.)
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
| `/api/tasks` | `GET` | Bearer Token | List tasks belonging to current user |
| `/api/tasks` | `POST` | Bearer Token | Create a new task (`title`) |
| `/api/tasks/:id` | `PUT` | Bearer Token | Update task status (`completed`) |
| `/api/tasks/:id` | `DELETE` | Bearer Token | Delete a task by ID |

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

### 4. Admin Dashboard with RBAC (`app/admin/page.tsx`)
- Targets `GET /api/auth/admin-dashboard`.
- **Explicit 403 Forbidden Handling**: If an authenticated non-admin user attempts access, the page renders a stylized **"Permission Denied: Admins Only"** shield card rather than crashing.

### 5. Protected Tasks CRUD (`app/tasks/page.tsx`)
- **Route Guard**: Automatically redirects unauthenticated users to `/login`.
- **Create**: Add tasks with instant optimistic prepend to local state.
- **Read**: Fetches tasks on mount using custom Axios client.
- **Update**: Checkbox toggle for completed/incomplete with optimistic toggle and automatic rollback if the API fails.
- **Delete**: Hover trash button with immediate removal from local state.
- **JWT & Token Refresh**: All operations transparently invoke `lib/axios.ts`, guaranteeing fresh tokens without user intervention.

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
# auth-frontend
