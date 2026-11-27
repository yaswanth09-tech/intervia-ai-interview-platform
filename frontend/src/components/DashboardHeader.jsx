import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SignalMark from './SignalMark'

/**
 * DashboardHeader
 * ----------------
 * Light-themed header used only on the Dashboard page. The shared `Navbar`
 * component is separate. Same logout behavior as Navbar — no auth logic changed.
 */

function ChevronIcon({ open }) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      className={`h-3 w-3 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function initials(name) {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export default function DashboardHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal-soft ring-1 ring-signal/15">
            <SignalMark className="h-[18px] w-[18px]" />
          </span>
          <span className="h-4 w-px bg-border" aria-hidden="true" />
          <span className="font-display text-[15px] font-bold uppercase tracking-[0.08em] text-ink">Intervia</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Profile viewer */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg border border-border bg-white py-1.5 pl-1.5 pr-2.5 text-sm font-medium text-[#3F4260] transition hover:border-signal/40 hover:bg-paper hover:text-ink"
              aria-haspopup="true"
              aria-expanded={profileOpen}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#4640DE] to-[#3B5BDB] text-[11px] font-semibold text-white">
                {initials(user?.name)}
              </span>
              <span>{user?.name}</span>
              <ChevronIcon open={profileOpen} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-64 rounded-xl border border-border bg-white p-4 shadow-[0_20px_50px_-15px_rgba(20,22,43,0.2)]">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#4640DE] to-[#3B5BDB] text-sm font-semibold text-white">
                    {initials(user?.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{user?.name || 'Account'}</p>
                    <p className="truncate text-xs text-muted">{user?.email || 'No email on file'}</p>
                  </div>
                </div>
                <div className="my-3 h-px bg-border" />
                <button
                  onClick={handleLogout}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-left text-sm font-medium text-[#3F4260] transition hover:border-bad/40 hover:bg-[#FDECEF] hover:text-[#9B1C31]"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}