import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DashboardHeader from '../components/DashboardHeader'
import api from '../api/axios'

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M11 2 4 12h5l-1 6 7-10h-5l1-6Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/interview/history')
      .then((res) => setHistory(res.data || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-paper font-body">
      {/* faint grid overlay, same treatment as the login page */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(#14162B 1px, transparent 1px), linear-gradient(90deg, #14162B 1px, transparent 1px)',
          backgroundSize: '46px 46px',
          maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
        }}
      />

      <div className="relative z-10">
        <DashboardHeader />

        <main className="mx-auto max-w-5xl px-6 py-10">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="mt-1.5 text-sm text-[#4A4D68]">
            Upload your resume to generate a personalized AI-powered mock interview.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {/* Start New Interview — primary action */}
            <button
              onClick={() => navigate('/interview/new')}
              className="group rounded-2xl border border-signal/25 bg-white text-left shadow-[0_10px_30px_-18px_rgba(70,64,222,0.35)] transition hover:border-signal/50 hover:shadow-[0_18px_40px_-18px_rgba(70,64,222,0.45)]"
            >
              <div className="h-full rounded-2xl p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#4640DE] via-[#5A3FD6] to-[#3B5BDB] text-white shadow-[0_8px_20px_-8px_rgba(70,64,222,0.6)]">
                  <PlusIcon />
                </div>
                <h2 className="font-display text-xl font-bold text-ink">Start a new interview</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-[#3F4260]">
                  Upload your PDF resume, choose your difficulty, and answer AI-generated
                  questions grounded in your real background.
                </p>
              </div>
            </button>

            {/* Quick Info Card */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-[0_10px_30px_-22px_rgba(20,22,43,0.25)]">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-signal-soft text-signal ring-1 ring-signal/20">
                <BoltIcon />
              </div>
              <h2 className="font-display text-xl font-bold text-ink">How it works</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[#3F4260]">
                1. Upload Resume &amp; Selection → 2. MCQ Round → 3. Technical Interview
                (Text/Voice) → 4. AI Feedback &amp; Roadmap.
              </p>
            </div>
          </div>

          {/* History Section */}
          <div className="mt-12">
            <h2 className="font-display text-xl font-bold text-ink">Your Interview History</h2>
            <p className="text-sm text-[#4A4D68]">Review past mock interviews and learning roadmaps.</p>

            {loading ? (
              <p className="mt-6 text-sm text-muted">Loading history…</p>
            ) : history.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-[#B8BCCD] bg-white p-8 text-center text-sm text-[#4A4D68]">
                No interview sessions completed yet. Click <strong className="text-ink">"Start a new interview"</strong> above to get started!
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {history.map((sess) => (
                  <div
                    key={sess.session_id}
                    className="flex flex-col rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgba(20,22,43,0.25)] transition hover:border-signal/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-signal-soft px-2.5 py-0.5 text-xs font-semibold capitalize text-signal ring-1 ring-inset ring-signal/20">
                          {sess.difficulty} Difficulty
                        </span>
                        <span className="text-xs text-muted">
                          {new Date(sess.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-[#3F4260]">
                        Status:{' '}
                        <span
                          className={
                            sess.status === 'Completed'
                              ? 'font-semibold text-[#0B7A56]'
                              : 'font-semibold text-[#9A5200]'
                          }
                        >
                          {sess.status}
                        </span>
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-4 sm:mt-0">
                      {sess.overall_score !== null && sess.overall_score !== undefined && (
                        <div className="text-right">
                          <span className="text-xs text-muted">Overall Score</span>
                          <div className="font-display text-xl font-bold text-signal">
                            {Math.round(sess.overall_score)}%
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => navigate(`/interview/results?session_id=${sess.session_id}`)}
                        className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-signal hover:bg-signal-soft hover:text-signal"
                      >
                        View Report &amp; Roadmap →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}