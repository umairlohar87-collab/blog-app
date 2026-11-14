const db = require('../models/db');
const { HttpError } = require('../utils/helpers');

const COMMENT_COLUMNS = `c.id, c.content, c.created_at, c.post_id, c.author_id, u.username AS author_username`;

const stmts = {
  post: db.prepare('SELECT id, author_id, status FROM posts WHERE id = ?'),
  list: db.prepare(
    `SELECT ${COMMENT_COLUMNS} FROM comments c JOIN users u ON u.id = c.author_id
     WHERE c.post_id = ? ORDER BY c.created_at ASC, c.id ASC`
  ),
  byId: db.prepare(`SELECT ${COMMENT_COLUMNS} FROM comments c JOIN users u ON u.id = c.author_id WHERE c.id = ?`),
  withPostAuthor: db.prepare(
    `SELECT c.id, c.author_id, p.author_id AS post_author_id
     FROM comments c JOIN posts p ON p.id = c.post_id WHERE c.id = ?`
  ),
  insert: db.prepare('INSERT INTO comments (post_id, author_id, content) VALUES (?, ?, ?)'),
  remove: db.prepare('DELETE FROM comments WHERE id = ?'),
};

/** Loads a post the viewer may see; drafts are only visible to their author. */
function visiblePost(id, user) {
  const post = stmts.post.get(id);
  if (!post) throw new HttpError(404, 'Post not found');
  if (post.status === 'draft' && post.author_id !== user?.id) {
    throw new HttpError(403, 'This post is a draft and is only visible to its author');
  }
  return post;
}

// GET /api/posts/:id/comments
function listComments(req, res) {
  visiblePost(req.params.id, req.user);
  res.json(stmts.list.all(req.params.id));
}

// POST /api/posts/:id/comments
function createComment(req, res) {
  visiblePost(req.params.id, req.user);
  const id = stmts.insert.run(req.params.id, req.user.id, req.body.content.trim()).lastInsertRowid;
  res.status(201).json(stmts.byId.get(id));
}

// DELETE /api/comments/:id
function deleteComment(req, res) {
  const comment = stmts.withPostAuthor.get(req.params.id);
  if (!comment) throw new HttpError(404, 'Comment not found');
  if (comment.author_id !== req.user.id && comment.post_author_id !== req.user.id) {
    throw new HttpError(403, 'You can only delete your own comments or comments on your posts');
  }
  stmts.remove.run(req.params.id);
  res.status(204).end();
}

module.exports = { listComments, createComment, deleteComment };
