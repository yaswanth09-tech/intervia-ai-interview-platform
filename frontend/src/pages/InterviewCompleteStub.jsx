import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function InterviewCompleteStub() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="mb-4 text-4xl">✅</div>
        <h1 className="text-xl font-semibold">All questions answered</h1>
        <p className="mt-2 text-sm text-muted">
          Answer evaluation and full results are built in Phase 7-8 — this is where they'll
          plug in.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-block rounded-sm border border-border px-4 py-2 text-sm font-medium hover:border-ink"
        >
          Back to dashboard
        </Link>
      </main>
    </div>
  )
}