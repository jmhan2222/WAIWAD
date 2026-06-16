import { useState } from 'react'
import type { MarkupSegment } from '../types'

interface Props {
  segments: MarkupSegment[]
}

function Segment({ seg }: { seg: MarkupSegment }) {
  const [showTip, setShowTip] = useState(false)
  const { text, types, tip } = seg

  if (text.trim() === '') {
    if (types.includes('break-long')) {
      return <span style={{ display: 'inline-block', borderLeft: '2.5px solid #34C759', height: '1em', margin: '0 5px', verticalAlign: 'middle' }} />
    }
    if (types.includes('break-short')) {
      return <span style={{ display: 'inline-block', borderLeft: '1.5px solid #FF9500', height: '0.8em', margin: '0 4px', verticalAlign: 'middle' }} />
    }
    return <span> </span>
  }

  let style: React.CSSProperties = {}
  let className = ''

  if (types.includes('stress')) {
    style = { ...style, backgroundColor: '#FFF0EE', color: '#E8361E', fontWeight: 600, borderRadius: 4, padding: '1px 3px' }
  }
  if (types.includes('slow')) {
    style = { ...style, textDecoration: 'underline wavy #FF9500', textUnderlineOffset: '3px' }
  }

  if (tip) {
    className = 'cursor-pointer relative'
  }

  const suffixes: React.ReactNode[] = []
  if (types.includes('up')) {
    suffixes.push(<sup key="up" style={{ color: '#007AFF', fontSize: '0.75em' }}>↗</sup>)
  }
  if (types.includes('down')) {
    suffixes.push(<sup key="down" style={{ color: '#534AB7', fontSize: '0.75em' }}>↘</sup>)
  }
  if (types.includes('flat')) {
    suffixes.push(<sup key="flat" style={{ color: '#8E8E93', fontSize: '0.75em' }}>→</sup>)
  }

  return (
    <span
      className={className}
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

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#6E6E73] mb-4 pb-3 border-b border-[#E5E5EA]">
      <span className="flex items-center gap-1.5">
        <span style={{ display: 'inline-block', borderLeft: '2.5px solid #34C759', height: '12px', margin: '0 1px' }} />
        긴 끊어읽기
      </span>
      <span className="flex items-center gap-1.5">
        <span style={{ display: 'inline-block', borderLeft: '1.5px solid #FF9500', height: '10px', margin: '0 1px' }} />
        짧은 끊어읽기
      </span>
      <span className="flex items-center gap-1.5">
        <span style={{ backgroundColor: '#FFF0EE', color: '#E8361E', fontWeight: 600, padding: '0 4px', borderRadius: 4, fontSize: 11 }}>강조</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span style={{ textDecoration: 'underline wavy #FF9500', textUnderlineOffset: 3 }}>천천히</span>
      </span>
      <span className="flex items-center gap-1.5">
        <sup style={{ color: '#007AFF' }}>↗</sup> 올림
      </span>
      <span className="flex items-center gap-1.5">
        <sup style={{ color: '#534AB7' }}>↘</sup> 내림
      </span>
    </div>
  )
}

export function MarkupScript({ segments }: Props) {
  return (
    <div>
      <Legend />
      <p style={{ lineHeight: 2.6, fontSize: 15, color: '#1D1D1F', letterSpacing: '0.01em' }}>
        {segments.map((seg, i) => (
          <Segment key={i} seg={seg} />
        ))}
      </p>
    </div>
  )
}
