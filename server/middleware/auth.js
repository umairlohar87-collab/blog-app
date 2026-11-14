const jwt = require('jsonwebtoken');
const db = require('../models/db');
const { JWT_SECRET } = require('../config');

const findUser = db.prepare('SELECT id, username, email, bio, created_at FROM users WHERE id = ?');

/** Extracts a token from `Authorization: Bearer <token>` or the `token` cookie. */
function getToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7).trim();
  return req.cookies?.token || null;
}

/** Returns the user for a valid token, or null. Never includes password_hash. */
function resolveUser(req) {
  const token = getToken(req);
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return findUser.get(payload.id) || null;
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const user = resolveUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  req.user = user;
  next();
}

function optionalAuth(req, res, next) {
  req.user = resolveUser(req);
  next();
}

module.exports = { requireAuth, optionalAuth };
