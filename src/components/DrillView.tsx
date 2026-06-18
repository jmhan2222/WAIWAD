import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import type { FeedbackResult, MarkupSegment } from '../types'
import { MarkupScript } from './MarkupScript'
import { AudioPlayer } from './AudioPlayer'
import { MiniRecorder } from './MiniRecorder'

interface Props {
  result: FeedbackResult
  onRetry: () => void
  scriptId: string
  segments: MarkupSegment[] | null
  announcementId: string
}

const CATEGORY_TITLES: Record<string, string> = {
  fluency: '유창성',
  voice: '분위기·목소리',
  intonation: '억양',
  pronunciation: '발음',
}

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

function getSegmentsForFocus(allSegments: MarkupSegment[] | null, focusText: string): MarkupSegment[] {
  if (!allSegments || !focusText) return [{ text: focusText, types: ['normal'] }]

  const fullText = allSegments.map(s => s.text).join('')
  const normalized = focusText.trim()
  const idx = fullText.indexOf(normalized)

  if (idx === -1) return [{ text: focusText, types: ['normal'] }]

  const end = idx + normalized.length
  let pos = 0
  const filtered: MarkupSegment[] = []

  for (const seg of allSegments) {
    const segStart = pos
    pos += seg.text.length
    if (pos > idx && segStart < end) filtered.push(seg)
  }

  return filtered.length > 0 ? filtered : [{ text: focusText, types: ['normal'] }]
}

const DOT_SIZES = [7, 9, 11, 13]
const ENCOURAGEMENTS = [
  '',
  '',
  '',
  '자연스러움이 늘고 있어요!',
  '집중력이 대단해요!',
  '꾸준히 하는 게 최고예요!',
]

function DrillCompletionCard({ category, focusText, attempts }: {
  category: string
  focusText: string
  attempts: number
}) {
  const filledCount = Math.min(attempts, 4)
  const msg = ENCOURAGEMENTS[Math.min(attempts, ENCOURAGEMENTS.length - 1)]
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(232,54,30,0.07) 100%)',
        border: '1px solid rgba(139,92,246,0.2)',
      }}
    >
      {/* Pill badge */}
      <div className="flex justify-center mb-4">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/80 text-purple-600 shadow-sm"
          style={{ border: '1px solid rgba(139,92,246,0.25)' }}>
          ✦ {CATEGORY_TITLES[category] ?? category} 집중 연습 후
        </span>
      </div>

      {/* Big quote */}
      {focusText && (
        <p className="text-center text-[17px] font-bold text-[#1D1D1F] leading-snug mb-5 px-2">
          &ldquo;{focusText}&rdquo;
        </p>
      )}

      {/* Dots — growing sizes = visual progress */}
      <div className="flex items-end justify-center gap-2 mb-3">
        {DOT_SIZES.map((size, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-500"
            style={{
              width: size,
              height: size,
              background: i < filledCount
                ? `rgba(139,92,246,${0.5 + i * 0.15})`
                : '#E5E5EA',
              transform: i < filledCount ? 'scale(1)' : 'scale(0.85)',
            }}
          />
        ))}
      </div>

      {/* Text */}
      <p className="text-center text-sm text-[#1D1D1F] font-medium">
        오늘 이 구간을{' '}
        <span className="font-bold" style={{ color: '#8B5CF6' }}>{attempts}번</span>
        {' '}연습했어요
      </p>
      {msg && (
        <p className="text-center text-xs text-[#6E6E73] mt-0.5">{msg}</p>
      )}
    </div>
  )
}

export function DrillView({ result, onRetry, scriptId, segments, announcementId }: Props) {
  const weakest = result.weakest ?? 'fluency'
  const checklist = CATEGORY_CHECKLISTS[weakest] ?? CATEGORY_CHECKLISTS.fluency
  const focusSegment = result.focusSegment
  const actionGuide = result.categories[weakest]?.actionGuide

  const localKey = `drill_attempts_${announcementId}_${weakest}`
  const [attempts, setAttempts] = useState(() => parseInt(localStorage.getItem(localKey) ?? '0', 10))
  const [checked, setChecked] = useState<boolean[]>(checklist.map(() => false))

  const handleAttempt = () => {
    setAttempts(prev => {
      const n = prev + 1
      localStorage.setItem(localKey, String(n))
      return n
    })
  }

  const toggle = (i: number) => {
    setChecked(prev => prev.map((v, idx) => idx === i ? !v : v))
  }

  const allChecked = checked.every(Boolean)
  const focusSegments = focusSegment ? getSegmentsForFocus(segments, focusSegment.text) : null

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div>
        <h3 className="font-semibold text-[#1D1D1F]">{CATEGORY_TITLES[weakest] ?? '약점'} 집중 드릴</h3>
        {actionGuide && (
          <p className="text-xs text-[#6E6E73] mt-0.5 leading-relaxed">{actionGuide}</p>
        )}
      </div>

      {/* Section A: 집중 연습 구간 */}
      {focusSegment && (
        <div className="bg-white rounded-2xl border border-[#E5E5EA] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold text-[#6E6E73] uppercase tracking-widest">집중 연습 구간</p>
            <span className="text-[10px] text-[#8E8E93] bg-[#F5F5F7] px-2 py-0.5 rounded-full">
              이 구간 연습: {attempts}회
            </span>
          </div>
          <p className="text-xs text-[#8E8E93] mb-3 leading-relaxed">{focusSegment.reason}</p>
          <div className="bg-[#F5F5F7] rounded-xl p-3">
            {focusSegments ? (
              <MarkupScript segments={focusSegments} compact />
            ) : (
              <p className="text-sm text-[#1D1D1F] leading-relaxed">{focusSegment.text}</p>
            )}
          </div>
        </div>
      )}

      {/* Section B: 모델 보이스 */}
      <div>
        <p className="text-[10px] font-semibold text-[#6E6E73] uppercase tracking-widest mb-2 px-1">
          모델 보이스 듣기
        </p>
        <AudioPlayer scriptId={scriptId} />
        {focusSegment && (
          <p className="text-xs text-[#8E8E93] mt-2 px-1 leading-relaxed">
            전체 방송 중 위 집중 구간을 특히 집중해서 들어보세요.
          </p>
        )}
      </div>

      {/* Section C: 미니 녹음 */}
      {focusSegment && (
        <MiniRecorder
          targetText={focusSegment.text}
          attempts={attempts}
          onAttempt={handleAttempt}
        />
      )}

      {/* focusSegment 없을 때 AI 드릴 목록 fallback */}
      {!focusSegment && result.drills && result.drills.length > 0 && (
        <div className="space-y-2">
          {result.drills.map((ex, i) => (
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
      )}

      {/* Section D: 완료 카드 (3회 이상 시도 시) */}
      {attempts >= 3 && focusSegment && (
        <DrillCompletionCard
          category={weakest}
          focusText={focusSegment.text}
          attempts={attempts}
        />
      )}

      {/* Section E: 체크리스트 */}
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
            모든 항목 완료! 이제 전체 방송문을 다시 녹음해보세요. 훨씬 나아질 거예요.
          </p>
        )}
      </div>

      {/* Section E: 전체 다시 녹음 */}
      <button
        onClick={onRetry}
        className="w-full py-3.5 bg-[#E8361E] text-white rounded-2xl font-semibold text-sm transition-all active:scale-[0.98] hover:bg-[#c82d18] flex items-center justify-center gap-2"
      >
        <RotateCcw size={15} />
        전체 방송문 다시 녹음하기
      </button>
    </div>
  )
}
