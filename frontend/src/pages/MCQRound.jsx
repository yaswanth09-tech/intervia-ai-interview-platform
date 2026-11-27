import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'

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
      <div className="min-h-screen bg-paper">
        <Navbar />
        <main className="mx-auto max-w-2xl px-6 py-20 text-center text-sm text-muted">
          Loading MCQ questions…
        </main>
      </div>
    )
  }

  if (error || !current) {
    return (
      <div className="min-h-screen bg-paper">
        <Navbar />
        <main className="mx-auto max-w-2xl px-6 py-20 text-center">
          <div className="rounded-md border border-bad/30 bg-bad/5 p-4 text-sm text-bad">
            {error || 'No questions available.'}
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 rounded-md bg-signal px-4 py-2 text-sm font-medium text-white"
          >
            Back to Dashboard
          </button>
        </main>
      </div>
    )
  }

  const selectedOption = answers[current.id]
  const progress = ((currentIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 py-10">

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted">
            <span>MCQ Question {currentIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-border">
            <div
              className="h-full rounded-full bg-signal transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="rounded-xl border border-border bg-panel p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-ink leading-relaxed">{current.question}</h2>

          <div className="mt-6 space-y-3">
            {current.options.map((opt, i) => {
              const isSelected = selectedOption === opt
              return (
                <button
                  key={i}
                  onClick={() => handleSelectOption(opt)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left text-sm font-medium transition ${
                    isSelected
                      ? 'border-signal bg-signal-soft text-signal'
                      : 'border-border bg-paper text-ink hover:border-border/80'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isSelected ? 'bg-signal text-white' : 'bg-panel text-muted border border-border'
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
            className="rounded-md border border-border bg-panel px-4 py-2 text-sm font-medium hover:bg-paper disabled:opacity-30"
          >
            ← Previous
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex((prev) => prev + 1)}
              className="rounded-md bg-signal px-6 py-2 text-sm font-medium text-white hover:bg-signal/90"
            >
              Next Question →
            </button>
          ) : (
            <button
              onClick={handleSubmitQuiz}
              disabled={submitting}
              className="rounded-md bg-good px-6 py-2 text-sm font-semibold text-white hover:bg-good/90 disabled:opacity-50"
            >
              {submitting ? 'Submitting MCQ Round…' : 'Finish MCQ Round ✓'}
            </button>
          )}
        </div>

      </main>
    </div>
  )
}
