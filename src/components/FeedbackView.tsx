import type { FeedbackResult, FeedbackScore } from '../types'

interface Props {
  result: FeedbackResult
  onDrill: () => void
}

const CATEGORY_LABELS = {
  fluency: '유창성',
  voice: '분위기·목소리',
  intonation: '억양',
  pronunciation: '발음',
}

const SCORE_STYLE: Record<FeedbackScore, { label: string; bg: string; color: string }> = {
  '상': { label: '상', bg: '#EDF9F4', color: '#1D9E75' },
  '중': { label: '중', bg: '#FDF5E8', color: '#BA7517' },
  '하': { label: '하', bg: '#FEF0EE', color: '#E8361E' },
}

// English scores mapped to Korean display
const SCORE_STYLE_EN: Record<string, { label: string; bg: string; color: string }> = {
  high: { label: '상', bg: '#EDF9F4', color: '#1D9E75' },
  medium: { label: '중', bg: '#FDF5E8', color: '#BA7517' },
  low: { label: '하', bg: '#FEF0EE', color: '#E8361E' },
}

function getScoreStyle(score: string) {
  return SCORE_STYLE[score as FeedbackScore] ?? SCORE_STYLE_EN[score] ?? { label: score, bg: '#f5f5f5', color: '#666' }
}

export function FeedbackView({ result, onDrill }: Props) {
  const { categories, summary, weakest, nextStep } = result

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">AI 피드백 결과</h3>

      <div className="grid grid-cols-1 gap-3">
        {(Object.entries(categories) as [keyof typeof categories, typeof categories[keyof typeof categories]][]).map(([key, cat]) => {
          const scoreStyle = getScoreStyle(cat.score)
          return (
            <div key={key} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-800 text-sm">{CATEGORY_LABELS[key]}</span>
                <span
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: scoreStyle.bg, color: scoreStyle.color }}
                >
                  {scoreStyle.label}
                </span>
              </div>
              <div className="space-y-1.5 text-sm">
                <p className="text-gray-700">
                  <span className="text-[#1D9E75] font-medium mr-1">✓</span>
                  {cat.good}
                </p>
                <p className="text-gray-700">
                  <span className="text-[#BA7517] font-medium mr-1">!</span>
                  {cat.improve}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  <span className="mr-1">→</span>
                  {cat.drill}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <p className="text-xs text-gray-400 mb-1.5 font-medium">전체 총평</p>
        <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
        {nextStep && (
          <p className="text-xs text-[#185FA5] mt-2 font-medium">다음 포인트: {nextStep}</p>
        )}
      </div>

      <button
        onClick={onDrill}
        className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition-colors text-sm"
      >
        약점 집중 연습하기 → ({CATEGORY_LABELS[weakest]})
      </button>
    </div>
  )
}
