import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, CheckCircle } from 'lucide-react'
import { announcements } from '../data/announcements'

type QuarterFilter = 'all' | 1 | 2 | 3 | 4
type LangFilter = 'all' | 'ko' | 'en'

const QUARTER_LABELS: Record<QuarterFilter, string> = {
  all: '전체', 1: '1분기', 2: '2분기', 3: '3분기', 4: '4분기',
}

const LANG_LABELS: Record<LangFilter, string> = {
  all: '전체', ko: '한국어', en: '영어',
}

function isCompleted(id: string): boolean {
  return localStorage.getItem(`completed_${id}`) === 'true'
}

export function LibraryPage() {
  const [quarter, setQuarter] = useState<QuarterFilter>(2)
  const [lang, setLang] = useState<LangFilter>('all')
  const navigate = useNavigate()

  const filtered = announcements.filter(a => {
    if (quarter !== 'all' && a.quarter !== quarter) return false
    return true
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">방송문 라이브러리</h1>
        <p className="text-sm text-gray-500 mt-0.5">제주항공 객실서비스 방송교범 기준</p>
      </div>

      <div className="space-y-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {(['all', 1, 2, 3, 4] as QuarterFilter[]).map(q => (
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

        <div className="flex gap-1.5">
          {(['all', 'ko', 'en'] as LangFilter[]).map(l => (
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

      <div className="space-y-2.5">
        {filtered.map(announcement => {
          const scripts = announcement.scripts.filter(s => {
            if (lang !== 'all' && s.lang !== lang) return false
            return true
          })
          if (scripts.length === 0) return null

          return scripts.map(script => {
            const done = isCompleted(script.id)
            return (
              <button
                key={script.id}
                onClick={() => navigate(`/study/${script.id}`)}
                className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-gray-300 hover:shadow-sm transition-all flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400 font-mono">{script.number}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      script.quarter === 1 ? 'bg-purple-50 text-purple-600' :
                      script.quarter === 2 ? 'bg-blue-50 text-blue-600' :
                      script.quarter === 3 ? 'bg-green-50 text-green-600' :
                      'bg-orange-50 text-orange-600'
                    }`}>
                      {script.quarter}분기
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      script.lang === 'ko'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {script.lang === 'ko' ? '한국어' : 'English'}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 text-sm truncate">{script.name}</p>
                </div>
                {done ? (
                  <CheckCircle size={18} className="text-[#1D9E75] flex-shrink-0" />
                ) : (
                  <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
                )}
              </button>
            )
          })
        })}
      </div>
    </div>
  )
}
