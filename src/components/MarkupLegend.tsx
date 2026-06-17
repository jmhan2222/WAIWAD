import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface LegendItem {
  id: string
  preview: React.ReactNode
  label: string
  detail: string
}

const ITEMS: LegendItem[] = [
  {
    id: 'break',
    preview: (
      <span className="flex items-center gap-1.5">
        <span style={{ display: 'inline-block', width: 3, height: 13, background: '#1D9E75', borderRadius: 2 }} />
        <span style={{ display: 'inline-block', width: 2, height: 10, background: '#BA7517', borderRadius: 2 }} />
      </span>
    ),
    label: '끊어읽기',
    detail: '체크리스트 — 유창성: 의미상 자연스러운 곳에서 적절한 끊어읽기\nPause가 너무 짧거나 길면 감점돼요. 막대가 있는 곳에서 1초(긴 끊어읽기) 또는 0.5초(짧은 끊어읽기) 정도 쉬어가세요.',
  },
  {
    id: 'stress',
    preview: (
      <span style={{ backgroundColor: '#FFF0EE', color: '#E8361E', fontWeight: 600, padding: '0 4px', borderRadius: 4, fontSize: 11 }}>
        강조
      </span>
    ),
    label: '강조',
    detail: '체크리스트 — 유창성: 의미전달력을 높이기 위한 강조 표현 사용\n이 단어들에서 목소리 톤을 살짝 높이거나 또렷하게 발음하면 승객이 핵심 정보를 놓치지 않아요.',
  },
  {
    id: 'slow',
    preview: (
      <span style={{ textDecoration: 'underline wavy #BA7517', textUnderlineOffset: 3, fontSize: 12 }}>
        천천히
      </span>
    ),
    label: '천천히',
    detail: '체크리스트 — 유창성: 전체/부분 적절한 속도 연출\n이 구간은 평소보다 20% 정도 느리게 읽어보세요.',
  },
  {
    id: 'intonation',
    preview: (
      <span className="flex items-center gap-1 text-xs">
        <sup style={{ color: '#007AFF', fontSize: 11 }}>↗</sup>
        <sup style={{ color: '#534AB7', fontSize: 11 }}>↘</sup>
      </span>
    ),
    label: '올림↗ / 내림↘',
    detail: '체크리스트 — 억양: 전반적인 자연스러운 억양 / 고른 억양 사용\n같은 억양만 반복하면 단조로워요. 표시된 방향대로 음높이를 의식적으로 바꿔보세요.',
  },
]

export function MarkupLegend() {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="mb-4 pb-2 border-b border-[#E5E5EA]">
      {ITEMS.map(item => (
        <div key={item.id}>
          <button
            onClick={() => setOpen(open === item.id ? null : item.id)}
            className="w-full flex items-center justify-between gap-2 py-1.5 text-left group"
          >
            <span className="flex items-center gap-2 text-xs text-[#6E6E73]">
              <span className="flex items-center">{item.preview}</span>
              <span className="group-hover:text-[#1D1D1F] transition-colors">{item.label}</span>
            </span>
            <ChevronDown
              size={11}
              style={{
                color: '#8E8E93',
                transform: open === item.id ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                flexShrink: 0,
              }}
            />
          </button>
          <div
            style={{
              overflow: 'hidden',
              maxHeight: open === item.id ? '150px' : '0px',
              transition: 'max-height 0.2s ease',
            }}
          >
            <p className="text-[11px] text-[#6E6E73] leading-relaxed pb-2.5 pl-0.5 whitespace-pre-line">
              {item.detail}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
