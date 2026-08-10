import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DashboardHeader from '../components/DashboardHeader'
import api from '../api/axios'

function PageShell({ children }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#0a0d20] via-[#0b0a1f] to-[#150a28] font-sans">
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

export default function MCQRound() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // { questionId: selectedOption }
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sessionId) {
      setError('No active session found.')
      setLoading(false)
      return
    }

    api
      .get(`/interview/session/${sessionId}`)
      .then((res) => setQuestions(res.data.mcqs || []))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load MCQ questions.'))
      .finally(() => setLoading(false))
  }, [sessionId])

  const current = questions[currentIndex]

  function handleSelectOption(option) {
    if (!current) return
    setAnswers((prev) => ({
      ...prev,
      [current.id]: option,
    }))
  }

  async function handleSubmitQuiz() {
    setSubmitting(true)
    setError('')

    const formattedAnswers = Object.entries(answers).map(([question_id, selected_option]) => ({
      question_id,
      selected_option,
    }))

    try {
      const res = await api.post('/interview/mcq/submit', {
        session_id: sessionId,
        answers: formattedAnswers,
      })
      navigate(`/interview/mcq-results?session_id=${sessionId}`, {
        state: { results: res.data },
      })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit MCQ answers.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <PageShell>
        <main className="mx-auto max-w-2xl px-6 py-20 text-center text-sm text-white/45">
          Loading MCQ questions…
        </main>
      </PageShell>
    )
  }

  if (error || !current) {
    return (
      <PageShell>
        <main className="mx-auto max-w-2xl px-6 py-20 text-center">
          <div className="rounded-xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-200">
            {error || 'No questions available.'}
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

  const selectedOption = answers[current.id]
  const progress = ((currentIndex + 1) / questions.length) * 100

  return (
    <PageShell>
      <main className="mx-auto max-w-2xl px-6 py-10">

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-white/45">
            <span>MCQ Question {currentIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 shadow-[0_0_10px_rgba(139,92,246,0.6)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">
          <h2 className="text-lg font-semibold leading-relaxed text-white whitespace-pre-wrap break-words">{current.question}</h2>

          <div className="mt-6 space-y-3">
            {current.options.map((opt, i) => {
              const isSelected = selectedOption === opt
              return (
                <button
                  key={i}
                  onClick={() => handleSelectOption(opt)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm font-medium backdrop-blur-xl transition ${
                    isSelected
                      ? 'border-violet-400/40 bg-violet-500/[0.1] text-violet-100 shadow-[0_15px_40px_-25px_rgba(76,29,149,0.7)]'
                      : 'border-white/10 bg-white/[0.025] text-white/80 hover:border-white/20'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                      isSelected
                        ? 'bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.6)]'
                        : 'border border-white/10 bg-white/[0.05] text-white/45'
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{opt}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Navigation / Action buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/[0.07] disabled:opacity-30"
          >
            ← Previous
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex((prev) => prev + 1)}
              className="rounded-lg bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500 px-6 py-2 text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(124,58,237,0.6)] transition hover:brightness-110"
            >
              Next Question →
            </button>
          ) : (
            <button
              onClick={handleSubmitQuiz}
              disabled={submitting}
              className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(16,185,129,0.6)] transition hover:brightness-110 disabled:opacity-50"
            >
              {submitting ? 'Submitting MCQ Round…' : 'Finish MCQ Round ✓'}
            </button>
          )}
        </div>

      </main>
    </PageShell>
  )
}