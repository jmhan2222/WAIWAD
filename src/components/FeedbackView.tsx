import { useState } from 'react'
import { ChevronDown, ChevronUp, MessageSquare, Search, ArrowRight, AlertCircle } from 'lucide-react'
import type { FeedbackResult } from '../types'

interface Props {
  result: FeedbackResult
  onDrill: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  fluency: '유창성',
  voice: '분위기·목소리',
  intonation: '억양',
  pronunciation: '발음',
}

const SCORE_PCT: Record<string, number> = {
  '상': 88, '중': 58, '하': 24,
  high: 88, medium: 58, low: 24,
}
const SCORE_COLOR: Record<string, string> = {
  '상': '#34C759', '중': '#FF9500', '하': '#FF3B30',
  high: '#34C759', medium: '#FF9500', low: '#FF3B30',
}
const SCORE_LABEL_MAP: Record<string, string> = {
  '상': '상', '중': '중', '하': '하',
  high: '상', medium: '중', low: '하',
}

function CircleGauge({ score }: { score: string }) {
  const pct = SCORE_PCT[score] ?? 50
  const color = SCORE_COLOR[score] ?? '#8E8E93'
  const label = SCORE_LABEL_MAP[score] ?? score
  const R = 22
  const C = 2 * Math.PI * R
  const dash = (pct / 100) * C

  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg width="56" height="56" viewBox="0 0 56 56" className="absolute inset-0">
        <circle cx="28" cy="28" r={R} fill="none" stroke="#E5E5EA" strokeWidth="4.5" />
        <circle
          cx="28" cy="28" r={R}
          fill="none" stroke={color} strokeWidth="4.5"
          strokeDasharray={`${dash} ${C}`}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>{label}</span>
      </div>
    </div>
  )
}

export function FeedbackView({ result, onDrill }: Props) {
  const { categories, summary, weakest, nextStep } = result
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggle = (key: string) =>
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="space-y-3">
      {/* 부분 녹음 경고 */}
      {result.partial && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex gap-3 items-start">
          <AlertCircle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">
            방송문의 일부만 읽으신 것 같아요. 읽으신 부분에 대해서만 피드백을 드릴게요.{' '}
            전체 방송문 중 약 {result.partial}% 정도를 읽으신 것으로 보여요.{' '}
            전체 평가를 받으려면 방송문 전체를 읽어주세요.
          </p>
        </div>
      )}

      {/* Summary — dark gradient card */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #1D1D1F 100%)' }}
      >
        <p className="text-[10px] font-semibold text-white/40 mb-2 uppercase tracking-widest">AI 총평</p>
        <p className="text-sm text-white leading-relaxed">{summary}</p>
        {nextStep && (
          <div className="mt-3 flex items-start gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-medium flex-shrink-0 mt-0.5">
              다음 목표
            </span>
            <p className="text-xs text-white/60 leading-relaxed">{nextStep}</p>
          </div>
        )}
      </div>

      {/* Category cards */}
      <div className="space-y-2">
        {(Object.entries(categories) as [keyof typeof categories, typeof categories[keyof typeof categories]][]).map(([key, cat]) => {
          const isOpen = !!expanded[key]
          return (
            <div key={key} className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden">
              <button
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-[#F5F5F7]"
                onClick={() => toggle(key)}
              >
                <CircleGauge score={cat.score} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1D1D1F] text-sm">{CATEGORY_LABELS[key]}</p>
                  <p className="text-xs text-[#6E6E73] mt-0.5 leading-snug line-clamp-1">{cat.passengerImpression}</p>
                </div>
                {isOpen
                  ? <ChevronUp size={16} className="text-[#8E8E93] flex-shrink-0" />
                  : <ChevronDown size={16} className="text-[#8E8E93] flex-shrink-0" />
                }
              </button>

              {isOpen && (
                <div className="px-4 pb-4 border-t border-[#F5F5F7] pt-3 space-y-2.5">
                  {/* passengerImpression */}
                  <div className="flex gap-2.5 items-start">
                    <MessageSquare size={14} className="text-[#6E6E73] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-semibold text-[#8E8E93] mb-0.5 uppercase tracking-wide">승객은 이렇게 느꼈을 거예요</p>
                      <p className="text-sm text-[#1D1D1F] leading-relaxed">{cat.passengerImpression}</p>
                    </div>
                  </div>
                  {/* specificIssue */}
                  <div className="flex gap-2.5 items-start">
                    <Search size={14} className="text-[#FF9500] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-semibold text-[#FF9500] mb-0.5 uppercase tracking-wide">여기를 살펴보면</p>
                      <p className="text-sm text-[#1D1D1F] leading-relaxed">{cat.specificIssue}</p>
                    </div>
                  </div>
                  {/* actionGuide — highlighted */}
                  <div className="bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl p-3 flex gap-2.5 items-start">
                    <ArrowRight size={14} className="text-[#0284C7] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-semibold text-[#0284C7] mb-0.5 uppercase tracking-wide">이렇게 해보세요</p>
                      <p className="text-sm text-[#0C4A6E] leading-relaxed font-medium">{cat.actionGuide}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Drill CTA */}
      <button
        onClick={onDrill}
        className="w-full py-3.5 bg-[#1D1D1F] text-white rounded-2xl font-semibold text-sm transition-all active:scale-[0.98] hover:bg-black"
      >
        {CATEGORY_LABELS[weakest] ?? '약점'} 집중 드릴 시작 →
      </button>
    </div>
  )
}
