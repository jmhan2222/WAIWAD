import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import type { FeedbackResult } from '../types'

interface Props {
  result: FeedbackResult
  onRetry: () => void
}

const DRILLS: Record<string, { title: string; exercises: string[]; checklist: string[] }> = {
  fluency: {
    title: '유창성 집중 드릴',
    exercises: [
      '방송문을 3번 읽되, 매번 막히는 부분 없이 끝까지 읽어보세요.',
      '텍스트를 보지 않고 방송문 전체를 암기하여 읽어보세요.',
      '30초 안에 방송문을 처음부터 끝까지 읽는 연습을 반복하세요.',
    ],
    checklist: [
      '중간에 막히거나 멈추지 않았다',
      '자연스러운 속도로 읽었다',
      '전체 방송문을 한 호흡으로 연결했다',
      '텍스트 없이도 읽을 수 있다',
    ],
  },
  voice: {
    title: '분위기·목소리 집중 드릴',
    exercises: [
      '가슴 공명을 활용해 낮고 안정된 목소리로 방송문을 읽어보세요.',
      '실제 기내 방송처럼 미소를 유지하며 방송문을 읽어보세요.',
      '마이크 거리를 일정하게 유지하며 균일한 음량으로 읽어보세요.',
    ],
    checklist: [
      '목소리가 안정적이고 떨리지 않았다',
      '처음부터 끝까지 일정한 음량을 유지했다',
      '따뜻하고 전문적인 분위기를 전달했다',
      '미소가 목소리에서 느껴졌다',
    ],
  },
  intonation: {
    title: '억양 집중 드릴',
    exercises: [
      '끊어읽기 마커(|)에서 완전히 멈추며 방송문을 읽어보세요.',
      '올림(↗) 표시 단어에서 의도적으로 음을 높여 읽어보세요.',
      '내림(↘) 표시 단어에서 자연스럽게 음을 내리며 마무리하세요.',
    ],
    checklist: [
      '끊어읽기를 정확히 지켰다',
      '올림 억양이 자연스럽게 표현됐다',
      '문장 마지막에 자연스럽게 음이 내려갔다',
      '단조롭지 않고 리듬감이 있었다',
    ],
  },
  pronunciation: {
    title: '발음 집중 드릴',
    exercises: [
      '어려운 단어만 10번씩 반복 발음 연습을 해보세요.',
      '각 단어의 받침과 연음을 과장되게 발음하며 천천히 읽어보세요.',
      '녹음 후 직접 들어보며 불명확한 단어를 체크하세요.',
    ],
    checklist: [
      '모든 단어를 정확하게 발음했다',
      '받침 발음이 명확했다',
      '연음 처리가 자연스러웠다',
      '외래어 발음이 명확했다',
    ],
  },
}

export function DrillView({ result, onRetry }: Props) {
  const [checked, setChecked] = useState<boolean[]>([false, false, false, false])
  const drill = DRILLS[result.weakest] ?? DRILLS.fluency

  const toggle = (i: number) => {
    setChecked(prev => prev.map((v, idx) => idx === i ? !v : v))
  }

  const allChecked = checked.every(Boolean)

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-[#1D1D1F]">{drill.title}</h3>
        <p className="text-xs text-[#6E6E73] mt-0.5 leading-relaxed">
          {result.categories[result.weakest]?.improve}
        </p>
      </div>

      <div className="space-y-2">
        {drill.exercises.map((ex, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E5E5EA] p-4">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1D1D1F] text-white text-xs flex items-center justify-center font-semibold">
                {i + 1}
              </span>
              <p className="text-sm text-[#1D1D1F] leading-relaxed">{ex}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E5EA] p-4">
        <p className="text-xs font-semibold text-[#6E6E73] mb-3">자가 체크리스트</p>
        <div className="space-y-3">
          {drill.checklist.map((item, i) => (
            <label key={i} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={() => toggle(i)}
                className="mt-0.5 w-4 h-4 rounded accent-[#34C759] flex-shrink-0"
              />
              <span className={`text-sm leading-snug ${checked[i] ? 'text-[#34C759] line-through' : 'text-[#1D1D1F]'}`}>
                {item}
              </span>
            </label>
          ))}
        </div>
        {allChecked && (
          <p className="text-xs text-[#34C759] font-medium mt-3">
            모든 항목 완료! 이제 다시 녹음해보세요. 훨씬 나아질 거예요.
          </p>
        )}
      </div>

      <button
        onClick={onRetry}
        className="w-full py-3.5 bg-[#E8361E] text-white rounded-2xl font-semibold text-sm transition-all active:scale-[0.98] hover:bg-[#c82d18] flex items-center justify-center gap-2"
      >
        <RotateCcw size={15} />
        다시 녹음하기
      </button>
    </div>
  )
}
