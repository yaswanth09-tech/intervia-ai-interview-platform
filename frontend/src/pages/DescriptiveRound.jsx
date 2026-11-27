import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'

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
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      setRecordedBlob(null)
    } catch (err) {
      setError('Microphone access denied. Switch to text answer instead.')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  async function goToNextQuestion() {
    setTextAnswer('')
    setRecordedBlob(null)
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
    setSubmitting(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', recordedBlob, 'answer.webm')
      await api.post(
        `/interview/answer/voice?session_id=${sessionId}&question_id=${current.id}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      setAnsweredIds((prev) => new Set(prev).add(current.id))
      goToNextQuestion()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to transcribe answer. Try again.')
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
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-2xl px-6 py-16 text-center text-sm text-muted">
          loading questions…
        </main>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-2xl px-6 py-16 text-center text-sm text-muted">
          {error || 'No descriptive questions found.'}
        </main>
      </div>
    )
  }

  const progress = ((currentIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-muted">{Math.round(progress)}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-border">
            <div
              className="h-full rounded-full bg-signal transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-sm border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-bad">
            {error}
          </div>
        )}

        <div className="rounded-lg border border-border bg-panel p-6">
          {current.topic && (
            <span className="mb-2 inline-block rounded-sm bg-signal-soft px-2 py-0.5 text-xs font-medium text-signal">
              {current.topic}
            </span>
          )}
          <h2 className="mb-6 text-lg font-semibold leading-relaxed">{current.question}</h2>

          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setMode('text')}
              className={`rounded-sm px-3 py-1.5 text-sm font-medium transition ${
                mode === 'text' ? 'bg-signal text-white' : 'border border-border text-muted'
              }`}
            >
              ✍️ Type answer
            </button>
            <button
              onClick={() => setMode('voice')}
              className={`rounded-sm px-3 py-1.5 text-sm font-medium transition ${
                mode === 'voice' ? 'bg-signal text-white' : 'border border-border text-muted'
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
              className="w-full rounded-sm border border-border p-3 text-sm outline-none focus:border-signal"
            />
          ) : (
            <div className="rounded-sm border border-border bg-paper p-6 text-center">
              {!isRecording && !recordedBlob && (
                <button
                  onClick={startRecording}
                  className="rounded-full bg-signal px-6 py-3 text-sm font-medium text-white hover:bg-signal/90"
                >
                  ● Start recording
                </button>
              )}
              {isRecording && (
                <button
                  onClick={stopRecording}
                  className="animate-pulse rounded-full bg-bad px-6 py-3 text-sm font-medium text-white"
                >
                  ■ Stop recording
                </button>
              )}
              {recordedBlob && !isRecording && (
                <div>
                  <audio controls src={URL.createObjectURL(recordedBlob)} className="mx-auto mb-3" />
                  <button
                    onClick={startRecording}
                    className="text-sm text-muted underline hover:text-ink"
                  >
                    Re-record
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={handleSkip}
            disabled={submitting}
            className="rounded-sm border border-border px-4 py-2 text-sm font-medium text-muted hover:border-ink disabled:opacity-50"
          >
            Skip question
          </button>
          <button
            onClick={mode === 'text' ? handleSubmitText : handleSubmitVoice}
            disabled={submitting}
            className="ml-auto rounded-sm bg-signal px-6 py-2 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-50"
          >
            {submitting
              ? mode === 'voice'
                ? 'Transcribing…'
                : 'Submitting…'
              : currentIndex < questions.length - 1
              ? 'Submit & next →'
              : 'Submit & finish'}
          </button>
        </div>
      </main>
    </div>
  )
}