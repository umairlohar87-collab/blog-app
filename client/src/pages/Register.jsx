import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import FormField from '../components/FormField'
import { validateRegister } from '../utils/validation'
import { redirectTarget } from '../utils/redirect'

export default function Register() {
  const { user, register } = useAuth()
  const { show } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
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
    const errs = validateRegister(form)
    setErrors(errs)
    setServerError('')
    if (Object.keys(errs).length) return

    setSubmitting(true)
    try {
      const u = await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      show(`Welcome to Inkwell, ${u.username}!`, 'success')
      navigate(redirectTarget(location), { replace: true })
    } catch (err) {
      // Map known server conflicts back to the right field.
      if (err.status === 409 && /email/i.test(err.message)) setErrors({ email: err.message })
      else if (err.status === 409 && /username/i.test(err.message)) setErrors({ username: err.message })
      else setServerError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="container page auth-page">
      <div className="card auth-card">
        <h1>Create your account</h1>
        <p className="muted">Join the community and start publishing.</p>

        {serverError && (
          <div className="alert alert-error" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={onSubmit} noValidate>
          <FormField
            label="Username"
            name="username"
            autoComplete="username"
            value={form.username}
            onChange={onChange}
            error={errors.username}
            hint="3–30 characters: letters, numbers, underscores"
            maxLength={30}
            autoFocus
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={onChange}
            error={errors.email}
          />
          <FormField
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={onChange}
            error={errors.password}
            hint="At least 8 characters"
          />
          <FormField
            label="Confirm password"
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={onChange}
            error={errors.confirm}
          />
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login" state={location.state}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
