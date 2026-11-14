import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container page">
      <div className="state-box not-found">
        <div className="not-found-code" aria-hidden="true">
          404
        </div>
        <h1 className="state-title">Page not found</h1>
        <p className="state-message">The page you are looking for does not exist or may have been removed.</p>
        <div className="state-action">
          <Link to="/" className="btn btn-primary">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
