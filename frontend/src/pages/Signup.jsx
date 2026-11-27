import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SignalMark from '../components/SignalMark'

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
        setError('Cannot connect to backend server. Make sure FastAPI (uvicorn) & MongoDB are running on http://localhost:8000.')
      } else {
        setError(err.response?.data?.detail || 'Signup failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <SignalMark />
          <span className="font-display text-lg font-semibold tracking-tight">
            Intervia
          </span>
        </div>

        <div className="rounded-lg border border-border bg-panel p-8 shadow-sm">
          <h1 className="mb-1 text-2xl font-semibold">Create your account</h1>
          <p className="mb-6 text-sm text-muted">Start practicing with questions built from your resume.</p>

          {error && (
            <div className="mb-4 rounded-sm border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-sm border border-border bg-white px-3 py-2 text-sm outline-none focus:border-signal"
                placeholder="Jordan Rivera"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-sm border border-border bg-white px-3 py-2 text-sm outline-none focus:border-signal"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-sm border border-border bg-white px-3 py-2 text-sm outline-none focus:border-signal"
                placeholder="At least 8 characters"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-sm bg-signal px-4 py-2.5 text-sm font-medium text-white transition hover:bg-signal/90 disabled:opacity-60"
            >
              {submitting ? 'Creating account…' : 'Sign up'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-signal hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
