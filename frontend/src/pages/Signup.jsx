import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'
import { FormField, PasswordField } from '../components/FormField'

function ErrorIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true">
      <circle cx="8" cy="8" r="7.25" stroke="currentColor" strokeWidth="1.25" />
      <path d="M8 4.75v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="11" r="0.9" fill="currentColor" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signup(name, email, password)
      navigate('/dashboard')
    } catch (err) {
      if (!err.response) {
        setError(
          'Cannot connect to backend server. Make sure FastAPI (uvicorn) & MongoDB are running on http://localhost:8000.'
        )
      } else {
        setError(err.response?.data?.detail || 'Signup failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start practicing with questions built from your resume."
    >
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm sm:p-7">
        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-md border border-bad/25 bg-bad/5 px-3.5 py-2.5 text-[13px] leading-snug text-bad">
            <ErrorIcon />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            id="name"
            label="Name"
            type="text"
            icon="user"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jordan Rivera"
          />
          <FormField
            id="email"
            label="Email"
            type="email"
            icon="mail"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <PasswordField
            id="password"
            label="Password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-md bg-signal px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-signal/90 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (
              <ArrowIcon />
            )}
            {submitting ? 'Creating account' : 'Sign up'}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-signal hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}