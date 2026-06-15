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
      return <span style={{ display: 'inline-block', borderLeft: '2.5px solid #1D9E75', height: '1em', margin: '0 5px', verticalAlign: 'middle' }} />
    }
    if (types.includes('break-short')) {
      return <span style={{ display: 'inline-block', borderLeft: '1.5px solid #BA7517', height: '0.8em', margin: '0 4px', verticalAlign: 'middle' }} />
    }
    return <span> </span>
  }

  let style: React.CSSProperties = {}
  let className = ''

  if (types.includes('stress')) {
    style = { ...style, backgroundColor: '#FEF0EE', color: '#E8361E', fontWeight: 500, borderRadius: 3, padding: '1px 2px' }
  }
  if (types.includes('slow')) {
    style = { ...style, textDecoration: 'underline wavy #BA7517', textUnderlineOffset: '3px' }
  }

  const hasTip = !!tip
  if (hasTip) {
    className = 'cursor-pointer relative'
  }

  const suffixes: React.ReactNode[] = []
  if (types.includes('up')) {
    suffixes.push(<sup key="up" style={{ color: '#185FA5', fontSize: '0.75em' }}>↗</sup>)
  }
  if (types.includes('down')) {
    suffixes.push(<sup key="down" style={{ color: '#534AB7', fontSize: '0.75em' }}>↘</sup>)
  }
  if (types.includes('flat')) {
    suffixes.push(<sup key="flat" style={{ color: '#888', fontSize: '0.75em' }}>→</sup>)
  }

  return (
    <span
      className={className}
      style={style}
      onClick={() => hasTip && setShowTip(v => !v)}
    >
      {text}
      {suffixes}
      {showTip && tip && (
        <span
          style={{
            position: 'absolute',
            bottom: '120%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1a1a1a',
            color: '#fff',
            fontSize: 12,
            padding: '4px 8px',
            borderRadius: 6,
            whiteSpace: 'nowrap',
            zIndex: 100,
            pointerEvents: 'none',
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
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500 mb-4 pb-3 border-b border-gray-100">
      <span className="flex items-center gap-1.5">
        <span style={{ display: 'inline-block', borderLeft: '2.5px solid #1D9E75', height: '12px', margin: '0 1px' }} />
        긴 끊어읽기
      </span>
      <span className="flex items-center gap-1.5">
        <span style={{ display: 'inline-block', borderLeft: '1.5px solid #BA7517', height: '10px', margin: '0 1px' }} />
        짧은 끊어읽기
      </span>
      <span className="flex items-center gap-1.5">
        <span style={{ backgroundColor: '#FEF0EE', color: '#E8361E', fontWeight: 500, padding: '0 4px', borderRadius: 3, fontSize: 11 }}>강조</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span style={{ textDecoration: 'underline wavy #BA7517', textUnderlineOffset: 3 }}>천천히</span>
      </span>
      <span className="flex items-center gap-1.5">
        <sup style={{ color: '#185FA5' }}>↗</sup> 올림
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
      <p
        style={{
          lineHeight: 2.6,
          fontSize: 15,
          color: '#1a1a1a',
          letterSpacing: '0.01em',
        }}
      >
        {segments.map((seg, i) => (
          <Segment key={i} seg={seg} />
        ))}
      </p>
    </div>
  )
}
