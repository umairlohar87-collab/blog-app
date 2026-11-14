# Database Diagram

SQLite, opened with `PRAGMA foreign_keys = ON` and WAL journaling. Schema source: [`server/models/schema.sql`](../server/models/schema.sql).

## Relationships

```text
┌──────────────────────────┐
│          users           │
├──────────────────────────┤
│ PK id                    │
│    username  (UNIQUE)    │
│    email     (UNIQUE)    │
│    password_hash         │
│    bio                   │
│    created_at            │
└───────┬──────────┬───────┘
        │ 1        │ 1
        │          │
        │ N        │ N
┌───────▼──────────┴───────┐        ┌──────────────────────────┐
│          posts           │        │         comments         │
├──────────────────────────┤        ├──────────────────────────┤
│ PK id                    │ 1    N │ PK id                    │
│    title                 ├───────►│ FK post_id   → posts.id  │
│    content               │        │ FK author_id → users.id  │
│    cover_image           │        │    content               │
│    tags  ("a,b,c")       │        │    created_at            │
│ FK author_id → users.id  │        └──────────────────────────┘
│    status (draft|published)
│    created_at            │
│    updated_at            │
└──────────────────────────┘
```

- A **user** writes many **posts** (`posts.author_id`).
- A **user** writes many **comments** (`comments.author_id`).
- A **post** has many **comments** (`comments.post_id`).
- All foreign keys use `ON DELETE CASCADE`: deleting a post deletes its comments; deleting a user deletes their posts and comments.

## Tables

### users

| Column        | Type     | Constraints                         | Notes                                 |
| ------------- | -------- | ----------------------------------- | ------------------------------------- |
| id            | INTEGER  | PRIMARY KEY AUTOINCREMENT           |                                       |
| username      | TEXT     | UNIQUE, NOT NULL                    | 3–30 chars, `[A-Za-z0-9_]`            |
| email         | TEXT     | UNIQUE, NOT NULL                    | Stored lowercase                      |
| password_hash | TEXT     | NOT NULL                            | bcrypt, 10 rounds. Never returned.    |
| bio           | TEXT     | DEFAULT `''`                        |                                       |
| created_at    | DATETIME | DEFAULT CURRENT_TIMESTAMP           | UTC                                   |

### posts

| Column      | Type     | Constraints                                         | Notes                                   |
| ----------- | -------- | --------------------------------------------------- | --------------------------------------- |
| id          | INTEGER  | PRIMARY KEY AUTOINCREMENT                           |                                         |
| title       | TEXT     | NOT NULL                                            | 3–150 chars                             |
| content     | TEXT     | NOT NULL                                            | Plain text, ≥ 10 chars                  |
| cover_image | TEXT     |                                                     | `http(s)` URL or NULL                   |
| tags        | TEXT     | DEFAULT `''`                                        | Comma-separated, lowercase, max 5       |
| author_id   | INTEGER  | NOT NULL, FK → users(id) ON DELETE CASCADE          |                                         |
| status      | TEXT     | NOT NULL DEFAULT `'published'`, CHECK draft/published | Drafts visible only to the author     |
| created_at  | DATETIME | DEFAULT CURRENT_TIMESTAMP                           | UTC                                     |
| updated_at  | DATETIME | DEFAULT CURRENT_TIMESTAMP                           | Bumped on every PUT                     |

### comments

| Column     | Type     | Constraints                                | Notes        |
| ---------- | -------- | ------------------------------------------ | ------------ |
| id         | INTEGER  | PRIMARY KEY AUTOINCREMENT                  |              |
| post_id    | INTEGER  | NOT NULL, FK → posts(id) ON DELETE CASCADE |              |
| author_id  | INTEGER  | NOT NULL, FK → users(id) ON DELETE CASCADE |              |
| content    | TEXT     | NOT NULL                                   | 1–1000 chars |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP                  | UTC          |

## Indexes

| Index              | Table    | Column(s) | Used by                                   |
| ------------------ | -------- | --------- | ----------------------------------------- |
| idx_posts_author   | posts    | author_id | Dashboard, profile pages                  |
| idx_posts_status   | posts    | status    | Public listing (published only)           |
| idx_posts_title    | posts    | title     | Title lookups / sorting                   |
| idx_comments_post  | comments | post_id   | Comment lists and per-post comment counts |

> **Design note:** tags are stored denormalized as a comma string to keep the schema small, as specified. Tag filtering matches `',' || tags || ','` against `%,tag,%`. A `post_tags` join table would be the next step if tags need their own metadata or heavy querying.
