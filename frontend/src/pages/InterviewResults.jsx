import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'

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
      <div className="min-h-screen bg-paper">
        <Navbar />
        <main className="mx-auto max-w-4xl px-6 py-20 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-signal border-t-transparent"></div>
          <p className="text-sm font-medium text-muted">Analyzing interview performance & generating your learning roadmap…</p>
        </main>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-paper">
        <Navbar />
        <main className="mx-auto max-w-2xl px-6 py-16 text-center">
          <div className="rounded-lg border border-bad/30 bg-bad/5 p-6 text-bad">
            {error || 'Interview report not found.'}
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 rounded-sm bg-signal px-4 py-2 text-sm font-medium text-white"
          >
            Back to Dashboard
          </button>
        </main>
      </div>
    )
  }

  const { feedback, roadmap, difficulty } = report

  return (
    <div className="min-h-screen bg-paper pb-16">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10">

        {/* Header section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-sm bg-signal/10 px-2.5 py-1 text-xs font-semibold capitalize text-signal">
                {difficulty} Level Interview
              </span>
              <span className="text-xs text-muted">Session: {sessionId.slice(0, 8)}...</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Interview Performance & Feedback</h1>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 rounded-md border border-border bg-panel px-4 py-2 text-sm font-medium hover:bg-paper sm:mt-0"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Score Overview Cards */}
        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-panel p-6 text-center shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Overall Score</span>
            <div className="mt-2 text-5xl font-extrabold text-signal">
              {Math.round(feedback.overall_score)}%
            </div>
            <p className="mt-2 text-xs text-muted">Composite performance across MCQ & Descriptive rounds</p>
          </div>

          <div className="rounded-xl border border-border bg-panel p-6 text-center shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">MCQ Score</span>
            <div className="mt-2 text-4xl font-bold text-ink">
              {Math.round(feedback.mcq_score_percentage)}%
            </div>
            <p className="mt-2 text-xs text-muted">Technical knowledge accuracy</p>
          </div>

          <div className="rounded-xl border border-border bg-panel p-6 text-center shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Descriptive Rating</span>
            <div className="mt-2 text-4xl font-bold text-ink">
              {Math.round(feedback.descriptive_score_percentage)}%
            </div>
            <p className="mt-2 text-xs text-muted">Correctness, relevance & communication</p>
          </div>
        </div>

        {/* Strengths, Weaknesses & Suggestions Grid */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          
          {/* Strengths */}
          <div className="rounded-xl border border-good/30 bg-good/5 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🌟</span>
              <h2 className="text-lg font-semibold text-good">Strengths</h2>
            </div>
            <ul className="space-y-2">
              {feedback.strengths.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-ink">
                  <span className="text-good font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weak Topics */}
          <div className="rounded-xl border border-warn/30 bg-warn/5 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">⚠️</span>
              <h2 className="text-lg font-semibold text-warn">Areas to Improve</h2>
            </div>
            <ul className="space-y-2">
              {feedback.weak_topics.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-ink">
                  <span className="text-warn font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Skipped Topics */}
          <div className="rounded-xl border border-border bg-panel p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">⏭️</span>
              <h2 className="text-lg font-semibold text-ink">Skipped Questions</h2>
            </div>
            {feedback.skipped_topics.length > 0 ? (
              <ul className="space-y-2">
                {feedback.skipped_topics.map((item, idx) => (
                  <li key={idx} className="text-sm text-muted">
                    • {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted italic">No questions were skipped during this interview!</p>
            )}
          </div>

          {/* Key Suggestions */}
          <div className="rounded-xl border border-signal/30 bg-signal-soft/30 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">💡</span>
              <h2 className="text-lg font-semibold text-signal">Actionable Suggestions</h2>
            </div>
            <ul className="space-y-2">
              {feedback.suggestions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-ink">
                  <span className="text-signal font-bold">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Learning Roadmap Section */}
        <div className="rounded-xl border border-border bg-panel p-8 shadow-sm">
          <div className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-signal">Custom Preparation Plan</span>
            <h2 className="mt-1 text-2xl font-bold text-ink">🚀 Recommended Learning Roadmap</h2>
            <p className="text-sm text-muted">Step-by-step topic study plan based on your performance in this session.</p>
          </div>

          <div className="relative border-l-2 border-signal/30 ml-4 space-y-8 pl-6">
            {roadmap.map((item) => (
              <div key={item.step} className="relative">
                {/* Step Circle */}
                <div className="absolute -left-[35px] top-0 flex h-7 w-7 items-center justify-center rounded-full bg-signal text-xs font-bold text-white shadow-sm">
                  {item.step}
                </div>

                <div className="rounded-lg border border-border bg-paper p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-ink">{item.topic}</h3>
                    <span className="rounded bg-signal-soft px-2 py-0.5 text-xs font-medium text-signal">
                      {item.target_skill_level}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-muted leading-relaxed">{item.description}</p>

                  {item.recommended_resources && item.recommended_resources.length > 0 && (
                    <div className="mt-3">
                      <span className="text-xs font-medium text-ink">Recommended Topics & Focus Areas:</span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {item.recommended_resources.map((res, rIdx) => (
                          <span
                            key={rIdx}
                            className="rounded border border-border bg-panel px-2 py-0.5 text-xs text-muted"
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
            className="rounded-md bg-signal px-6 py-3 text-sm font-semibold text-white hover:bg-signal/90 shadow-md"
          >
            Start New Practice Interview →
          </button>
        </div>

      </main>
    </div>
  )
}
