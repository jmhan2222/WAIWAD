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

// 시도 순서: wav → mp3 → m4a
const EXTS = ['wav', 'mp3', 'm4a'] as const
type Ext = typeof EXTS[number]

export function AudioPlayer({ scriptId }: Props) {
  const [gender, setGender]       = useState<Gender>('female')
  const [extIndex, setExtIndex]   = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress]   = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const ext: Ext = EXTS[extIndex]
  const audioSrc = `/audio/${scriptId}-model-${GENDER_CODE[gender]}.${ext}`

  // scriptId 또는 gender 변경 시 초기화
  useEffect(() => {
    const el = audioRef.current
    if (el) el.pause()
    setIsPlaying(false)
    setProgress(0)
    setExtIndex(0)
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

  // 포맷 fallback: wav → mp3 → m4a 순으로 시도
  // fallback 시 재생 중이었으면 새 포맷으로 즉시 재개
  const handleError = useCallback(() => {
    const nextIndex = extIndex + 1
    if (nextIndex < EXTS.length) {
      setExtIndex(nextIndex)
      if (isPlaying && audioRef.current) {
        const newSrc = `/audio/${scriptId}-model-${GENDER_CODE[gender]}.${EXTS[nextIndex]}`
        audioRef.current.src = newSrc
        audioRef.current.play().catch(() => setIsPlaying(false))
      }
    } else {
      setIsPlaying(false)
    }
  }, [extIndex, isPlaying, scriptId, gender])

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
    <div className="bg-white rounded-2xl border border-[#E5E5EA] p-4">
      {/* 성별 토글 */}
      <div className="flex gap-2 mb-4">
        {(['female', 'male'] as Gender[]).map(g => (
          <button
            key={g}
            onClick={() => handleGenderChange(g)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all active:scale-95 ${
              gender === g
                ? 'bg-[#E8361E] text-white border-[#E8361E]'
                : 'text-[#6E6E73] border-[#E5E5EA] hover:border-[#8E8E93] bg-white'
            }`}
          >
            {g === 'female' ? <Users size={12} /> : <User size={12} />}
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
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#E8361E] text-white flex-shrink-0 hover:bg-[#c82d18] transition-all active:scale-95"
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <div
          className="flex-1 h-1.5 bg-[#E5E5EA] rounded-full cursor-pointer"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-[#E8361E] rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {progress === 0 && !isPlaying && (
        <p className="text-xs text-[#8E8E93] mt-3 text-center">
          모델 보이스 — 버튼을 눌러 재생해보세요
        </p>
      )}
    </div>
  )
}
