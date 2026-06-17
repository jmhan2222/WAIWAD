import { useState } from 'react'
import type { MarkupSegment } from '../types'
import { MarkupLegend } from './MarkupLegend'

interface Props {
  segments: MarkupSegment[]
}

// ── 끊어읽기 막대 ────────────────────────────────────────────────────────────

function BreakLong() {
  const [hovered, setHovered] = useState(false)
  return (
    <span
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        verticalAlign: 'middle',
        margin: '0 6px',
        cursor: 'default',
        transform: hovered ? 'scaleY(1.2)' : 'scaleY(1)',
        transition: 'transform 0.15s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ fontSize: '5px', color: '#1D9E75', letterSpacing: '2px', lineHeight: 1, marginBottom: '2px' }}>
        ••
      </span>
      <span style={{ display: 'block', width: '3px', height: '1.4em', background: '#1D9E75', borderRadius: '2px' }} />
    </span>
  )
}

function BreakShort() {
  const [hovered, setHovered] = useState(false)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        verticalAlign: 'middle',
        margin: '0 4px',
        cursor: 'default',
        transform: hovered ? 'scaleY(1.2)' : 'scaleY(1)',
        transition: 'transform 0.15s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ display: 'block', width: '2px', height: '1em', background: '#BA7517', borderRadius: '2px' }} />
    </span>
  )
}

// ── 세그먼트 ─────────────────────────────────────────────────────────────────

function Segment({ seg }: { seg: MarkupSegment }) {
  const [showTip, setShowTip] = useState(false)
  const { text, types, tip } = seg

  if (text.trim() === '') {
    if (types.includes('break-long'))  return <BreakLong />
    if (types.includes('break-short')) return <BreakShort />
    return <span> </span>
  }

  let style: React.CSSProperties = {}

  if (types.includes('stress')) {
    style = { ...style, backgroundColor: '#FFF0EE', color: '#E8361E', fontWeight: 600, borderRadius: 4, padding: '1px 3px' }
  }
  if (types.includes('slow')) {
    style = { ...style, textDecoration: 'underline wavy #FF9500', textUnderlineOffset: '3px' }
  }

  const suffixes: React.ReactNode[] = []
  if (types.includes('up'))   suffixes.push(<sup key="up"   style={{ color: '#007AFF', fontSize: '0.75em' }}>↗</sup>)
  if (types.includes('down')) suffixes.push(<sup key="down" style={{ color: '#534AB7', fontSize: '0.75em' }}>↘</sup>)
  if (types.includes('flat')) suffixes.push(<sup key="flat" style={{ color: '#8E8E93', fontSize: '0.75em' }}>→</sup>)

  return (
    <span
      className={tip ? 'cursor-pointer relative' : undefined}
      style={style}
      onClick={() => tip && setShowTip(v => !v)}
    >
      {text}
      {suffixes}
      {showTip && tip && (
        <span
          style={{
            position: 'absolute',
            bottom: '130%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: '#1D1D1F',
            fontSize: 12,
            fontWeight: 500,
            padding: '6px 10px',
            borderRadius: 8,
            whiteSpace: 'nowrap',
            zIndex: 100,
            pointerEvents: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.10), 0 0 0 0.5px rgba(0,0,0,0.06)',
          }}
        >
          {tip}
        </span>
      )}
    </span>
  )
}

// ── 핵심 가이드 카드 ─────────────────────────────────────────────────────────

function GuideCard({ segments }: { segments: MarkupSegment[] }) {
  const breakLong  = segments.filter(s => s.types.includes('break-long')).length
  const breakShort = segments.filter(s => s.types.includes('break-short')).length
  const stress     = segments.filter(s => s.types.includes('stress')).length
  const slow       = segments.filter(s => s.types.includes('slow')).length
  const totalBreaks = breakLong + breakShort

  const parts = [
    totalBreaks > 0 && `끊어읽기 포인트 ${totalBreaks}곳`,
    stress > 0      && `핵심 강조 단어 ${stress}개`,
    slow > 0        && `천천히 읽기 구간 ${slow}곳`,
  ].filter(Boolean)

  const description = parts.length > 0
    ? `이 방송문은 ${parts.join(', ')}이 있어요.`
    : '억양 가이드를 참고해 자연스럽게 읽어보세요.'

  let coach = '균형 잡힌 방송문이에요. 표시된 억양 흐름을 자연스럽게 연결해보세요.'
  if (totalBreaks >= 4)       coach = '끊어읽기가 많은 방송문이에요. 막대마다 충분히 쉬어가면 승객이 내용을 더 잘 이해해요.'
  else if (stress >= 4)       coach = '강조 단어가 여럿 있어요. 하나씩 또렷하게 발음하면 핵심 정보가 잘 전달돼요.'
  else if (slow >= 2)         coach = '천천히 읽는 구간에 유의하세요. 속도 변화가 승객의 집중을 높여줘요.'
  else if (parts.length === 0) coach = '자연스러운 흐름 위주의 방송문이에요. 평온하고 명확한 톤으로 읽어보세요.'

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(29,158,117,0.07) 0%, rgba(255,255,255,0) 100%)',
        border: '1px solid rgba(29,158,117,0.18)',
        borderRadius: 12,
        padding: '10px 14px',
        marginBottom: 16,
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 700, color: '#1D9E75', marginBottom: 4, letterSpacing: '0.02em' }}>
        이 방송문 핵심 가이드
      </p>
      <p style={{ fontSize: 12, color: '#1D1D1F', lineHeight: 1.5 }}>{description}</p>
      <p style={{ fontSize: 11, color: '#6E6E73', marginTop: 3 }}>{coach}</p>
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export function MarkupScript({ segments }: Props) {
  return (
    <div>
      <GuideCard segments={segments} />
      <MarkupLegend />
      <p style={{ lineHeight: 2.6, fontSize: 15, color: '#1D1D1F', letterSpacing: '0.01em' }}>
        {segments.map((seg, i) => (
          <Segment key={i} seg={seg} />
        ))}
      </p>
    </div>
  )
}
