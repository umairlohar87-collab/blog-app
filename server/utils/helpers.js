/** Error carrying an HTTP status, understood by the central error handler. */
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Strips secrets from a user row before it leaves the server. */
function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash: _omit, ...safe } = user;
  return safe;
}

/** Normalizes tags from an array or comma string into a clean, de-duplicated, lowercase array. */
function normalizeTags(input) {
  if (input == null || input === '') return [];
  const list = Array.isArray(input) ? input : String(input).split(',');
  const seen = new Set();
  for (const raw of list) {
    const tag = String(raw).trim().toLowerCase().replace(/\s+/g, '-');
    if (tag) seen.add(tag);
  }
  return [...seen];
}

/** DB stores tags as a comma string; the API exposes arrays. */
function parseTags(str) {
  return str ? str.split(',').filter(Boolean) : [];
}

/** Parses positive integer pagination params with sane bounds. */
function getPagination(query, defaultLimit = 9) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, offset: (page - 1) * limit };
}

module.exports = { HttpError, sanitizeUser, normalizeTags, parseTags, getPagination };
