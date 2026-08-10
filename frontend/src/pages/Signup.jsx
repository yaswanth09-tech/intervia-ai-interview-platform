import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoginAuthLayout from '../components/LoginAuthLayout'

/* ---------- icons, scoped to this page's dark theme ---------- */

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

function UserIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5" aria-hidden="true">
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3.75 16c.9-3 3.35-4.75 6.25-4.75S15.35 13 16.25 16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5" aria-hidden="true">
      <rect x="2.5" y="4.5" width="15" height="11" rx="1.75" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3.5 5.5 10 10.75l6.5-5.25" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5" aria-hidden="true">
      <rect x="4" y="8.75" width="12" height="8" rx="1.75" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6.5 8.75V6.5a3.5 3.5 0 0 1 7 0v2.25" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function EyeIcon({ off }) {
  return off ? (
    <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5" aria-hidden="true">
      <path d="M2.5 10S5.5 4.5 10 4.5 17.5 10 17.5 10 14.5 15.5 10 15.5 2.5 10 2.5 10Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 3l14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5" aria-hidden="true">
      <path d="M2.5 10S5.5 4.5 10 4.5 17.5 10 17.5 10 14.5 15.5 10 15.5 2.5 10 2.5 10Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

/* ---------- dark-themed field primitives, matching Login.jsx exactly ---------- */

const darkInput =
  'w-full appearance-none rounded-2xl bg-white/[0.05] py-3 text-[14.5px] text-white placeholder:text-white/30 ' +
  'outline-none ring-1 ring-inset ring-white/10 transition duration-150 ' +
  'focus:bg-white/[0.07] focus:ring-2 focus:ring-violet-400/50 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.12)]'

function DarkField({ label, id, Icon, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13px] font-medium tracking-tight text-white/75">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-white/50">
            <Icon />
          </span>
        )}
        <input id={id} className={darkInput + (Icon ? ' pl-11 pr-4' : ' px-4')} {...props} />
      </div>
    </div>
  )
}

function DarkPasswordField({ label, id, value, onChange, ...props }) {
  const [visible, setVisible] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13px] font-medium tracking-tight text-white/75">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-white/50">
          <LockIcon />
        </span>
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className={darkInput + ' pl-11 pr-11'}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-white/50 transition hover:text-white"
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          <EyeIcon off={!visible} />
        </button>
      </div>
    </div>
  )
}

/* ---------- page ---------- */

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Identical to the previous implementation: same signup() call via useAuth(),
  // same navigation, same error handling. Only the surrounding UI changed.
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
    <LoginAuthLayout
      title="Create your account"
      subtitle="Start practicing with questions built from your resume."
    >
      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-400/25 bg-red-500/10 px-3.5 py-2.5 text-[13px] leading-snug text-red-200">
          <ErrorIcon />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <DarkField
          id="name"
          label="Name"
          type="text"
          Icon={UserIcon}
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jordan Rivera"
        />
        <DarkField
          id="email"
          label="Email"
          type="email"
          Icon={MailIcon}
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <DarkPasswordField
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
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500 px-4 py-3 text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(139,92,246,0.7)] transition hover:shadow-[0_14px_36px_-8px_rgba(139,92,246,0.85)] hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
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

      <p className="mt-7 text-center text-sm text-white/45">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-violet-300 hover:text-violet-200 hover:underline">
          Log in
        </Link>
      </p>
    </LoginAuthLayout>
  )
}