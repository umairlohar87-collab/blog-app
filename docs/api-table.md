# API Reference

Base URL: `http://localhost:3000/api` (the Vite dev server proxies `/api` from `http://localhost:5173`).

**Conventions**

- All responses are JSON. Errors are always `{ "error": "message" }`; validation errors (400) also include `details: [{ field, message }]`.
- **Auth:** send `Authorization: Bearer <token>` **or** the httpOnly `token` cookie set by login/register.
- **Access levels:** *Public* = no auth. *Optional auth* = public, but a valid token changes what you can see (e.g. your own drafts). *Logged in* = 401 without a valid token. *Author only* = logged in and owner, else 403.
- Timestamps are UTC strings in SQLite format (`YYYY-MM-DD HH:MM:SS`).

## Shared shapes

```jsonc
// User (never includes password_hash)
{ "id": 1, "username": "alice", "email": "alice@example.com", "bio": "…", "created_at": "2026-11-14 00:00:00" }

// PostSummary (list endpoints)
{
  "id": 1, "title": "…", "excerpt": "first 200 chars…", "cover_image": "https://…" | null,
  "tags": ["react", "frontend"], "author_id": 1, "author_username": "alice",
  "status": "published", "created_at": "…", "updated_at": "…",
  "reading_time": 3, "comment_count": 2
}

// PostDetail (single post): PostSummary fields, minus excerpt, plus:
{ "content": "full text", "comments_count": 2, "comment_count": 2 }

// Paginated list
{ "posts": [PostSummary], "total": 42, "page": 1, "limit": 9, "totalPages": 5 }

// Comment
{ "id": 1, "content": "…", "created_at": "…", "post_id": 1, "author_id": 2, "author_username": "bob" }
```

## Auth: `/api/auth`

Rate limited: `/login` and `/register` share a limit of **10 requests per 15 minutes per IP** (429 after that, with `Retry-After`).

| Method | Path        | Access    | Request body                              | Success                                    | Errors                                      |
| ------ | ----------- | --------- | ----------------------------------------- | ------------------------------------------ | ------------------------------------------- |
| POST   | `/register` | Public    | `{ username, email, password }`           | **201** `{ user, token }` + sets cookie    | 400 validation · 409 username/email taken · 429 |
| POST   | `/login`    | Public    | `{ email, password }`                     | **200** `{ user, token }` + sets cookie    | 400 validation · 401 invalid credentials · 429 |
| POST   | `/logout`   | Logged in¹ | —                                        | **200** `{ message }` + clears cookie      | —                                           |
| GET    | `/me`       | Logged in | —                                         | **200** `{ user }`                         | 401                                         |

¹ Logout always succeeds and clears the cookie, even if the token has already expired.

Validation: `username` 3–30 chars, letters/numbers/underscore · `email` valid (lowercased) · `password` 8–72 chars.

## Posts: `/api/posts`

| Method | Path    | Access        | Request                                                                 | Success                       | Errors                       |
| ------ | ------- | ------------- | ----------------------------------------------------------------------- | ----------------------------- | ---------------------------- |
| GET    | `/`     | Optional auth | Query: `page`=1, `limit`=9 (max 50), `search`, `tag`, `author`, `status` | **200** Paginated list        | 400 bad query · 401²         |
| GET    | `/tags` | Public        | —                                                                       | **200** `[{ tag, count }]` (published posts, by count desc) | — |
| GET    | `/:id`  | Optional auth | —                                                                       | **200** PostDetail            | 400 bad id · 403 draft (not author) · 404 |
| POST   | `/`     | Logged in     | `{ title, content, cover_image?, tags?, status? }`                       | **201** PostDetail            | 400 · 401                    |
| PUT    | `/:id`  | Author only   | `{ title, content, cover_image?, tags?, status? }` (full replace)       | **200** PostDetail (bumps `updated_at`) | 400 · 401 · 403 · 404 |
| DELETE | `/:id`  | Author only   | —                                                                       | **204**                       | 401 · 403 · 404              |

**List query semantics**

- `search`: case-insensitive substring match on title **or** content (`%` and `_` are matched literally).
- `tag`: exact tag match (lowercase).
- `author=<id>`: that user's **published** posts.
- `author=me`: **the authenticated user's own posts** (² 401 if not logged in). Only here does `status` apply: `all` (default) | `published` | `draft`. **This is what the Dashboard uses.**
- Without `author=me`, `status` is ignored and only published posts are returned. Drafts never appear in public listings.

**Body validation:** `title` 3–150 · `content` ≥ 10 non-space chars (max 50,000) · `cover_image` empty or an `http(s)://` URL · `tags` array or comma string, max 5, each `[a-z0-9-]` ≤ 30 chars (normalized: trimmed, lowercased, spaces become dashes, de-duplicated) · `status` ∈ `draft`, `published` (default `published`).

## Comments: `/api`

| Method | Path                  | Access                          | Request                    | Success              | Errors                               |
| ------ | --------------------- | ------------------------------- | -------------------------- | -------------------- | ------------------------------------ |
| GET    | `/posts/:id/comments` | Public (optional auth)          | —                          | **200** `[Comment]` (oldest first) | 403 draft (not author) · 404 post |
| POST   | `/posts/:id/comments` | Logged in                       | `{ content }` (1–1000 chars) | **201** Comment    | 400 · 401 · 403 draft · 404 post     |
| DELETE | `/comments/:id`       | Comment author **or** post author | —                        | **204**              | 401 · 403 · 404                      |

## Users: `/api/users`

| Method | Path         | Access        | Request                                        | Success                                                    | Errors   |
| ------ | ------------ | ------------- | ---------------------------------------------- | ---------------------------------------------------------- | -------- |
| GET    | `/:id`       | Public        | —                                              | **200** `{ id, username, bio, created_at, post_count }` (published count; no email) | 400 · 404 |
| GET    | `/:id/posts` | Optional auth | Query: `page`, `limit`, `status` (owner only)  | **200** Paginated list. The owner sees drafts too; everyone else sees published only. | 400 · 404 |

## Misc

| Method | Path          | Access | Success                  |
| ------ | ------------- | ------ | ------------------------ |
| GET    | `/api/health` | Public | **200** `{ status: "ok" }` |
| *      | unknown       | —      | **404** `{ error: "Route not found: …" }` |

**Status codes used:** 200 OK · 201 Created · 204 No Content · 400 validation / bad JSON · 401 unauthenticated · 403 forbidden (ownership or draft) · 404 not found · 409 conflict · 413 body > 100kb · 429 rate limited · 500 server error (message hidden in production).
