import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function MCQResults() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const results = location.state?.results

  if (!results) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-2xl px-6 py-16 text-center text-sm text-muted">
          No results found. Go back to the interview.
        </main>
      </div>
    )
  }

  const percentage = results.score_percentage
  const statusColor =
    percentage >= 80 ? 'good' : percentage >= 60 ? 'warn' : 'bad'

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold">MCQ Round Complete</h1>

        <div className="mt-8 rounded-lg border border-border bg-panel p-8 text-center">
          <div className="mb-4 text-5xl font-bold text-signal">
            {Math.round(percentage)}%
          </div>
          <p className="text-lg font-medium">
            {results.correct_count} of {results.total_questions} correct
          </p>
          <p className="mt-2 text-sm text-muted">
            {percentage >= 80
              ? "Great work! Moving on to descriptive questions."
              : percentage >= 60
              ? "Solid performance. Ready for open-ended questions?"
              : "Room for improvement — review the answers below."}
          </p>
        </div>

        <div className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold">Answer Review</h2>
          {results.question_results.map((result, i) => (
            <div
              key={i}
              className={`rounded-lg border-2 p-4 ${
                result.correct
                  ? 'border-good/30 bg-good/5'
                  : 'border-bad/30 bg-bad/5'
              }`}
            >
              <div className="mb-2 flex items-start gap-3">
                <div
                  className={`mt-1 flex h-6 w-6 items-center justify-center rounded-sm text-xs font-bold text-white ${
                    result.correct ? 'bg-good' : 'bg-bad'
                  }`}
                >
                  {result.correct ? '✓' : '✗'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Question {i + 1}</p>
                </div>
              </div>

              <p className="mb-3 text-sm text-ink">
                Your answer: <span className="font-mono">{result.selected || '(not answered)'}</span>
              </p>

              {!result.correct && (
                <p className="text-sm text-muted">
                  Correct answer: <span className="font-mono text-good">{result.correct_answer}</span>
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 flex gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-sm border border-border px-4 py-2 text-sm font-medium hover:border-ink"
          >
            Back to dashboard
          </button>
          <button
            onClick={() => navigate(`/interview/descriptive?session_id=${sessionId}`)}
            className="rounded-sm bg-signal px-6 py-2 text-sm font-medium text-white hover:bg-signal/90"
          >
            Continue to descriptive questions →
          </button>
        </div>
      </main>
    </div>
  )
}