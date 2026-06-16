import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useAnnouncements } from '../hooks/useAnnouncements'
import type { Announcement } from '../types'

type QuarterFilter = 'all' | 'Q1' | 'Q2' | 'Q3' | 'Q4'
type LangFilter = 'all' | 'ko' | 'en' | 'ja' | 'ca'

const QUARTER_LABELS: Record<QuarterFilter, string> = {
  all: '전체', Q1: 'Q1', Q2: 'Q2', Q3: 'Q3', Q4: 'Q4',
}

const LANG_LABELS: Record<LangFilter, string> = {
  all: '전체', ko: '한국어', en: '영어', ja: 'JA Code', ca: 'CA Code',
}

const QUARTER_STYLE: Record<string, string> = {
  Q1: 'bg-purple-50 text-purple-600',
  Q2: 'bg-blue-50 text-blue-600',
  Q3: 'bg-green-50 text-green-600',
  Q4: 'bg-orange-50 text-orange-600',
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
      <div className="text-center py-12 text-gray-500">
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
        <h1 className="text-xl font-bold text-gray-900">방송문 라이브러리</h1>
        <p className="text-sm text-gray-500 mt-0.5">제주항공 객실서비스 방송교범 기준</p>
      </div>

      <div className="space-y-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {(['all', 'Q1', 'Q2', 'Q3', 'Q4'] as QuarterFilter[]).map(q => (
            <button
              key={q}
              onClick={() => setQuarter(q)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                quarter === q
                  ? 'bg-[#E8361E] text-white border-[#E8361E]'
                  : 'text-gray-600 border-gray-300 hover:border-gray-400 bg-white'
              }`}
            >
              {QUARTER_LABELS[q]}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'ko', 'en', 'ja', 'ca'] as LangFilter[]).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                lang === l
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'text-gray-500 border-gray-200 hover:border-gray-400 bg-white'
              }`}
            >
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-10 text-sm text-gray-400">해당 조건의 방송문이 없습니다.</p>
      ) : (
        <div className="space-y-6">
          {CHAPTER_ORDER.map(chapter => {
            const items = grouped[chapter]
            if (!items || items.length === 0) return null
            return (
              <div key={chapter}>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                  {chapter}
                </h2>
                <div className="space-y-2.5">
                  {items.map(a => {
                    const allQuarters = [
                      ...new Set([...(a.quarters_ko_en ?? []), ...(a.quarters_ja_ca ?? [])]),
                    ]
                    return (
                      <button
                        key={a.id}
                        onClick={() => navigate(`/study/${a.id}`)}
                        className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-gray-300 hover:shadow-sm transition-all flex items-center gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="text-xs text-gray-400 font-mono">{a.section}</span>
                            {allQuarters.map(q => (
                              <span
                                key={q}
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${QUARTER_STYLE[q] ?? 'bg-gray-100 text-gray-500'}`}
                              >
                                {q}
                              </span>
                            ))}
                            {a.evalLang.map(l => (
                              <span
                                key={l}
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600"
                              >
                                {l.toUpperCase()}
                              </span>
                            ))}
                          </div>
                          <p className="font-medium text-gray-900 text-sm truncate">{a.title}</p>
                        </div>
                        <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
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
