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
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#0a0d20] via-[#0b0a1f] to-[#150a28] font-sans">
      {/* continuous grid + ambient glows, same treatment as the login page */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '46px 46px',
          maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
        }}
      />
      <div className="pointer-events-none fixed -top-32 right-0 h-[28rem] w-[28rem] rounded-full bg-violet-600/15 blur-[130px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

      <div className="relative z-10">
        <DashboardHeader />

        <main className="mx-auto max-w-5xl px-6 py-10">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="mt-1.5 text-sm text-white/50">
            Upload your resume to generate a personalized AI-powered mock interview.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {/* Start New Interview — primary action, gradient-bordered glass card */}
            <button
              onClick={() => navigate('/interview/new')}
              className="group rounded-2xl bg-gradient-to-b from-violet-400/40 via-white/10 to-blue-400/25 p-px text-left shadow-[0_20px_50px_-25px_rgba(76,29,149,0.6)] transition hover:shadow-[0_24px_60px_-20px_rgba(76,29,149,0.75)]"
            >
              <div className="h-full rounded-[15px] bg-white/[0.045] p-6 backdrop-blur-xl transition group-hover:bg-white/[0.06]">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.5)]">
                  <PlusIcon />
                </div>
                <h2 className="text-xl font-bold text-white">Start a new interview</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-white/55">
                  Upload your PDF resume, choose your difficulty, and answer AI-generated
                  questions grounded in your real background.
                </p>
              </div>
            </button>

            {/* Quick Info Card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-cyan-300">
                <BoltIcon />
              </div>
              <h2 className="text-xl font-bold text-white">How it works</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-white/55">
                1. Upload Resume &amp; Selection → 2. MCQ Round → 3. Technical Interview
                (Text/Voice) → 4. AI Feedback &amp; Roadmap.
              </p>
            </div>
          </div>

          {/* History Section */}
          <div className="mt-12">
            <h2 className="text-xl font-bold text-white">Your Interview History</h2>
            <p className="text-sm text-white/50">Review past mock interviews and learning roadmaps.</p>

            {loading ? (
              <p className="mt-6 text-sm text-white/40">Loading history…</p>
            ) : history.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-sm text-white/45">
                No interview sessions completed yet. Click <strong className="text-white/70">"Start a new interview"</strong> above to get started!
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {history.map((sess) => (
                  <div
                    key={sess.session_id}
                    className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl transition hover:border-white/20 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-violet-200 ring-1 ring-inset ring-violet-400/20">
                          {sess.difficulty} Difficulty
                        </span>
                        <span className="text-xs text-white/35">
                          {new Date(sess.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-white/80">
                        Status:{' '}
                        <span
                          className={
                            sess.status === 'Completed'
                              ? 'font-semibold text-emerald-400'
                              : 'font-semibold text-amber-300'
                          }
                        >
                          {sess.status}
                        </span>
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-4 sm:mt-0">
                      {sess.overall_score !== null && sess.overall_score !== undefined && (
                        <div className="text-right">
                          <span className="text-xs text-white/40">Overall Score</span>
                          <div className="text-xl font-bold text-violet-300">
                            {Math.round(sess.overall_score)}%
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => navigate(`/interview/results?session_id=${sess.session_id}`)}
                        className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/80 transition hover:border-violet-400/40 hover:text-violet-200"
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