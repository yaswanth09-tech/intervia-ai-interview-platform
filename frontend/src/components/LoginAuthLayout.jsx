import SignalMark from './SignalMark'

/**
 * LoginAuthLayout
 * ----------------
 * Dedicated to the Login page only. Signup keeps using the original
 * `AuthLayout` — this file does not touch it, so the signup page,
 * routing, and every other view are unaffected.
 *
 * Pure presentation: no auth logic, no API calls, no state that affects
 * form submission. `children` is the interactive card content (fields,
 * button, links) rendered by Login.jsx.
 */

const FEATURES = [
  'Questions generated from your actual resume',
  'Adaptive difficulty across MCQ and descriptive rounds',
  'Structured feedback the moment your session ends',
]

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true">
      <circle cx="8" cy="8" r="7.25" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.25" />
      <path d="M5 8.2 7.1 10.3 11.2 5.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Small decorative 3D-ish analytics bars, echoing the product's "signal" mark. */
function FloatingBars() {
  return (
    <svg
      viewBox="0 0 220 200"
      className="pointer-events-none absolute bottom-10 right-6 h-44 w-48 opacity-90 [animation:loginFloatSlow_7s_ease-in-out_infinite] xl:h-56 xl:w-60"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="barA" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#4c1d95" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="barB" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#5b21b6" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id="barC" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#312e81" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      <path
        d="M18 128 C 60 108, 96 60, 150 22"
        stroke="url(#barB)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      <path d="M138 30 150 22 156 36" stroke="url(#barB)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
      <rect x="14" y="128" width="30" height="56" rx="6" fill="url(#barA)" opacity="0.85" />
      <rect x="72" y="94" width="30" height="90" rx="6" fill="url(#barB)" opacity="0.9" />
      <rect x="130" y="48" width="30" height="136" rx="6" fill="url(#barC)" />
    </svg>
  )
}

export default function LoginAuthLayout({ children }) {
  const year = new Date().getFullYear()

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-[#0a0d20] via-[#0b0a1f] to-[#150a28] font-sans lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '46px 46px',
          maskImage: 'linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)',
        }}
      />
      <style>{`
        @keyframes loginFloatCard { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes loginFloatSlow { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-10px) rotate(-1.5deg); } }
        @keyframes loginGlowPulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 0.85; } }
        @media (prefers-reduced-motion: reduce) {
          [class*="loginFloat"], [style*="loginFloat"] { animation: none !important; }
        }
        /* Chrome/Safari autofill paints inputs white with dark text and can
           surface native input chrome that clashes with the glass fields.
           Force the dark background, white text, and remove native styling. */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-text-fill-color: #fff;
          caret-color: #fff;
          -webkit-box-shadow: 0 0 0 1000px rgba(20, 18, 38, 0.95) inset;
          box-shadow: 0 0 0 1000px rgba(20, 18, 38, 0.95) inset;
          transition: background-color 9999s ease-in-out 0s;
        }
        input[type="email"],
        input[type="password"],
        input[type="text"] {
          -webkit-appearance: none;
          appearance: none;
        }
      `}</style>

      {/* LEFT — brand / product panel (desktop only) */}
      <div className="relative z-10 hidden px-14 py-12 lg:flex lg:flex-col">
        {/* ambient glows */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-violet-600/25 blur-[120px] [animation:loginGlowPulse_8s_ease-in-out_infinite]"
        />
        <div className="pointer-events-none absolute -bottom-40 -left-16 h-96 w-96 rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="pointer-events-none absolute left-1/3 top-1/3 h-56 w-56 rounded-full bg-cyan-400/10 blur-[100px]" />

        <FloatingBars />

        {/* wordmark */}
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] shadow-[0_0_24px_rgba(139,92,246,0.35)]">
              <SignalMark className="h-5 w-5" />
            </span>
            <span className="font-display text-[17px] font-bold uppercase tracking-[0.08em] text-white">
              Intervia
            </span>
          </div>
          <p className="mt-2 pl-[3.25rem] font-mono text-[10.5px] uppercase tracking-[0.16em] text-violet-200/60">
            AI-Powered Interview Practice &amp; Performance Improvement
          </p>
        </div>

        <div className="relative flex flex-1 items-center">
          <div className="max-w-md">
            <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-violet-200">
              <span aria-hidden="true">✦</span> Smart practice. Real progress.
            </span>

            <h2 className="mb-4 font-display text-[30px] font-semibold leading-[1.2] text-white">
              Practice on questions built from{' '}
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                your own resume.
              </span>
            </h2>
            <p className="mb-8 text-[15px] leading-relaxed text-white/55">
              Upload your resume, select a difficulty, and get an interview experience tailored
              to your background — with questions that truly matter.
            </p>

            {/* signature element: sample generated question */}
            <div className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_20px_50px_-20px_rgba(76,29,149,0.5)] backdrop-blur-md">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-violet-500/20 px-2.5 py-1 font-mono text-[11px] font-medium text-violet-200 ring-1 ring-inset ring-violet-400/20">
                  Medium · Q4 · Descriptive
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-white/40">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
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
                <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-white/60">
                  <span className="text-cyan-300">
                    <CheckIcon />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="relative font-mono text-[11px] text-white/25">© {year} Intervia. All rights reserved.</p>
      </div>

      {/* RIGHT — login card */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-14 sm:px-10">
        <div className="pointer-events-none absolute right-1/2 top-1/2 h-[30rem] w-[30rem] -translate-y-1/2 translate-x-1/2 rounded-full bg-violet-600/20 blur-[130px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-[110px]" />

        <div className="relative w-full max-w-[26rem] [animation:loginFloatCard_6s_ease-in-out_infinite]">
          {/* gradient border wrapper */}
          <div className="rounded-[28px] bg-gradient-to-b from-violet-400/40 via-white/10 to-blue-400/30 p-px shadow-[0_30px_80px_-25px_rgba(76,29,149,0.55)]">
            <div className="rounded-[27px] bg-white/[0.055] p-7 backdrop-blur-2xl sm:p-9">
              <div className="mb-7 flex flex-col items-center text-center">
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] shadow-[0_0_30px_rgba(139,92,246,0.4)]">
                  <SignalMark className="h-6 w-6" />
                </span>
                <h1 className="font-display text-[24px] font-semibold text-white">Welcome back</h1>
                <p className="mt-1.5 text-sm text-white/50">Continue your preparation journey.</p>
              </div>

              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}