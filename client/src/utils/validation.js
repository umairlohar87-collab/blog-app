// Client-side rules mirroring server/middleware/rules.js.
import { isHttpUrl, parseTagInput } from './format'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_RE = /^[A-Za-z0-9_]+$/
const TAG_RE = /^[a-z0-9-]+$/

export function validateLogin({ email, password }) {
  const errors = {}
  if (!email.trim()) errors.email = 'Email is required'
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Please enter a valid email address'
  if (!password) errors.password = 'Password is required'
  return errors
}

export function validateRegister({ username, email, password, confirm }) {
  const errors = {}
  const u = username.trim()
  if (!u) errors.username = 'Username is required'
  else if (u.length < 3 || u.length > 30) errors.username = 'Username must be 3–30 characters'
  else if (!USERNAME_RE.test(u)) errors.username = 'Username may only contain letters, numbers, and underscores'

  if (!email.trim()) errors.email = 'Email is required'
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Please enter a valid email address'

  if (!password) errors.password = 'Password is required'
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters'
  else if (password.length > 72) errors.password = 'Password must be at most 72 characters'

  if (confirm !== password) errors.confirm = 'Passwords do not match'
  return errors
}

export function validatePost({ title, content, cover_image, tags }) {
  const errors = {}
  const t = title.trim()
  if (t.length < 3) errors.title = 'Title must be at least 3 characters'
  else if (t.length > 150) errors.title = 'Title must be at most 150 characters'

  if (content.trim().length < 10) errors.content = 'Content must be at least 10 characters'

  if (cover_image.trim() && !isHttpUrl(cover_image.trim())) {
    errors.cover_image = 'Cover image must be a valid http(s) URL'
  }

  const list = parseTagInput(tags)
  if (list.length > 5) errors.tags = 'A post can have at most 5 tags'
  else if (list.some((tag) => tag.length > 30 || !TAG_RE.test(tag))) {
    errors.tags = 'Tags may only contain letters, numbers, and dashes (max 30 chars each)'
  }
  return errors
}
