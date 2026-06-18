import { useMemo, useState } from 'react'
import type { MarkupSegment, WordTimestamp } from '../types'
import {
  buildReferenceRhythm,
  buildUserRhythm,
  analyzeRhythm,
  interpolate,
} from '../hooks/rhythmUtils'

const W = 360
const H_CHART = 72
const H_LABEL = 22
const H_TOTAL = H_CHART + H_LABEL + 4
const PAD_X = 0

function toSvgX(pos: number) { return PAD_X + pos * (W - PAD_X * 2) }
function toSvgY(intensity: number) { return H_CHART - intensity * (H_CHART - 6) }

function buildSmoothPath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length < 2) return ''
  const d: string[] = [`M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`]
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]
    const curr = pts[i]
    const dx = (curr.x - prev.x) * 0.45
    d.push(
      `C ${(prev.x + dx).toFixed(1)} ${prev.y.toFixed(1)} ${(curr.x - dx).toFixed(1)} ${curr.y.toFixed(1)} ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`
    )
  }
  return d.join(' ')
}

function rhythmToSvgPts(
  refOrUser: ReturnType<typeof buildReferenceRhythm>,
  sampleCount = 80,
) {
  return Array.from({ length: sampleCount }, (_, i) => {
    const pos = i / (sampleCount - 1)
    return {
      x: toSvgX(pos),
      y: toSvgY(interpolate(refOrUser, pos)),
    }
  })
}

function FilledArea({ pts }: { pts: Array<{ x: number; y: number }> }) {
  if (pts.length < 2) return null
  const top = buildSmoothPath(pts)
  const bottom = `L ${pts[pts.length - 1].x.toFixed(1)} ${H_CHART} L ${pts[0].x.toFixed(1)} ${H_CHART} Z`
  return (
    <path
      d={`${top} ${bottom}`}
      fill="url(#refGrad)"
      opacity={0.55}
    />
  )
}

const ISSUE_LABEL: Record<string, string> = {
  missing_stress: '강조 부족',
  too_fast: '너무 빠름',
  too_slow: '너무 느림',
  missing_pause: '쉼 없음',
  extra_pause: '과한 멈춤',
}
const ISSUE_TIP: Record<string, string> = {
  missing_stress: '이 단어는 또렷하게 강조해서 읽어요',
  too_fast: '여기서 조금 더 천천히 읽어요',
  too_slow: '여기서 조금 더 빠르게 읽어도 돼요',
  missing_pause: '여기서 잠깐 쉬어가세요',
  extra_pause: '이 쉼은 조금 줄여도 돼요',
}

interface Props {
  segments: MarkupSegment[]
  words: WordTimestamp[]
}

export function RhythmComparisonChart({ segments, words }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const { refPts, userPts, analysis, labelSegs } = useMemo(() => {
    const refRhythm = buildReferenceRhythm(segments)
    const userRhythm = buildUserRhythm(words)
    const analysis = analyzeRhythm(refRhythm, userRhythm, segments)

    const refPts = rhythmToSvgPts(refRhythm)
    const userPts = rhythmToSvgPts(userRhythm)

    // Pick label segments: stress and every ~20th character boundary
    const totalLen = segments.reduce((s, seg) => s + seg.text.length, 0)
    let pos = 0
    const labelSegs: Array<{ x: number; text: string; isStress: boolean }> = []
    for (const seg of segments) {
      if (seg.text.length === 0) continue
      const segPos = (pos + seg.text.length / 2) / totalLen
      if (seg.types.includes('stress')) {
        labelSegs.push({ x: toSvgX(segPos), text: seg.text.slice(0, 6), isStress: true })
      }
      pos += seg.text.length
    }

    return { refPts, userPts, analysis, labelSegs }
  }, [segments, words])

  const refPath = buildSmoothPath(refPts)
  const userPath = buildSmoothPath(userPts)

  const scoreColor =
    analysis.similarityScore >= 80 ? '#34C759' :
    analysis.similarityScore >= 55 ? '#FF9500' :
    '#FF3B30'

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <p className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-widest">리듬 패턴 비교</p>
          <p className="text-[10px] text-[#8E8E93] mt-0.5">끊어읽기·속도·강조 패턴</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-xl font-bold" style={{ color: scoreColor }}>{analysis.similarityScore}</p>
            <p className="text-[9px] text-[#8E8E93] -mt-0.5">유사도</p>
          </div>
          <svg width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="13" fill="none" stroke="#E5E5EA" strokeWidth="3" />
            <circle
              cx="16" cy="16" r="13"
              fill="none"
              stroke={scoreColor}
              strokeWidth="3"
              strokeDasharray={`${(analysis.similarityScore / 100) * 2 * Math.PI * 13} ${2 * Math.PI * 13}`}
              strokeLinecap="round"
              transform="rotate(-90 16 16)"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          </svg>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="px-3 pb-1">
        <svg
          viewBox={`0 0 ${W} ${H_TOTAL}`}
          width="100%"
          preserveAspectRatio="none"
          style={{ display: 'block' }}
        >
          <defs>
            <linearGradient id="refGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* X-axis baseline */}
          <line x1="0" y1={H_CHART} x2={W} y2={H_CHART} stroke="#E5E5EA" strokeWidth="1" />

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map(f => (
            <line
              key={f}
              x1="0" y1={toSvgY(f)}
              x2={W} y2={toSvgY(f)}
              stroke="#F5F5F7"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          {/* Reference filled area */}
          <FilledArea pts={refPts} />

          {/* Reference curve line */}
          <path
            d={refPath}
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="1.5"
            opacity={0.7}
          />

          {/* User curve line */}
          <path
            d={userPath}
            fill="none"
            stroke="#E8361E"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Mismatch markers */}
          {analysis.mismatchPoints.map((m, i) => {
            const mx = toSvgX(m.position)
            const refY = toSvgY(interpolate(buildReferenceRhythm(segments), m.position))
            const userY = toSvgY(interpolate(buildUserRhythm(words), m.position))
            const markerY = Math.min(refY, userY) - 6
            const isHovered = hoveredIdx === i

            return (
              <g key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Vertical dashed line at mismatch */}
                <line
                  x1={mx} y1={H_CHART}
                  x2={mx} y2={Math.min(refY, userY)}
                  stroke="#F59E0B"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  opacity={0.6}
                />
                {/* Marker dot */}
                <circle
                  cx={mx}
                  cy={Math.max(3, markerY)}
                  r={isHovered ? 5.5 : 4}
                  fill="#F59E0B"
                  stroke="white"
                  strokeWidth="1.5"
                  style={{ transition: 'r 0.15s' }}
                />
                {/* Hover tooltip in SVG */}
                {isHovered && (
                  <g>
                    <rect
                      x={Math.min(mx - 55, W - 120)}
                      y={Math.max(3, markerY) - 26}
                      width="110"
                      height="20"
                      rx="4"
                      fill="#1D1D1F"
                      opacity={0.9}
                    />
                    <text
                      x={Math.min(mx, W - 60)}
                      y={Math.max(3, markerY) - 12}
                      textAnchor="middle"
                      fontSize="8"
                      fill="white"
                    >
                      {ISSUE_TIP[m.issue]}
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {/* Stress label ticks below axis */}
          {labelSegs.map((ls, i) => (
            <g key={i}>
              <line
                x1={ls.x} y1={H_CHART}
                x2={ls.x} y2={H_CHART + 4}
                stroke="#8B5CF6"
                strokeWidth="1"
                opacity={0.5}
              />
              <text
                x={ls.x}
                y={H_CHART + H_LABEL - 2}
                textAnchor="middle"
                fontSize="7.5"
                fill="#6D28D9"
                fontWeight="600"
              >
                {ls.text}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 pb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-1.5 rounded-full" style={{ background: 'linear-gradient(to right, #8B5CF6, #A78BFA)' }} />
          <span className="text-[10px] text-[#6E6E73]">기준 리듬</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-1.5 rounded-full bg-[#E8361E]" />
          <span className="text-[10px] text-[#6E6E73]">내 발화</span>
        </div>
        {analysis.mismatchPoints.length > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
            <span className="text-[10px] text-[#6E6E73]">불일치 구간</span>
          </div>
        )}
      </div>

      {/* Mismatch list */}
      {analysis.mismatchPoints.length > 0 && (
        <div className="border-t border-[#F5F5F7] mx-4 mb-3 pt-2.5 space-y-1.5">
          {analysis.mismatchPoints.map((m, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#F59E0B] mt-1.5" />
              <p className="text-[11px] text-[#1D1D1F] leading-snug">
                <span className="font-semibold text-[#F59E0B]">{ISSUE_LABEL[m.issue]}</span>
                {m.expectedText && !m.expectedText.startsWith('(') && (
                  <span className="text-[#6E6E73]"> — &ldquo;{m.expectedText}&rdquo;</span>
                )}
                {m.expectedText?.startsWith('(') && (
                  <span className="text-[#6E6E73]"> — {m.expectedText}</span>
                )}
              </p>
            </div>
          ))}
        </div>
      )}

      {analysis.mismatchPoints.length === 0 && (
        <div className="border-t border-[#F5F5F7] mx-4 mb-3 pt-2.5">
          <p className="text-[11px] text-[#34C759] font-medium">기준 리듬과 잘 맞아요!</p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="px-4 pb-3">
        <p className="text-[9px] text-[#8E8E93] leading-relaxed">
          이 차트는 체크리스트 기준(끊어읽기·강조·속도)을 바탕으로 만든 학습용 비교 자료예요.
          실제 음높이가 아니라 읽기 패턴을 보여드려요.
        </p>
      </div>
    </div>
  )
}
