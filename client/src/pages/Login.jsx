import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import FormField from '../components/FormField'
import { validateLogin } from '../utils/validation'
import { redirectTarget } from '../utils/redirect'

export default function Login() {
  const { user, login } = useAuth()
  const { show } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user && !submitting) return <Navigate to={redirectTarget(location)} replace />

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    const errs = validateLogin(form)
    setErrors(errs)
    setServerError('')
    if (Object.keys(errs).length) return

    setSubmitting(true)
    try {
      const u = await login(form.email.trim(), form.password)
      show(`Welcome back, ${u.username}!`, 'success')
      navigate(redirectTarget(location), { replace: true })
    } catch (err) {
      setServerError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="container page auth-page">
      <div className="card auth-card">
        <h1>Welcome back</h1>
        <p className="muted">Log in to write, comment, and manage your posts.</p>

        {serverError && (
          <div className="alert alert-error" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={onSubmit} noValidate>
          <FormField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={onChange}
            error={errors.email}
            autoFocus
          />
          <FormField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={onChange}
            error={errors.password}
          />
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="auth-switch">
          New here?{' '}
          <Link to="/register" state={location.state}>
            Create an account
          </Link>
        </p>
        <p className="auth-demo muted">
          Demo: <code>alice@example.com</code> / <code>password123</code>
        </p>
      </div>
    </div>
  )
}
