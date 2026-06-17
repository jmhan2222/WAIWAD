import { useState, useRef, useCallback, useEffect } from 'react'

export type RecordingState = 'idle' | 'recording' | 'stopped'

function getSupportedMimeType(): string {
  const types = [
    'audio/mp4',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg',
  ]
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return ''
}

export function useRecorder() {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      stopTimer()
      if (audioURL) URL.revokeObjectURL(audioURL)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [stopTimer, audioURL])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = getSupportedMimeType()
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const actualMimeType = mediaRecorder.mimeType || mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: actualMimeType })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioURL(url)
        stream.getTracks().forEach(t => t.stop())
      }

      mediaRecorder.start()
      setRecordingState('recording')
      setElapsedTime(0)
      timerRef.current = setInterval(() => setElapsedTime(t => t + 1), 1000)
    } catch {
      alert('마이크 접근 권한이 필요합니다.')
    }
  }, [])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    stopTimer()
    setRecordingState('stopped')
  }, [stopTimer])

  const resetRecording = useCallback(() => {
    if (audioURL) URL.revokeObjectURL(audioURL)
    setAudioBlob(null)
    setAudioURL(null)
    setElapsedTime(0)
    setRecordingState('idle')
  }, [audioURL])

  return { recordingState, audioBlob, audioURL, elapsedTime, startRecording, stopRecording, resetRecording }
}
