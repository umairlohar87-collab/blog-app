const db = require('../models/db');
const readingTime = require('../utils/readingTime');
const { HttpError, normalizeTags, parseTags, getPagination } = require('../utils/helpers');

const EXCERPT_LENGTH = 200;

const POST_COLUMNS = `
  p.id, p.title, p.content, p.cover_image, p.tags, p.author_id, p.status, p.created_at, p.updated_at,
  u.username AS author_username,
  (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
`;

const stmts = {
  byId: db.prepare(`SELECT ${POST_COLUMNS} FROM posts p JOIN users u ON u.id = p.author_id WHERE p.id = ?`),
  ownerOf: db.prepare('SELECT id, author_id FROM posts WHERE id = ?'),
  insert: db.prepare(
    `INSERT INTO posts (title, content, cover_image, tags, author_id, status)
     VALUES (@title, @content, @cover_image, @tags, @author_id, @status)`
  ),
  update: db.prepare(
    `UPDATE posts SET title = @title, content = @content, cover_image = @cover_image,
       tags = @tags, status = @status, updated_at = CURRENT_TIMESTAMP
     WHERE id = @id`
  ),
  remove: db.prepare('DELETE FROM posts WHERE id = ?'),
  publishedTags: db.prepare("SELECT tags FROM posts WHERE status = 'published' AND tags <> ''"),
};

function excerpt(text) {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > EXCERPT_LENGTH ? `${flat.slice(0, EXCERPT_LENGTH).trimEnd()}…` : flat;
}

/** Shape used by list endpoints (no full content). */
function toSummary(row) {
  return {
    id: row.id,
    title: row.title,
    excerpt: excerpt(row.content),
    cover_image: row.cover_image || null,
    tags: parseTags(row.tags),
    author_id: row.author_id,
    author_username: row.author_username,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    reading_time: readingTime(row.content),
    comment_count: row.comment_count,
  };
}

/** Shape used by the single-post endpoint. */
function toDetail(row) {
  const { comment_count, ...rest } = row;
  return {
    ...rest,
    cover_image: row.cover_image || null,
    tags: parseTags(row.tags),
    reading_time: readingTime(row.content),
    comments_count: comment_count,
    comment_count,
  };
}

const escapeLike = (s) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/**
 * Shared paginated post query.
 * @param {{authorId?: number, statuses: string[], search?: string, tag?: string, page: number, limit: number, offset: number}} opts
 */
function queryPosts({ authorId, statuses, search, tag, page, limit, offset }) {
  const where = [`p.status IN (${statuses.map(() => '?').join(',')})`];
  const params = [...statuses];

  if (authorId != null) {
    where.push('p.author_id = ?');
    params.push(authorId);
  }
  if (search) {
    const like = `%${escapeLike(search)}%`;
    where.push("(p.title LIKE ? ESCAPE '\\' OR p.content LIKE ? ESCAPE '\\')");
    params.push(like, like);
  }
  if (tag) {
    where.push("(',' || p.tags || ',') LIKE ? ESCAPE '\\'");
    params.push(`%,${escapeLike(tag)},%`);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const total = db
    .prepare(`SELECT COUNT(*) AS n FROM posts p ${whereSql}`)
    .get(...params).n;
  const rows = db
    .prepare(
      `SELECT ${POST_COLUMNS} FROM posts p JOIN users u ON u.id = p.author_id
       ${whereSql} ORDER BY p.created_at DESC, p.id DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset);

  return {
    posts: rows.map(toSummary),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/** Maps a `status` query value to allowed statuses for an owner view. */
function ownerStatuses(status) {
  if (status === 'draft') return ['draft'];
  if (status === 'published') return ['published'];
  return ['draft', 'published']; // 'all' or missing
}

// GET /api/posts
function listPosts(req, res) {
  const { search, tag, author, status } = req.query;
  const pagination = getPagination(req.query, 9);

  let authorId;
  let statuses = ['published'];

  if (author === 'me') {
    if (!req.user) throw new HttpError(401, 'Authentication required');
    authorId = req.user.id;
    statuses = ownerStatuses(status);
  } else if (author) {
    authorId = Number(author);
  }

  res.json(
    queryPosts({
      authorId,
      statuses,
      search: search?.trim() || undefined,
      tag: tag?.trim().toLowerCase() || undefined,
      ...pagination,
    })
  );
}

// GET /api/posts/tags
function listTags(req, res) {
  const counts = new Map();
  for (const { tags } of stmts.publishedTags.all()) {
    for (const t of parseTags(tags)) counts.set(t, (counts.get(t) || 0) + 1);
  }
  const result = [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  res.json(result);
}

// GET /api/posts/:id
function getPost(req, res) {
  const row = stmts.byId.get(req.params.id);
  if (!row) throw new HttpError(404, 'Post not found');
  if (row.status === 'draft' && row.author_id !== req.user?.id) {
    throw new HttpError(403, 'This post is a draft and is only visible to its author');
  }
  res.json(toDetail(row));
}

function postFields(body) {
  return {
    title: body.title.trim(),
    content: body.content,
    cover_image: body.cover_image?.trim() || null,
    tags: normalizeTags(body.tags).join(','),
    status: body.status || 'published',
  };
}

// POST /api/posts
function createPost(req, res) {
  const id = stmts.insert.run({ ...postFields(req.body), author_id: req.user.id }).lastInsertRowid;
  res.status(201).json(toDetail(stmts.byId.get(id)));
}

/** Loads a post and asserts the current user owns it. */
function assertOwner(id, user) {
  const post = stmts.ownerOf.get(id);
  if (!post) throw new HttpError(404, 'Post not found');
  if (post.author_id !== user.id) throw new HttpError(403, 'You can only modify your own posts');
  return post;
}

// PUT /api/posts/:id
function updatePost(req, res) {
  assertOwner(req.params.id, req.user);
  stmts.update.run({ ...postFields(req.body), id: req.params.id });
  res.json(toDetail(stmts.byId.get(req.params.id)));
}

// DELETE /api/posts/:id
function deletePost(req, res) {
  assertOwner(req.params.id, req.user);
  stmts.remove.run(req.params.id);
  res.status(204).end();
}

module.exports = {
  listPosts,
  listTags,
  getPost,
  createPost,
  updatePost,
  deletePost,
  queryPosts,
  ownerStatuses,
};
