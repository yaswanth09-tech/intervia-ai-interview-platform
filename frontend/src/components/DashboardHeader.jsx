import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SignalMark from './SignalMark'

/**
 * DashboardHeader
 * ----------------
 * Dark-themed header used only on the Dashboard page. The shared `Navbar`
 * component is untouched, so every other page that still uses the light
 * theme (ResumeUpload, SelectDifficulty, MCQRound, etc.) is unaffected.
 * Same logout behavior as Navbar — no auth logic changed.
 */

function ChevronIcon({ open }) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      className={`h-3 w-3 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`}
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
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0a0d20]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] shadow-[0_0_16px_rgba(139,92,246,0.3)]">
            <SignalMark className="h-4.5 w-4.5" />
          </span>
          <span className="h-4 w-px bg-white/15" aria-hidden="true" />
          <span className="text-[15px] font-bold uppercase tracking-[0.08em] text-white">Intervia</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Profile viewer */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] py-1.5 pl-1.5 pr-2.5 text-sm text-white/70 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
              aria-haspopup="true"
              aria-expanded={profileOpen}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-[11px] font-semibold text-white">
                {initials(user?.name)}
              </span>
              <span>{user?.name}</span>
              <ChevronIcon open={profileOpen} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-64 rounded-xl border border-white/10 bg-[#0d1024]/95 p-4 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-sm font-semibold text-white">
                    {initials(user?.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{user?.name || 'Account'}</p>
                    <p className="truncate text-xs text-white/45">{user?.email || 'No email on file'}</p>
                  </div>
                </div>
                <div className="my-3 h-px bg-white/10" />
                <button
                  onClick={handleLogout}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-sm font-medium text-white/80 transition hover:border-red-400/30 hover:text-red-300"
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