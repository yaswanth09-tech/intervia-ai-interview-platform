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
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal-soft ring-1 ring-signal/15">
            <SignalMark className="h-[18px] w-[18px]" />
          </span>
          <span className="h-4 w-px bg-border" aria-hidden="true" />
          <span className="font-display text-[15px] font-bold uppercase tracking-[0.08em] text-ink">
            Intervia
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#3F4260]">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-ink transition hover:border-signal hover:bg-signal-soft hover:text-signal"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  )
}