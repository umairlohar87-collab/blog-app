import { useEffect } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import Navbar from './Navbar'

const YEAR = new Date().getFullYear()

export default function Layout() {
  const { pathname } = useLocation()

  // Move focus to main content on route change for screen-reader users.
  useEffect(() => {
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <div className="app">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="main" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container">
          <span>© {YEAR} Inkwell</span>
          <span className="muted">Built with React, Express &amp; SQLite</span>
        </div>
      </footer>
      <ScrollRestoration />
    </div>
  )
}
