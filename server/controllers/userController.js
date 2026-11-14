const db = require('../models/db');
const { HttpError, getPagination } = require('../utils/helpers');
const { queryPosts, ownerStatuses } = require('./postController');

const stmts = {
  profile: db.prepare(
    `SELECT u.id, u.username, u.bio, u.created_at,
       (SELECT COUNT(*) FROM posts p WHERE p.author_id = u.id AND p.status = 'published') AS post_count
     FROM users u WHERE u.id = ?`
  ),
};

// GET /api/users/:id
function getUser(req, res) {
  const user = stmts.profile.get(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');
  res.json(user);
}

// GET /api/users/:id/posts — drafts included only when the viewer is the author.
function getUserPosts(req, res) {
  const authorId = Number(req.params.id);
  if (!stmts.profile.get(authorId)) throw new HttpError(404, 'User not found');

  const isOwner = req.user?.id === authorId;
  const statuses = isOwner ? ownerStatuses(req.query.status) : ['published'];

  res.json(queryPosts({ authorId, statuses, ...getPagination(req.query, 9) }));
}

module.exports = { getUser, getUserPosts };
