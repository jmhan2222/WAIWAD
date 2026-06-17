import { useState, useRef } from 'react'
import { Mic, Square, RotateCcw, Play, AlertCircle, Clock } from 'lucide-react'
import { useRecorder } from '../hooks/useRecorder'
import { useGroq, GroqError } from '../hooks/useGroq'
import type { FeedbackResult } from '../types'

interface Props {
  plain: string
  lang: 'ko' | 'en' | 'ja' | 'ca'
  scriptName: string
  onFeedback: (result: FeedbackResult) => void
}

interface ApiError {
  message: string
  isRateLimit: boolean
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function Recorder({ plain, lang, scriptName, onFeedback }: Props) {
  const { recordingState, audioURL, audioBlob, elapsedTime, startRecording, stopRecording, resetRecording } = useRecorder()
  const { transcribeAudio, generateFeedback, isTranscribing, isAnalyzing } = useGroq()
  const [apiError, setApiError] = useState<ApiError | null>(null)
  const [audioPlayError, setAudioPlayError] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handleFeedback = async () => {
    if (!audioBlob) return
    setApiError(null)
    try {
      const transcription = await transcribeAudio(audioBlob, lang)
      const result = await generateFeedback(plain, transcription, lang, scriptName)
      onFeedback(result)
    } catch (e) {
      if (e instanceof GroqError) {
        setApiError({ message: e.message, isRateLimit: e.isRateLimit })
      } else {
        setApiError({ message: '오류가 발생했습니다. 다시 시도해 주세요.', isRateLimit: false })
      }
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
        {/* 로딩 */}
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

        {/* 녹음 시작 전 */}
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

        {/* 녹음 중 */}
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

        {/* 녹음 완료 */}
        {!isProcessing && recordingState === 'stopped' && (
          <div className="space-y-3">
            {audioURL && !audioPlayError && (
              <audio
                ref={audioRef}
                src={audioURL}
                controls
                className="w-full h-9"
                onError={() => setAudioPlayError(true)}
              />
            )}
            {audioPlayError && (
              <p className="text-xs text-[#8E8E93] text-center py-2">
                이 브라우저에서는 재생이 지원되지 않아요. 다른 브라우저로 시도해보세요.
              </p>
            )}

            {/* 에러 박스 */}
            {apiError && (
              <div className={`rounded-xl p-3.5 border flex gap-3 items-start ${
                apiError.isRateLimit
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                {apiError.isRateLimit
                  ? <Clock size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  : <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                }
                <p className={`text-sm leading-relaxed ${
                  apiError.isRateLimit ? 'text-amber-800' : 'text-red-800'
                }`}>
                  {apiError.message}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {/* 에러 시: 다시 시도 (같은 오디오로) */}
              {apiError ? (
                <button
                  onClick={handleFeedback}
                  className="w-full py-3 bg-[#E8361E] text-white rounded-xl font-medium hover:bg-[#c82d18] transition-colors flex items-center justify-center gap-2"
                >
                  <Play size={16} />
                  다시 시도
                </button>
              ) : (
                <button
                  onClick={handleFeedback}
                  className="w-full py-3 bg-[#E8361E] text-white rounded-xl font-medium hover:bg-[#c82d18] transition-colors flex items-center justify-center gap-2"
                >
                  <Play size={16} />
                  AI 피드백 받기
                </button>
              )}

              <button
                onClick={() => { setApiError(null); setAudioPlayError(false); resetRecording() }}
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
