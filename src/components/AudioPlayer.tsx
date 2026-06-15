import { useState, useRef, useCallback } from 'react'
import { Play, Pause } from 'lucide-react'

interface Props {
  scriptId: string
}

type VoiceVersion = 'instructor' | 'voice'

export function AudioPlayer({ scriptId }: Props) {
  const [version, setVersion] = useState<VoiceVersion>('instructor')
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const audioSrc = `/audio/${scriptId}-${version}.mp3`

  const handleTimeUpdate = useCallback(() => {
    const el = audioRef.current
    if (!el || !el.duration) return
    setProgress((el.currentTime / el.duration) * 100)
  }, [])

  const handleEnded = useCallback(() => {
    setIsPlaying(false)
    setProgress(0)
  }, [])

  const togglePlay = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    if (isPlaying) {
      el.pause()
      setIsPlaying(false)
    } else {
      el.play().catch(() => setIsPlaying(false))
      setIsPlaying(true)
    }
  }, [isPlaying])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current
    if (!el || !el.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    el.currentTime = pct * el.duration
    setProgress(pct * 100)
  }, [])

  const handleError = useCallback(() => {
    setIsPlaying(false)
  }, [])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex gap-2 mb-4">
        {(['instructor', 'voice'] as const).map(v => (
          <button
            key={v}
            onClick={() => {
              setVersion(v)
              setIsPlaying(false)
              setProgress(0)
            }}
            className={`px-3 py-1 text-sm rounded-full border transition-colors ${
              version === v
                ? 'bg-[#E8361E] text-white border-[#E8361E]'
                : 'text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            {v === 'instructor' ? '강사 버전' : '모델 보이스'}
          </button>
        ))}
      </div>

      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
      />

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#E8361E] text-white flex-shrink-0 hover:bg-[#c82d18] transition-colors"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <div
          className="flex-1 h-2 bg-gray-200 rounded-full cursor-pointer"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-[#E8361E] rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {progress === 0 && !isPlaying && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          샘플 보이스 준비 중 — 탭을 눌러 재생해보세요
        </p>
      )}
    </div>
  )
}
