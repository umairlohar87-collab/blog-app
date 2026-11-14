const TOKEN_KEY = 'token'

/** localStorage wrapper that never throws (private mode, blocked storage). */
export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
  },
}

/** Builds a query string, skipping empty values. */
function toQuery(params) {
  if (!params) return ''
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') qs.set(key, value)
  }
  const s = qs.toString()
  return s ? `?${s}` : ''
}

/**
 * Fetch wrapper for the API.
 * Sends the bearer token (if any) and cookies; parses JSON; throws Error with `.status` on non-2xx.
 */
export async function request(path, { method = 'GET', body, params, headers = {}, signal } = {}) {
  const token = tokenStore.get()
  const init = {
    method,
    credentials: 'include',
    signal,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  }

  let res
  try {
    res = await fetch(`/api${path}${toQuery(params)}`, init)
  } catch (err) {
    if (err.name === 'AbortError') throw err
    const networkErr = new Error('Cannot reach the server. Check your connection and try again.')
    networkErr.status = 0
    throw networkErr
  }

  if (res.status === 204) return null

  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`)
    err.status = res.status
    err.details = data?.details
    throw err
  }
  return data
}
