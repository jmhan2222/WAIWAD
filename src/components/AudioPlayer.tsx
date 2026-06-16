import { useState, useRef, useCallback, useEffect } from 'react'
import { Play, Pause, User, Users } from 'lucide-react'

interface Props {
  scriptId: string   // "{announcementId}-{lang}"  예: "2-3-ko"
}

type Gender = 'male' | 'female'

const GENDER_LABELS: Record<Gender, string> = {
  male: '남성 보이스',
  female: '여성 보이스',
}

const GENDER_CODE: Record<Gender, string> = {
  male: 'm',
  female: 'f',
}

export function AudioPlayer({ scriptId }: Props) {
  const [gender, setGender]     = useState<Gender>('female')
  const [ext, setExt]           = useState<'wav' | 'mp3'>('wav')
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const audioSrc = `/audio/${scriptId}-model-${GENDER_CODE[gender]}.${ext}`

  // scriptId 또는 gender 변경 시 재생 상태 초기화
  useEffect(() => {
    if (audioRef.current) audioRef.current.pause()
    setIsPlaying(false)
    setProgress(0)
    setExt('wav')
  }, [scriptId, gender])

  const handleGenderChange = useCallback((g: Gender) => {
    setGender(g)
  }, [])

  const handleTimeUpdate = useCallback(() => {
    const el = audioRef.current
    if (!el || !el.duration) return
    setProgress((el.currentTime / el.duration) * 100)
  }, [])

  const handleEnded = useCallback(() => {
    setIsPlaying(false)
    setProgress(0)
  }, [])

  // .wav 없으면 .mp3 로 fallback
  const handleError = useCallback(() => {
    if (ext === 'wav') {
      setExt('mp3')
    } else {
      setIsPlaying(false)
    }
  }, [ext])

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
    el.currentTime = ((e.clientX - rect.left) / rect.width) * el.duration
    setProgress((el.currentTime / el.duration) * 100)
  }, [])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* 성별 토글 */}
      <div className="flex gap-2 mb-4">
        {(['female', 'male'] as Gender[]).map(g => (
          <button
            key={g}
            onClick={() => handleGenderChange(g)}
            className={`flex items-center gap-1.5 px-3 py-1 text-sm rounded-full border transition-colors ${
              gender === g
                ? 'bg-[#E8361E] text-white border-[#E8361E]'
                : 'text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            {g === 'female' ? <Users size={13} /> : <User size={13} />}
            {GENDER_LABELS[g]}
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

      {/* 재생 컨트롤 */}
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
          모델 보이스 — 버튼을 눌러 재생해보세요
        </p>
      )}
    </div>
  )
}
