import { useState } from 'react'
import { Mic, Square, RotateCcw } from 'lucide-react'
import { useRecorder } from '../hooks/useRecorder'

interface Props {
  targetText: string
  attempts: number
  onAttempt: () => void
}

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  return `${m}:${(s % 60).toString().padStart(2, '0')}`
}

function getEncouragement(attempts: number): string {
  if (attempts === 0) return '처음 도전이에요! 방송문을 보면서 천천히 읽어보세요.'
  if (attempts === 1) return '두 번째 시도예요! 첫 녹음을 들어보고 비교해보세요.'
  if (attempts === 2) return '세 번째예요! 집중해서 읽어보세요.'
  if (attempts < 7) return `벌써 ${attempts + 1}번째예요! 꾸준히 하는 게 최고예요.`
  return `${attempts + 1}번 도전 중이에요! 정말 열심히 하시는군요.`
}

export function MiniRecorder({ targetText, attempts, onAttempt }: Props) {
  const { recordingState, audioURL, elapsedTime, startRecording, stopRecording, resetRecording } = useRecorder()
  const [audioPlayError, setAudioPlayError] = useState(false)

  const handleStop = () => {
    stopRecording()
    onAttempt()
  }

  const handleRetry = () => {
    resetRecording()
    setAudioPlayError(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5EA] p-4 space-y-3">
      <div>
        <p className="text-[10px] font-semibold text-[#6E6E73] uppercase tracking-widest mb-1">구간 따라 읽기</p>
        <p className="text-sm text-[#6E6E73] leading-relaxed">{getEncouragement(attempts)}</p>
      </div>

      <div className="bg-[#F5F5F7] rounded-xl p-3">
        <p className="text-sm font-medium text-[#1D1D1F] leading-relaxed">{targetText}</p>
      </div>

      {recordingState === 'idle' && (
        <button
          onClick={startRecording}
          className="w-full py-2.5 bg-[#E8361E] text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#c82d18] transition-colors"
        >
          <Mic size={15} />
          따라 읽기 시작
        </button>
      )}

      {recordingState === 'recording' && (
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[#E8361E] text-sm">
            <span className="w-2 h-2 bg-[#E8361E] rounded-full animate-pulse" />
            <span className="font-mono">{formatTime(elapsedTime)}</span>
          </span>
          <button
            onClick={handleStop}
            className="flex-1 py-2.5 bg-gray-800 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2"
          >
            <Square size={14} />
            녹음 완료
          </button>
        </div>
      )}

      {recordingState === 'stopped' && (
        <div className="space-y-2">
          {audioURL && !audioPlayError && (
            <audio
              src={audioURL}
              controls
              className="w-full h-9"
              onError={() => setAudioPlayError(true)}
            />
          )}
          {audioPlayError && (
            <p className="text-xs text-[#8E8E93] text-center py-1">재생이 지원되지 않아요. 다른 브라우저를 시도해보세요.</p>
          )}
          <button
            onClick={handleRetry}
            className="w-full py-2.5 border border-[#E5E5EA] text-[#1D1D1F] rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#F5F5F7] transition-colors"
          >
            <RotateCcw size={14} />
            한번 더
          </button>
        </div>
      )}
    </div>
  )
}
