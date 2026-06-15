import { useRef } from 'react'
import { Mic, Square, RotateCcw, Play } from 'lucide-react'
import { useRecorder } from '../hooks/useRecorder'
import { useGroq } from '../hooks/useGroq'
import type { FeedbackResult } from '../types'

interface Props {
  plain: string
  lang: 'ko' | 'en'
  scriptName: string
  onFeedback: (result: FeedbackResult) => void
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function Recorder({ plain, lang, scriptName, onFeedback }: Props) {
  const { recordingState, audioURL, audioBlob, elapsedTime, startRecording, stopRecording, resetRecording } = useRecorder()
  const { transcribeAudio, generateFeedback, isTranscribing, isAnalyzing } = useGroq()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handleFeedback = async () => {
    if (!audioBlob) return
    try {
      const transcription = await transcribeAudio(audioBlob, lang)
      const result = await generateFeedback(plain, transcription, lang, scriptName)
      onFeedback(result)
    } catch {
      alert('피드백 생성 중 오류가 발생했습니다. API 키를 확인해 주세요.')
    }
  }

  const isProcessing = isTranscribing || isAnalyzing

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <p className="text-xs text-gray-400 mb-1">방송문 참고</p>
        <p className="text-sm text-gray-600 leading-relaxed">{plain}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {isProcessing && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div
              className="w-8 h-8 rounded-full animate-spin"
              style={{ border: '3px solid #E8361E', borderTopColor: 'transparent' }}
            />
            <p className="text-sm text-gray-500">
              {isTranscribing ? '음성 분석 중...' : '피드백 생성 중...'}
            </p>
          </div>
        )}

        {!isProcessing && recordingState === 'idle' && (
          <div className="flex flex-col items-center gap-3 py-2">
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-6 py-3 bg-[#E8361E] text-white rounded-full font-medium hover:bg-[#c82d18] transition-colors"
            >
              <Mic size={18} />
              녹음 시작
            </button>
            <p className="text-xs text-gray-400">버튼을 눌러 방송문을 읽어보세요</p>
          </div>
        )}

        {!isProcessing && recordingState === 'recording' && (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="flex items-center gap-2 text-[#E8361E]">
              <span className="w-2.5 h-2.5 bg-[#E8361E] rounded-full animate-pulse" />
              <span className="font-mono text-lg font-semibold">{formatTime(elapsedTime)}</span>
            </div>
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-full font-medium hover:bg-gray-900 transition-colors"
            >
              <Square size={16} />
              녹음 중지
            </button>
          </div>
        )}

        {!isProcessing && recordingState === 'stopped' && (
          <div className="space-y-3">
            {audioURL && (
              <audio ref={audioRef} src={audioURL} controls className="w-full h-9" />
            )}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleFeedback}
                className="w-full py-3 bg-[#E8361E] text-white rounded-xl font-medium hover:bg-[#c82d18] transition-colors flex items-center justify-center gap-2"
              >
                <Play size={16} />
                AI 피드백 받기
              </button>
              <button
                onClick={resetRecording}
                className="w-full py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={14} />
                다시 녹음
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
