import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import type { FeedbackResult } from '../types'

interface Props {
  result: FeedbackResult
  onRetry: () => void
}

const CATEGORY_TITLES: Record<string, string> = {
  fluency: '유창성 집중 드릴',
  voice: '분위기·목소리 집중 드릴',
  intonation: '억양 집중 드릴',
  pronunciation: '발음 집중 드릴',
}

const FALLBACK_DRILLS = [
  '방송문을 보면서, 끊어읽기 표시(|)가 있는 곳에서만 의식적으로 쉬어가며 3번 읽어보세요.',
  'AI 피드백에서 지적된 문장 1개만 골라서, 그 문장만 10번 반복해서 읽어보세요.',
  '방송문을 보면서 읽되, 핵심 강조 단어(노란 표시)에서만 목소리를 또렷하게 내는 데 집중해보세요.',
  '전체를 다시 읽고 녹음해서, 이전 녹음과 비교해보세요.',
]

const CATEGORY_CHECKLISTS: Record<string, string[]> = {
  fluency: [
    '끊어읽기 표시(|)를 보고 자연스럽게 쉬었다',
    '중간에 막히거나 멈추지 않고 끝까지 읽었다',
    '자연스러운 속도로 읽었다',
    '강조 단어에서 목소리를 또렷하게 냈다',
  ],
  voice: [
    '목소리가 안정적이고 떨리지 않았다',
    '처음부터 끝까지 일정한 음량을 유지했다',
    '따뜻하고 전문적인 분위기를 전달했다',
    '강조 단어에서 목소리를 또렷하게 냈다',
  ],
  intonation: [
    '끊어읽기 표시를 보고 자연스럽게 쉬었다',
    '핵심 강조 단어에서 목소리를 또렷하게 냈다',
    '문장 마지막에 자연스럽게 음이 내려갔다',
    '단조롭지 않고 리듬감이 있었다',
  ],
  pronunciation: [
    '모든 단어를 정확하게 발음했다',
    '받침 발음이 명확했다',
    '연음 처리가 자연스러웠다',
    '강조 단어에서 목소리를 또렷하게 냈다',
  ],
}

export function DrillView({ result, onRetry }: Props) {
  const [checked, setChecked] = useState<boolean[]>([false, false, false, false])

  const weakest = result.weakest ?? 'fluency'
  const title = CATEGORY_TITLES[weakest] ?? '집중 드릴'
  const exercises = result.drills?.length ? result.drills : FALLBACK_DRILLS
  const checklist = CATEGORY_CHECKLISTS[weakest] ?? CATEGORY_CHECKLISTS.fluency
  const actionGuide = result.categories[weakest]?.actionGuide

  const toggle = (i: number) => {
    setChecked(prev => prev.map((v, idx) => idx === i ? !v : v))
  }

  const allChecked = checked.every(Boolean)

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-[#1D1D1F]">{title}</h3>
        {actionGuide && (
          <p className="text-xs text-[#6E6E73] mt-0.5 leading-relaxed">{actionGuide}</p>
        )}
      </div>

      <div className="space-y-2">
        {exercises.map((ex, i) => (
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
          {checklist.map((item, i) => (
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
