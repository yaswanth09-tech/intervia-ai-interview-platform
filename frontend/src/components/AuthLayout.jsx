import SignalMark from './SignalMark'

const FEATURES = [
  'Questions generated from your actual resume',
  'Adaptive difficulty across MCQ and descriptive rounds',
  'Structured feedback the moment your session ends',
]

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true">
      <circle cx="8" cy="8" r="7.25" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.25" />
      <path d="M5 8.2 7.1 10.3 11.2 5.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function AuthLayout({ title, subtitle, children }) {
  const year = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* Left: brand / product panel — hidden below lg, this is where the visual identity lives */}
      <div className="relative hidden overflow-hidden bg-ink px-14 py-12 lg:flex lg:flex-col">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-signal/25 blur-[110px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-16 h-80 w-80 rounded-full bg-good/10 blur-[110px]" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <SignalMark className="h-7 w-7" />
            <span className="h-4 w-px bg-white/20" aria-hidden="true" />
            <span className="font-display text-[17px] font-bold uppercase tracking-[0.08em] text-white">
              Intervia
            </span>
          </div>
          <p className="mt-2 pl-[calc(1.75rem+1.5rem+1px)] font-mono text-[10.5px] uppercase tracking-[0.16em] text-signal-soft/70">
            AI-Powered Interview Practice &amp; Performance Improvement
          </p>
        </div>

        <div className="relative flex flex-1 items-center">
          <div className="max-w-md">
            <h2 className="mb-4 font-display text-[28px] font-semibold leading-[1.2] text-white">
              Practice on questions built from your own resume.
            </h2>
            <p className="mb-8 text-[15px] leading-relaxed text-white/60">
              Upload your resume, pick a difficulty, and the interview is generated around your
              actual experience — not a generic question bank.
            </p>

            {/* Signature element: a real sample of the product's output, not decoration */}
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset] backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-signal/25 px-2.5 py-1 font-mono text-[11px] font-medium text-signal-soft">
                  Medium · Q4 · Descriptive
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-white/40">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-good" />
                  generated from resume
                </span>
              </div>
              <p className="text-[13.5px] leading-relaxed text-white/85">
                "You mentioned optimizing a PostgreSQL query on your resume — walk me through how
                you identified the bottleneck."
              </p>
            </div>

            <ul className="mt-8 space-y-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-white/65">
                  <span className="text-good">
                    <CheckIcon />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="relative font-mono text-[11px] text-white/25">
          © {year} Intervia
        </p>
      </div>

      {/* Right: form panel */}
      <div className="flex min-h-screen items-center justify-center px-6 py-14 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            <SignalMark />
            <span className="h-4 w-px bg-border" aria-hidden="true" />
            <span className="font-display text-[15px] font-bold uppercase tracking-[0.08em] text-ink">
              Intervia
            </span>
          </div>

          <h1 className="mb-1.5 font-display text-[26px] font-semibold text-ink">{title}</h1>
          <p className="mb-8 text-sm text-muted">{subtitle}</p>

          {children}
        </div>
      </div>
    </div>
  )
}