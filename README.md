# Inkwell: Full-Stack Blog

Inkwell is a full-stack blogging platform built with a **React + Vite** single-page app and an **Express + SQLite** REST API. Authors can register, write posts with a live preview, save drafts or publish, tag and search content, and discuss posts in comments. Ownership rules are enforced on the server. The UI is responsive and handles loading, empty, and error states throughout.

## Features

- **Authentication:** register, log in, and log out with JWTs, delivered as an httpOnly cookie *and* a Bearer token
- **Posts:** create, read, update, and delete, with title, plain-text content, cover image URL, and up to 5 tags
- **Draft / published status:** drafts are visible only to their author
- **Search, tag filter, and pagination:** the URL is the source of truth (`/?search=react&tag=frontend&page=2`)
- **Comments:** comment authors and post authors can delete comments
- **Author dashboard:** All / Published / Drafts tabs, with edit and delete actions
- **Editor:** side-by-side live preview on desktop, tabbed on mobile; guards against leaving with unsaved changes
- **Profile pages:** bio, join date, post count, and the user's posts
- **UX polish:** skeleton loaders, empty and error states with retry, accessible confirm dialogs (focus trap, Esc to close), toasts, mobile hamburger menu, dark mode via `prefers-color-scheme`
- **Security:** bcrypt, input validation on every route, parameterized SQL, rate limiting, helmet, CORS allowlist, XSS-safe rendering

## Tech Stack

| Layer    | Tech |
| -------- | ---- |
| Frontend | React 19, React Router 7 (data router), Vite, plain CSS with custom properties, `fetch` |
| Backend  | Node.js, Express 5, better-sqlite3, express-validator, jsonwebtoken, bcrypt |
| Security | helmet, cors, cookie-parser, custom in-memory rate limiter |
| Tooling  | concurrently, nodemon, oxlint |

## Screenshots

Put screenshots in [`docs/screenshots/`](docs/screenshots/) and reference them here, for example:

```md
![Home](docs/screenshots/home.png)
![Post](docs/screenshots/post.png)
![Editor](docs/screenshots/editor.png)
```

## Getting Started

### Prerequisites

- **Node.js 20+** (developed on Node 24) and npm
- A C/C++ build toolchain is only needed if prebuilt binaries for `better-sqlite3` or `bcrypt` are unavailable for your platform

### Setup

```bash
npm run install:all        # installs root, server, and client dependencies
cp .env.example .env       # then set JWT_SECRET to a long random string
npm run seed               # creates demo users and posts (safe to re-run)
npm run dev                # API on :3000, web app on :5173
```

Open **http://localhost:5173**.

### Demo credentials

| User  | Email               | Password      |
| ----- | ------------------- | ------------- |
| alice | `alice@example.com` | `password123` |
| bob   | `bob@example.com`   | `password123` |

Alice has one draft ("Thoughts on State Management") that only she can see.

### Environment variables

| Variable         | Default                 | Description |
| ---------------- | ----------------------- | ----------- |
| `PORT`           | `3000`                  | API port |
| `JWT_SECRET`     | *(required in prod)*    | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | `7d`                    | Token and cookie lifetime |
| `DB_PATH`        | `./db/blog.db`          | SQLite file, resolved relative to `server/` |
| `CLIENT_URL`     | `http://localhost:5173` | Allowed CORS origin |
| `NODE_ENV`       | `development`           | `production` enables secure cookies, hides 500 error details, and disables request logging |

The server reads `.env` from the project root (and falls back to `server/.env`).

### Scripts (root)

| Script                | What it does |
| --------------------- | ------------ |
| `npm run dev`         | Runs the API (nodemon) and Vite together via concurrently |
| `npm run install:all` | Installs dependencies for root, server, and client |
| `npm run seed`        | Seeds demo data; skips if any users exist |
| `npm run build`       | Production build of the client into `client/dist` |
| `npm start`           | Starts the API without nodemon |

To reset the database, stop the server, delete `server/db/blog.db*`, and run `npm run seed` again.

## Project Structure

```text
blog-app/
├── server/
│   ├── index.js                 # Express app: security middleware, routes, error handling
│   ├── config.js                # Loads .env and exposes typed config
│   ├── routes/                  # auth, posts, comments, users routers
│   ├── controllers/             # Request handlers (business logic + SQL)
│   ├── models/
│   │   ├── db.js                # Opens SQLite, enables foreign keys, applies schema
│   │   └── schema.sql
│   ├── middleware/
│   │   ├── auth.js              # requireAuth / optionalAuth (Bearer or cookie)
│   │   ├── rules.js             # express-validator chains
│   │   ├── validate.js          # Turns validation results into 400 { error }
│   │   ├── rateLimit.js         # In-memory limiter for auth routes
│   │   └── errorHandler.js      # 404 + centralized error handler
│   └── utils/                   # asyncHandler, readingTime, helpers (sanitizeUser, tags), seed
├── client/
│   ├── vite.config.js           # Proxies /api to :3000
│   └── src/
│       ├── App.jsx              # Router + providers
│       ├── api/                 # fetch wrapper + endpoint helpers
│       ├── context/             # AuthContext, ToastContext
│       ├── components/          # Layout, Navbar, PostCard, ConfirmDialog, Toast, …
│       ├── pages/               # Home, PostView, Login, Register, Dashboard, Editor, Profile, NotFound
│       ├── hooks/               # useToast, useDebounce, useAsync
│       ├── utils/               # date/tag formatting, client validation, redirects
│       └── styles/              # variables.css (tokens + dark mode), index.css
├── docs/                        # database-diagram.md, api-table.md, screenshots/
├── .env.example
└── package.json                 # Root scripts (concurrently)
```

## Database

See **[docs/database-diagram.md](docs/database-diagram.md)** for the full diagram and column reference.

```text
users 1───N posts 1───N comments
  1                        N
  └────────────────────────┘   (comments.author_id → users.id)
```

Three tables: `users`, `posts` (with a `status` of `draft` or `published` and comma-separated `tags`), and `comments`. All foreign keys cascade on delete.

## API Reference

See **[docs/api-table.md](docs/api-table.md)** for every endpoint with its body, query parameters, response shapes, and status codes.

| Method | Path                       | Access |
| ------ | -------------------------- | ------ |
| POST   | /api/auth/register         | Public |
| POST   | /api/auth/login            | Public |
| POST   | /api/auth/logout           | Logged in |
| GET    | /api/auth/me               | Logged in |
| GET    | /api/posts                 | Public (optional auth) |
| GET    | /api/posts/tags            | Public |
| GET    | /api/posts/:id             | Public (optional auth; drafts author-only) |
| POST   | /api/posts                 | Logged in |
| PUT    | /api/posts/:id             | Author only |
| DELETE | /api/posts/:id             | Author only |
| GET    | /api/posts/:id/comments    | Public |
| POST   | /api/posts/:id/comments    | Logged in |
| DELETE | /api/comments/:id          | Comment author or post author |
| GET    | /api/users/:id             | Public |
| GET    | /api/users/:id/posts       | Public (optional auth; owner sees drafts) |

**Dashboard data source:** the dashboard calls `GET /api/posts?author=me&status=all|published|draft`. The server scopes `author=me` to the authenticated user, and only that query can return drafts.

## Security

| Check | How it's handled |
| ----- | ---------------- |
| Password storage | bcrypt with 10 rounds. `password_hash` is stripped by `sanitizeUser` and never selected by auth middleware |
| JWT | Secret from env, expiry from `JWT_EXPIRES_IN`, httpOnly + `SameSite=Lax` cookie (`Secure` in production) |
| Input validation | express-validator on every route that takes input (body, params, query) |
| SQL injection | All queries are better-sqlite3 prepared statements with bound parameters. Dynamic `WHERE` clauses only add fixed SQL fragments |
| Ownership | PUT/DELETE on posts check `author_id`. Comment delete allows the comment author or post author. Otherwise 403 |
| Draft privacy | Drafts are excluded from all public lists. `GET /posts/:id` and its comments return 403 to non-authors |
| XSS | Post and comment content render as React text nodes (`white-space: pre-wrap`). No `dangerouslySetInnerHTML` anywhere. Cover images must be `http(s)` URLs |
| Rate limiting | 10 requests / 15 min / IP on login and register |
| Headers & transport | `helmet()`, CORS allowlisted to `CLIENT_URL` with credentials, 100kb JSON body limit |
| Secrets | `.env` is gitignored. `.env.example` contains only placeholders |
| User enumeration | Login returns the same message for unknown email and wrong password, and runs bcrypt in both cases |

### Security self-test

Run these with the app running (`npm run dev`) on a freshly seeded database.

**1. Cross-user edit is rejected (expect 403)**

```bash
# Log in as alice (user A)
TOKEN_A=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0)).token")

# Post 2 belongs to bob (user B). Try to overwrite it as alice:
curl -i -X PUT http://localhost:3000/api/posts/2 \
  -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
  -d '{"title":"Hacked","content":"alice was here, sorry bob"}'
# → HTTP/1.1 403 Forbidden   {"error":"You can only modify your own posts"}

curl -i -X DELETE http://localhost:3000/api/posts/2 -H "Authorization: Bearer $TOKEN_A"
# → 403
```

**2. Script injection renders as text**

1. Log in in the browser and open any post.
2. Submit the comment `<script>alert(1)</script>`.
3. The comment shows the literal text `<script>alert(1)</script>`. No alert fires, and the page source has no injected `<script>` element.

**3. Drafts stay private**

```bash
curl -i http://localhost:3000/api/posts/5            # alice's draft, anonymous → 403
curl -s "http://localhost:3000/api/posts?status=draft" # public list ignores status → only published posts
```

**4. More checks**

```bash
# No password hash in any response
curl -s http://localhost:3000/api/auth/me -H "Authorization: Bearer $TOKEN_A" | grep -c password_hash   # → 0

# Malicious cover image is rejected
curl -s -X POST http://localhost:3000/api/posts -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"title":"XSS","content":"0123456789 test","cover_image":"javascript:alert(1)"}'
# → 400 {"error":"Cover image must be an http(s) URL", …}

# Rate limit: the 11th auth attempt within 15 minutes returns 429
for i in $(seq 1 11); do curl -s -o /dev/null -w "%{http_code} " -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" -d '{"email":"x@example.com","password":"wrongpass1"}'; done
```

## Testing Endpoints (curl)

```bash
API=http://localhost:3000/api

# Register (returns token, sets cookie)
curl -s -X POST $API/auth/register -H "Content-Type: application/json" \
  -d '{"username":"carol","email":"carol@example.com","password":"password123"}'

# Log in with a cookie jar, then use the cookie instead of a header
curl -s -c jar.txt -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"email":"bob@example.com","password":"password123"}'
curl -s -b jar.txt $API/auth/me

# List, search, filter, and paginate
curl -s "$API/posts?page=1&limit=5"
curl -s "$API/posts?search=sqlite"
curl -s "$API/posts?tag=react"
curl -s "$API/posts/tags"

# Your own posts, including drafts (dashboard)
curl -s -b jar.txt "$API/posts?author=me&status=draft"

# Create, update, and delete a post
curl -s -b jar.txt -X POST $API/posts -H "Content-Type: application/json" \
  -d '{"title":"Hello world","content":"My first post on Inkwell!","tags":["intro","meta"],"status":"draft"}'
curl -s -b jar.txt -X PUT $API/posts/6 -H "Content-Type: application/json" \
  -d '{"title":"Hello world","content":"Now published.","tags":"intro","status":"published"}'
curl -s -b jar.txt -X DELETE $API/posts/6 -o /dev/null -w "%{http_code}\n"   # 204

# Comments
curl -s $API/posts/1/comments
curl -s -b jar.txt -X POST $API/posts/1/comments -H "Content-Type: application/json" -d '{"content":"Nice post!"}'
curl -s -b jar.txt -X DELETE $API/comments/4 -o /dev/null -w "%{http_code}\n"

# Profiles
curl -s $API/users/1
curl -s "$API/users/1/posts?page=1"

# Log out
curl -s -b jar.txt -c jar.txt -X POST $API/auth/logout
```

## What Was NOT Implemented

These are out of scope for this version:

- Likes, bookmarks, and follows
- Image upload (cover images are URLs only)
- Markdown or rich-text rendering (content is plain text with preserved line breaks, which keeps XSS risk at zero)
- Editing comments, nested replies
- Editing your profile or bio from the UI (bio is seeded; there is no update endpoint)
- Password reset, email verification, and refresh tokens / token revocation
- Distributed rate limiting (the limiter is in-memory and per process)
- Automated test suite (the API was verified with a curl smoke-test script; see the security self-test above)
- Server-side rendering and SEO metadata per post

## License

MIT
