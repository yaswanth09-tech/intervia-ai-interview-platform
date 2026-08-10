import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardHeader from '../components/DashboardHeader'
import api from '../api/axios'

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path d="M12 15V4M12 4 7.5 8.5M12 4l4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 15v3.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true">
      <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6.25 10.2 8.8 12.7l5-5.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SectionCard({ title, children, empty }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/45">{title}</h3>
      {empty ? (
        <p className="text-sm text-white/40">Nothing detected in this section.</p>
      ) : (
        children
      )}
    </div>
  )
}

export default function ResumeUpload() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [parsed, setParsed] = useState(null)
  const [parsedResumeId, setParsedResumeId] = useState(null)

  function handleFileChange(e) {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setParsed(null)
      setError('')
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) {
      setFile(dropped)
      setParsed(null)
      setError('')
    }
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setParsed(res.data.parsed)
      setParsedResumeId(res.data.id)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to parse resume. Try a different file.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#0a0d20] via-[#0b0a1f] to-[#150a28] font-sans">
      {/* continuous grid + ambient glows, same treatment as the rest of the app */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '46px 46px',
          maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
        }}
      />
      <div className="pointer-events-none fixed -top-32 left-1/4 h-[28rem] w-[28rem] rounded-full bg-violet-600/15 blur-[130px]" />
      <div className="pointer-events-none fixed bottom-0 right-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

      <div className="relative z-10">
        <DashboardHeader />

        <main className="mx-auto max-w-3xl px-6 py-10">
          <h1 className="text-2xl font-bold tracking-tight text-white">Upload your resume</h1>
          <p className="mt-1.5 text-sm text-white/50">
            PDF only, up to 5MB. We'll pull out your skills, education, and experience to build
            questions around them.
          </p>

          {!parsed && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="mt-6 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] p-10 text-center backdrop-blur-xl transition hover:border-violet-400/30 hover:bg-white/[0.03]"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-violet-300 shadow-[0_0_24px_rgba(139,92,246,0.25)]">
                <UploadIcon />
              </div>

              <p className="text-sm text-white/50">Drag and drop your PDF here, or</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/20 hover:text-white"
              >
                Choose file
              </button>

              {file && (
                <p className="mt-4 font-mono text-sm text-white/70">
                  {file.name} <span className="text-white/35">({(file.size / 1024).toFixed(0)} KB)</span>
                </p>
              )}

              {error && (
                <div className="mt-4 rounded-lg border border-red-400/25 bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-200">
                  {error}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(139,92,246,0.6)] transition hover:shadow-[0_14px_36px_-8px_rgba(139,92,246,0.8)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none sm:w-auto sm:px-8"
              >
                {uploading ? 'Parsing…' : 'Upload and parse'}
              </button>
            </div>
          )}

          {parsed && (
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                <CheckCircleIcon />
                <span>
                  Resume parsed successfully. Review what we found below — this is what your
                  questions will be based on.
                </span>
              </div>

              <SectionCard title="Skills" empty={parsed.skills.length === 0}>
                <div className="flex flex-wrap gap-2">
                  {parsed.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-violet-500/15 px-2.5 py-1 text-sm text-violet-200 ring-1 ring-inset ring-violet-400/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Experience" empty={parsed.experience.length === 0}>
                <div className="space-y-4">
                  {parsed.experience.map((entry, i) => (
                    <div key={i}>
                      <p className="text-sm font-medium text-white/85">
                        {entry.organization || 'Unknown organization'}
                        {entry.date_range && (
                          <span className="ml-2 font-mono text-xs text-white/40">
                            {entry.date_range}
                          </span>
                        )}
                      </p>
                      <ul className="mt-1 list-inside list-disc text-sm text-white/55">
                        {entry.details.slice(0, 4).map((d, j) => (
                          <li key={j}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Education" empty={parsed.education.length === 0}>
                <div className="space-y-2">
                  {parsed.education.map((entry, i) => (
                    <p key={i} className="text-sm text-white/80">
                      {entry.institution || entry.raw_text}
                      {entry.date_range && (
                        <span className="ml-2 font-mono text-xs text-white/40">
                          {entry.date_range}
                        </span>
                      )}
                    </p>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Projects" empty={parsed.projects.length === 0}>
                <ul className="list-inside list-disc text-sm text-white/70">
                  {parsed.projects.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </SectionCard>

              <SectionCard title="Certifications" empty={parsed.certifications.length === 0}>
                <ul className="list-inside list-disc text-sm text-white/70">
                  {parsed.certifications.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </SectionCard>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setParsed(null)
                    setFile(null)
                  }}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/20 hover:text-white"
                >
                  Upload a different file
                </button>
                <button
                  onClick={() => navigate(`/interview/difficulty?resume_id=${parsedResumeId}`)}
                  className="rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(139,92,246,0.6)] transition hover:shadow-[0_14px_36px_-8px_rgba(139,92,246,0.8)] hover:brightness-110"
                >
                  Continue → choose difficulty
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}