import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SignalMark from './SignalMark'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="border-b border-border bg-panel">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <SignalMark />
          <span className="h-4 w-px bg-border" aria-hidden="true" />
          <span className="font-display text-[15px] font-bold uppercase tracking-[0.08em] text-ink">
            Intervia
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="rounded-sm border border-border px-3 py-1.5 text-sm font-medium text-ink transition hover:border-ink"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  )
}