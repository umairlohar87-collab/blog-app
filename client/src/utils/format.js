/** SQLite CURRENT_TIMESTAMP is 'YYYY-MM-DD HH:MM:SS' in UTC with no zone marker. */
export function parseDate(value) {
  if (!value) return null
  const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? `${value.replace(' ', 'T')}Z` : value
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatDate(value, opts = { year: 'numeric', month: 'short', day: 'numeric' }) {
  const d = parseDate(value)
  return d ? d.toLocaleDateString(undefined, opts) : ''
}

export function formatRelative(value) {
  const d = parseDate(value)
  if (!d) return ''
  const seconds = Math.round((d.getTime() - Date.now()) / 1000)
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}

export function readingTimeLabel(minutes) {
  return `${minutes} min read`
}

/** Mirrors the server's tag normalization. */
export function parseTagInput(input) {
  const seen = new Set()
  for (const raw of String(input).split(',')) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-')
    if (tag) seen.add(tag)
  }
  return [...seen]
}

export function isHttpUrl(value) {
  if (!value) return false
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

/** Deterministic gradient for posts without a cover image. */
export function gradientFor(seed) {
  const n = Number(seed) || String(seed).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const h1 = (n * 67) % 360
  const h2 = (h1 + 40) % 360
  return `linear-gradient(135deg, hsl(${h1} 70% 60%), hsl(${h2} 75% 45%))`
}
