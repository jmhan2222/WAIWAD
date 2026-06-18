import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useAnnouncements } from '../hooks/useAnnouncements'
import type { Announcement } from '../types'

const STUDY_TABS = ['study', 'audio', 'record', 'drill'] as const
const TAB_LABELS: Record<typeof STUDY_TABS[number], string> = {
  study: '학습', audio: '보이스', record: '녹음', drill: '드릴',
}

function ProgressBar({ id }: { id: string }) {
  const done = STUDY_TABS.map(t => localStorage.getItem(`tab_${id}_${t}`) === 'true')
  const count = done.filter(Boolean).length
  if (count === 0) return null
  return (
    <div className="mt-2.5">
      <div className="flex gap-1 mb-1">
        {STUDY_TABS.map((t, i) => (
          <div
            key={t}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: done[i] ? '#34C759' : '#E5E5EA' }}
          />
        ))}
      </div>
      <p className="text-[9px] text-[#8E8E93]">
        {count === 4
          ? '모든 단계 완료 ✓'
          : `${count}/4 단계 완료 — 다음: ${TAB_LABELS[STUDY_TABS[count]]}`}
      </p>
    </div>
  )
}

function Sparkline({ id }: { id: string }) {
  const history = JSON.parse(localStorage.getItem(`score_history_${id}`) ?? '[]') as number[]
  if (history.length < 2) return null

  const recent = history.slice(-5)
  const W = 36, H = 18
  const min = 1, max = 3

  const pts = recent.map((v, i) => ({
    x: (i / (recent.length - 1)) * W,
    y: H - ((v - min) / (max - min + 0.01)) * (H - 4) - 2,
  }))

  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const isUp = recent[recent.length - 1] >= recent[0]
  const color = isUp ? '#34C759' : '#FF9500'

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', flexShrink: 0 }}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.5" fill={color} />
    </svg>
  )
}

type QuarterFilter = 'all' | 'Q1' | 'Q2' | 'Q3' | 'Q4'
type LangFilter = 'all' | 'ko' | 'en' | 'ja' | 'ca'

const QUARTER_LABELS: Record<QuarterFilter, string> = {
  all: '전체', Q1: 'Q1', Q2: 'Q2', Q3: 'Q3', Q4: 'Q4',
}

const LANG_LABELS: Record<LangFilter, string> = {
  all: '전체', ko: '한국어', en: '영어', ja: 'JA Code', ca: 'CA Code',
}

const QUARTER_STYLE: Record<string, string> = {
  Q1: 'bg-purple-50 text-purple-500',
  Q2: 'bg-blue-50 text-blue-500',
  Q3: 'bg-green-50 text-green-600',
  Q4: 'bg-orange-50 text-orange-500',
}

const CHAPTER_ORDER = ['On Ground', 'En-Route', 'After Landing', 'Irregular']

function passesQuarterFilter(a: Announcement, quarter: QuarterFilter, lang: LangFilter): boolean {
  if (quarter === 'all') return true
  if (lang === 'ja' || lang === 'ca') {
    return a.quarters_ja_ca?.includes(quarter) ?? false
  }
  if (lang === 'ko' || lang === 'en') {
    return a.quarters_ko_en?.includes(quarter) ?? false
  }
  return (a.quarters_ko_en?.includes(quarter) ?? false) || (a.quarters_ja_ca?.includes(quarter) ?? false)
}

export function LibraryPage() {
  const { announcements, loading, error } = useAnnouncements()
  const [quarter, setQuarter] = useState<QuarterFilter>('Q2')
  const [lang, setLang] = useState<LangFilter>('all')
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-8 h-8 rounded-full animate-spin"
          style={{ border: '3px solid #E8361E', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-[#6E6E73]">
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  const filtered = announcements.filter(a => {
    if (lang !== 'all' && !a.evalLang.includes(lang)) return false
    return passesQuarterFilter(a, quarter, lang)
  })

  const grouped = filtered.reduce<Record<string, Announcement[]>>((acc, a) => {
    const key = a.chapterName || 'Irregular'
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#1D1D1F]">방송문 라이브러리</h1>
        <p className="text-sm text-[#6E6E73] mt-0.5">제주항공 객실서비스 방송교범 기준</p>
      </div>

      <div className="space-y-2.5">
        {/* Quarter filter — pill row */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {(['all', 'Q1', 'Q2', 'Q3', 'Q4'] as QuarterFilter[]).map(q => (
            <button
              key={q}
              onClick={() => setQuarter(q)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all active:scale-95 ${
                quarter === q
                  ? 'bg-[#E8361E] text-white border-[#E8361E]'
                  : 'text-[#1D1D1F] border-[#E5E5EA] hover:border-[#8E8E93] bg-white'
              }`}
            >
              {QUARTER_LABELS[q]}
            </button>
          ))}
        </div>

        {/* Language filter */}
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'ko', 'en', 'ja', 'ca'] as LangFilter[]).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all active:scale-95 ${
                lang === l
                  ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]'
                  : 'text-[#6E6E73] border-[#E5E5EA] hover:border-[#8E8E93] bg-white'
              }`}
            >
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-12 text-sm text-[#6E6E73]">해당 조건의 방송문이 없습니다.</p>
      ) : (
        <div className="space-y-6">
          {CHAPTER_ORDER.map(chapter => {
            const items = grouped[chapter]
            if (!items || items.length === 0) return null
            return (
              <div key={chapter}>
                <h2 className="text-[10px] font-semibold text-[#6E6E73] uppercase tracking-widest mb-2.5">
                  {chapter}
                </h2>
                <div className="space-y-2">
                  {items.map(a => {
                    const allQuarters = [
                      ...new Set([...(a.quarters_ko_en ?? []), ...(a.quarters_ja_ca ?? [])]),
                    ]
                    return (
                      <button
                        key={a.id}
                        onClick={() => navigate(`/study/${a.id}`)}
                        className="w-full bg-white rounded-2xl border border-[#E5E5EA] p-4 text-left hover:border-[#8E8E93] hover:shadow-md hover:-translate-y-px transition-all duration-150 active:scale-[0.99]"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className="text-[10px] text-[#8E8E93] font-mono">{a.section}</span>
                              {allQuarters.map(q => (
                                <span
                                  key={q}
                                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${QUARTER_STYLE[q] ?? 'bg-[#F5F5F7] text-[#6E6E73]'}`}
                                >
                                  {q}
                                </span>
                              ))}
                              {a.evalLang.map(l => (
                                <span
                                  key={l}
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#F5F5F7] text-[#6E6E73]"
                                >
                                  {l.toUpperCase()}
                                </span>
                              ))}
                            </div>
                            <p className="font-medium text-[#1D1D1F] text-sm truncate">{a.title}</p>
                            <ProgressBar id={a.id} />
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                            <Sparkline id={a.id} />
                            <ChevronRight size={16} className="text-[#C7C7CC]" />
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
