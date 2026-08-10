import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import DashboardHeader from '../components/DashboardHeader'

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

export default function MCQResults() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const results = location.state?.results

  if (!results) {
    return (
      <PageShell>
        <main className="mx-auto max-w-2xl px-6 py-16 text-center text-sm text-white/45">
          No results found. Go back to the interview.
        </main>
      </PageShell>
    )
  }

  const percentage = results.score_percentage
  const statusColor =
    percentage >= 80 ? 'good' : percentage >= 60 ? 'warn' : 'bad'

  return (
    <PageShell>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-white">MCQ Round Complete</h1>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-center backdrop-blur-xl">
          <div className="mb-4 bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-5xl font-bold text-transparent">
            {Math.round(percentage)}%
          </div>
          <p className="text-lg font-medium text-white">
            {results.correct_count} of {results.total_questions} correct
          </p>
          <p className="mt-2 text-sm text-white/50">
            {percentage >= 80
              ? "Great work! Moving on to descriptive questions."
              : percentage >= 60
              ? "Solid performance. Ready for open-ended questions?"
              : "Room for improvement — review the answers below."}
          </p>
        </div>

        <div className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold text-white">Answer Review</h2>
          {results.question_results.map((result, i) => (
            <div
              key={i}
              className={`rounded-2xl border p-4 backdrop-blur-xl ${
                result.correct
                  ? 'border-emerald-400/25 bg-emerald-500/[0.06]'
                  : 'border-red-400/25 bg-red-500/[0.06]'
              }`}
            >
              <div className="mb-2 flex items-start gap-3">
                <div
                  className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white ${
                    result.correct ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                >
                  {result.correct ? '✓' : '✗'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white/85">Question {i + 1}</p>
                </div>
              </div>

              <p className="mb-3 text-sm text-white/70">
                Your answer:{' '}
                <span className="font-mono text-white/90">{result.selected || '(not answered)'}</span>
              </p>

              {!result.correct && (
                <p className="text-sm text-white/50">
                  Correct answer:{' '}
                  <span className="font-mono text-emerald-300">{result.correct_answer}</span>
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 flex gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/[0.07]"
          >
            Back to dashboard
          </button>
          <button
            onClick={() => navigate(`/interview/descriptive?session_id=${sessionId}`)}
            className="rounded-lg bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500 px-6 py-2 text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(124,58,237,0.6)] transition hover:brightness-110"
          >
            Continue to descriptive questions →
          </button>
        </div>
      </main>
    </PageShell>
  )
}