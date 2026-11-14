import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { getTags } from '../api/posts'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { show } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  // The mobile menu is "open for" a specific location; any navigation closes it.
  const [openFor, setOpenFor] = useState(null)
  const open = openFor === location.key
  const setOpen = (fn) => setOpenFor(fn(open) ? location.key : null)
  const [query, setQuery] = useState('')
  const [tags, setTags] = useState([])

  const activeTag = location.pathname === '/' ? searchParams.get('tag') || '' : ''

  // Refresh tags on route changes so newly created tags appear.
  useEffect(() => {
    getTags().then(setTags).catch(() => setTags([]))
  }, [location.pathname])

  function onSearch(e) {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/?search=${encodeURIComponent(q)}` : '/')
    setQuery('')
  }

  function onTagChange(e) {
    const tag = e.target.value
    navigate(tag ? `/?tag=${encodeURIComponent(tag)}` : '/')
  }

  async function onLogout() {
    await logout().catch(() => {})
    show('You have been logged out', 'info')
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="logo" aria-label="Inkwell home">
          <span className="logo-mark" aria-hidden="true">✒</span>
          <span>Inkwell</span>
        </Link>

        <button
          type="button"
          className="hamburger"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="nav-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>

        <div id="nav-menu" className={`nav-menu ${open ? 'is-open' : ''}`}>
          <form className="nav-search" role="search" onSubmit={onSearch}>
            <input
              type="search"
              className="input"
              placeholder="Search posts…"
              aria-label="Search posts"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              maxLength={100}
            />
          </form>

          <select className="input nav-tags" aria-label="Filter by tag" value={activeTag} onChange={onTagChange}>
            <option value="">All tags</option>
            {tags.map(({ tag, count }) => (
              <option key={tag} value={tag}>
                #{tag} ({count})
              </option>
            ))}
          </select>

          <nav className="nav-links" aria-label="Account">
            {user ? (
              <>
                <span className="nav-hello">
                  Hello, <Link to={`/users/${user.id}`}>{user.username}</Link>
                </span>
                <NavLink to="/dashboard" className="nav-link">
                  Dashboard
                </NavLink>
                <Link to="/editor" className="btn btn-primary btn-sm">
                  New Post
                </Link>
                <button type="button" className="btn btn-ghost btn-sm" onClick={onLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="nav-link">
                  Login
                </NavLink>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
