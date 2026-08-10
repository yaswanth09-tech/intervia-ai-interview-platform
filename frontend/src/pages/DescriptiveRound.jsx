import { useEffect, useRef, useState } from 'react'
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

export default function DescriptiveRound() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answeredIds, setAnsweredIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [mode, setMode] = useState('text') // 'text' | 'voice'
  const [textAnswer, setTextAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [transcribing, setTranscribing] = useState(false)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  useEffect(() => {
    if (!sessionId) {
      setError('No session found. Go back and start an interview.')
      setLoading(false)
      return
    }
    api
      .get(`/interview/session/${sessionId}`)
      .then((res) => setQuestions(res.data.descriptive || []))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load questions.'))
      .finally(() => setLoading(false))
  }, [sessionId])

  const current = questions[currentIndex]

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setRecordedBlob(blob)
        stream.getTracks().forEach((t) => t.stop())
        transcribeRecording(blob)
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      setRecordedBlob(null)
      setVoiceTranscript('')
    } catch (err) {
      setError('Microphone access denied. Switch to text answer instead.')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  async function transcribeRecording(blob) {
    setTranscribing(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', blob, 'answer.webm')
      const res = await api.post(
        `/interview/answer/voice?session_id=${sessionId}&question_id=${current.id}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      setVoiceTranscript(res.data.answer_text || '')
      setAnsweredIds((prev) => new Set(prev).add(current.id))
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to transcribe answer. Try recording again.')
      setRecordedBlob(null)
    } finally {
      setTranscribing(false)
    }
  }

  async function goToNextQuestion() {
    setTextAnswer('')
    setRecordedBlob(null)
    setVoiceTranscript('')
    setError('')
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setSubmitting(true)
      try {
        await api.post('/interview/evaluate', { session_id: sessionId })
      } catch (err) {
        console.warn('Evaluation trigger warning:', err)
      } finally {
        setSubmitting(false)
        navigate(`/interview/results?session_id=${sessionId}`)
      }
    }
  }

  async function handleSubmitText() {
    if (!textAnswer.trim()) {
      setError('Please write an answer, or use skip.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await api.post('/interview/answer/text', {
        session_id: sessionId,
        question_id: current.id,
        answer_text: textAnswer.trim(),
      })
      setAnsweredIds((prev) => new Set(prev).add(current.id))
      goToNextQuestion()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit answer.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmitVoice() {
    if (!recordedBlob) {
      setError('Record an answer first, or use skip.')
      return
    }
    if (transcribing) {
      setError('Still transcribing your recording — one moment.')
      return
    }
    if (!voiceTranscript.trim()) {
      setError('Transcription came back empty. Try re-recording, or type your answer instead.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      // Send whatever is currently in the (reviewable/editable) transcript box as the
      // final answer, so the saved answer always matches what the candidate saw and
      // approved — not necessarily the raw, unreviewed transcription.
      await api.post('/interview/answer/text', {
        session_id: sessionId,
        question_id: current.id,
        answer_text: voiceTranscript.trim(),
      })
      setAnsweredIds((prev) => new Set(prev).add(current.id))
      goToNextQuestion()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit answer.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSkip() {
    setSubmitting(true)
    setError('')
    try {
      await api.post('/interview/answer/skip', {
        session_id: sessionId,
        question_id: current.id,
      })
      goToNextQuestion()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to skip question.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <PageShell>
        <main className="mx-auto max-w-2xl px-6 py-16 text-center text-sm text-white/45">
          loading questions…
        </main>
      </PageShell>
    )
  }

  if (!current) {
    return (
      <PageShell>
        <main className="mx-auto max-w-2xl px-6 py-16 text-center text-sm text-white/45">
          {error || 'No descriptive questions found.'}
        </main>
      </PageShell>
    )
  }

  const progress = ((currentIndex + 1) / questions.length) * 100

  return (
    <PageShell>
      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-white/85">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-white/45">{Math.round(progress)}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 shadow-[0_0_10px_rgba(139,92,246,0.6)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">
          {current.topic && (
            <span className="mb-2 inline-block rounded-md border border-violet-400/20 bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-200">
              {current.topic}
            </span>
          )}
          <h2 className="mb-6 text-lg font-semibold leading-relaxed text-white whitespace-pre-wrap break-words">{current.question}</h2>

          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setMode('text')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                mode === 'text'
                  ? 'bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500 text-white shadow-[0_10px_25px_-12px_rgba(124,58,237,0.7)]'
                  : 'border border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20'
              }`}
            >
              ✍️ Type answer
            </button>
            <button
              onClick={() => setMode('voice')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                mode === 'voice'
                  ? 'bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500 text-white shadow-[0_10px_25px_-12px_rgba(124,58,237,0.7)]'
                  : 'border border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20'
              }`}
            >
              🎙️ Record answer
            </button>
          </div>

          {mode === 'text' ? (
            <textarea
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              rows={6}
              placeholder="Type your answer here..."
              className="w-full appearance-none rounded-xl bg-white/[0.03] p-3 text-sm text-white/90 placeholder:text-white/30 outline-none ring-1 ring-inset ring-white/10 transition focus:ring-violet-400/50"
            />
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">
              {!isRecording && !recordedBlob && (
                <button
                  onClick={startRecording}
                  className="rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500 px-6 py-3 text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(124,58,237,0.6)] transition hover:brightness-110"
                >
                  ● Start recording
                </button>
              )}
              {isRecording && (
                <button
                  onClick={stopRecording}
                  className="animate-pulse rounded-full bg-red-500 px-6 py-3 text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(239,68,68,0.6)]"
                >
                  ■ Stop recording
                </button>
              )}
              {recordedBlob && !isRecording && (
                <div>
                  <audio controls src={URL.createObjectURL(recordedBlob)} className="mx-auto mb-3" />
                  <button
                    onClick={startRecording}
                    className="text-sm text-white/50 underline hover:text-white/80"
                  >
                    Re-record
                  </button>

                  {transcribing ? (
                    <p className="mt-4 flex items-center justify-center gap-2 text-sm text-white/50">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
                      Transcribing your answer…
                    </p>
                  ) : (
                    <div className="mt-4 text-left">
                      <label className="mb-1.5 block text-xs font-medium text-white/45">
                        Transcribed answer — review and edit if needed
                      </label>
                      <textarea
                        value={voiceTranscript}
                        onChange={(e) => setVoiceTranscript(e.target.value)}
                        rows={5}
                        placeholder="Transcription will appear here…"
                        className="w-full appearance-none rounded-xl bg-white/[0.03] p-3 text-sm text-white/90 placeholder:text-white/30 outline-none ring-1 ring-inset ring-white/10 transition focus:ring-violet-400/50"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={handleSkip}
            disabled={submitting}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/[0.07] disabled:opacity-50"
          >
            Skip question
          </button>
          <button
            onClick={mode === 'text' ? handleSubmitText : handleSubmitVoice}
            disabled={submitting || (mode === 'voice' && (transcribing || (recordedBlob && !voiceTranscript.trim())))}
            className="ml-auto rounded-lg bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500 px-6 py-2 text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(124,58,237,0.6)] transition hover:brightness-110 disabled:opacity-50"
          >
            {submitting
              ? 'Submitting…'
              : mode === 'voice' && transcribing
              ? 'Transcribing…'
              : currentIndex < questions.length - 1
              ? 'Submit & next →'
              : 'Submit & finish'}
          </button>
        </div>
      </main>
    </PageShell>
  )
}