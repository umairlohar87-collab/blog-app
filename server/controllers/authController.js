const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const { JWT_SECRET, JWT_EXPIRES_IN, IS_PROD } = require('../config');
const { HttpError, sanitizeUser } = require('../utils/helpers');

const SALT_ROUNDS = 10;
// Real hash of a random value, compared against when an email is unknown (constant-ish timing).
const DUMMY_HASH = bcrypt.hashSync(require('crypto').randomBytes(16).toString('hex'), SALT_ROUNDS);

const stmts = {
  byEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  byUsername: db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE'),
  byId: db.prepare('SELECT * FROM users WHERE id = ?'),
  insert: db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'),
};

function issueToken(res, user) {
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const { exp } = jwt.decode(token);
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    maxAge: exp * 1000 - Date.now(),
    path: '/',
  });
  return token;
}

async function register(req, res) {
  const { username, email, password } = req.body;

  if (stmts.byEmail.get(email)) throw new HttpError(409, 'Email already taken');
  if (stmts.byUsername.get(username)) throw new HttpError(409, 'Username already taken');

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  let id;
  try {
    id = stmts.insert.run(username, email, hash).lastInsertRowid;
  } catch (err) {
    // Race between the check above and the insert.
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') throw new HttpError(409, 'Username or email already taken');
    throw err;
  }

  const user = sanitizeUser(stmts.byId.get(id));
  const token = issueToken(res, user);
  res.status(201).json({ user, token });
}

async function login(req, res) {
  const { email, password } = req.body;
  const row = stmts.byEmail.get(email);
  // Compare even when the user is missing so response timing does not reveal which emails exist.
  const ok = await bcrypt.compare(password, row?.password_hash || DUMMY_HASH);
  if (!row || !ok) throw new HttpError(401, 'Invalid email or password');

  const user = sanitizeUser(row);
  const token = issueToken(res, user);
  res.json({ user, token });
}

function logout(req, res) {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: IS_PROD, path: '/' });
  res.json({ message: 'Logged out' });
}

function me(req, res) {
  res.json({ user: sanitizeUser(req.user) });
}

module.exports = { register, login, logout, me };
