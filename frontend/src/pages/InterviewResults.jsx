import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DashboardHeader from '../components/DashboardHeader'
import api from '../api/axios'

function PageShell({ children }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#0a0d20] via-[#0b0a1f] to-[#150a28] pb-16 font-sans">
      {/* continuous grid + ambient glows, same treatment as Dashboard/Login */}
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
        {children}
      </div>
    </div>
  )
}

export default function InterviewResults() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sessionId) {
      setError('No session specified.')
      setLoading(false)
      return
    }

    api
      .get(`/interview/results-full/${sessionId}`)
      .then((res) => setReport(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load interview report.'))
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading) {
    return (
      <PageShell>
        <main className="mx-auto max-w-4xl px-6 py-20 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-violet-400 border-t-transparent"></div>
          <p className="text-sm font-medium text-white/55">Analyzing interview performance & generating your learning roadmap…</p>
        </main>
      </PageShell>
    )
  }

  if (error || !report) {
    return (
      <PageShell>
        <main className="mx-auto max-w-2xl px-6 py-16 text-center">
          <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-6 text-red-200">
            {error || 'Interview report not found.'}
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 rounded-lg bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(124,58,237,0.6)] transition hover:brightness-110"
          >
            Back to Dashboard
          </button>
        </main>
      </PageShell>
    )
  }

  const { feedback, roadmap, difficulty } = report

  return (
    <PageShell>
      <main className="mx-auto max-w-5xl px-6 py-10">

        {/* Header section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-violet-400/20 bg-violet-500/15 px-2.5 py-1 text-xs font-semibold capitalize text-violet-200">
                {difficulty} Level Interview
              </span>
              <span className="text-xs text-white/40">Session: {sessionId.slice(0, 8)}...</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Interview Performance & Feedback</h1>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/[0.07] sm:mt-0"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Score Overview Cards */}
        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 text-center backdrop-blur-xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/45">Overall Score</span>
            <div className="mt-2 bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-5xl font-extrabold text-transparent">
              {Math.round(feedback.overall_score)}%
            </div>
            <p className="mt-2 text-xs text-white/45">Composite performance across MCQ & Descriptive rounds</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 text-center backdrop-blur-xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/45">MCQ Score</span>
            <div className="mt-2 text-4xl font-bold text-white">
              {Math.round(feedback.mcq_score_percentage)}%
            </div>
            <p className="mt-2 text-xs text-white/45">Technical knowledge accuracy</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 text-center backdrop-blur-xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/45">Descriptive Rating</span>
            <div className="mt-2 text-4xl font-bold text-white">
              {Math.round(feedback.descriptive_score_percentage)}%
            </div>
            <p className="mt-2 text-xs text-white/45">Correctness, relevance & communication</p>
          </div>
        </div>

        {/* Strengths, Weaknesses & Suggestions Grid */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2">

          {/* Strengths */}
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.06] p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xl">🌟</span>
              <h2 className="text-lg font-semibold text-emerald-300">Strengths</h2>
            </div>
            <ul className="space-y-2">
              {feedback.strengths.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-white/75">
                  <span className="font-bold text-emerald-400">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weak Topics */}
          <div className="rounded-2xl border border-amber-300/20 bg-amber-400/[0.06] p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <h2 className="text-lg font-semibold text-amber-300">Areas to Improve</h2>
            </div>
            <ul className="space-y-2">
              {feedback.weak_topics.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-white/75">
                  <span className="font-bold text-amber-300">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Skipped Topics */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xl">⏭️</span>
              <h2 className="text-lg font-semibold text-white">Skipped Questions</h2>
            </div>
            {feedback.skipped_topics.length > 0 ? (
              <ul className="space-y-2">
                {feedback.skipped_topics.map((item, idx) => (
                  <li key={idx} className="text-sm text-white/50">
                    • {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm italic text-white/40">No questions were skipped during this interview!</p>
            )}
          </div>

          {/* Key Suggestions */}
          <div className="rounded-2xl border border-violet-400/20 bg-violet-500/[0.08] p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xl">💡</span>
              <h2 className="text-lg font-semibold text-violet-200">Actionable Suggestions</h2>
            </div>
            <ul className="space-y-2">
              {feedback.suggestions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-white/75">
                  <span className="font-bold text-violet-300">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Learning Roadmap Section */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-8 backdrop-blur-xl">
          <div className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-300">Custom Preparation Plan</span>
            <h2 className="mt-1 text-2xl font-bold text-white">🚀 Recommended Learning Roadmap</h2>
            <p className="text-sm text-white/50">Step-by-step topic study plan based on your performance in this session.</p>
          </div>

          <div className="relative ml-4 space-y-8 border-l-2 border-violet-400/20 pl-6">
            {roadmap.map((item) => (
              <div key={item.step} className="relative">
                {/* Step Circle */}
                <div className="absolute -left-[35px] top-0 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-xs font-bold text-white shadow-[0_0_14px_rgba(139,92,246,0.6)]">
                  {item.step}
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5 backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-white">{item.topic}</h3>
                    <span className="rounded border border-violet-400/20 bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-200">
                      {item.target_skill_level}
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-white/55">{item.description}</p>

                  {item.recommended_resources && item.recommended_resources.length > 0 && (
                    <div className="mt-3">
                      <span className="text-xs font-medium text-white/70">Recommended Topics & Focus Areas:</span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {item.recommended_resources.map((res, rIdx) => (
                          <span
                            key={rIdx}
                            className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-white/55"
                          >
                            📖 {res}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-10 text-center">
          <button
            onClick={() => navigate('/interview/new')}
            className="rounded-lg bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(124,58,237,0.6)] transition hover:brightness-110"
          >
            Start New Practice Interview →
          </button>
        </div>

      </main>
    </PageShell>
  )
}