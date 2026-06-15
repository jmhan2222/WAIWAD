import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, BookOpen, Volume2, Mic, Zap } from 'lucide-react'
import { announcements } from '../data/announcements'
import { MarkupScript } from '../components/MarkupScript'
import { AudioPlayer } from '../components/AudioPlayer'
import { Recorder } from '../components/Recorder'
import { FeedbackView } from '../components/FeedbackView'
import { DrillView } from '../components/DrillView'
import type { FeedbackResult } from '../types'

type Tab = 'markup' | 'audio' | 'record' | 'drill'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'markup', label: '억양학습', icon: <BookOpen size={14} /> },
  { id: 'audio', label: '샘플보이스', icon: <Volume2 size={14} /> },
  { id: 'record', label: '녹음피드백', icon: <Mic size={14} /> },
  { id: 'drill', label: '개선학습', icon: <Zap size={14} /> },
]

function markComplete(scriptId: string, tab: Tab) {
  const key = `tab_${scriptId}_${tab}`
  localStorage.setItem(key, 'true')
  const tabs: Tab[] = ['markup', 'audio', 'record', 'drill']
  const allDone = tabs.every(t => localStorage.getItem(`tab_${scriptId}_${t}`) === 'true')
  if (allDone) localStorage.setItem(`completed_${scriptId}`, 'true')
}

export function StudyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('markup')
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null)
  const [showDrill, setShowDrill] = useState(false)

  const allScripts = announcements.flatMap(a => a.scripts)
  const script = allScripts.find(s => s.id === id)

  if (!script) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>방송문을 찾을 수 없습니다.</p>
        <button onClick={() => navigate('/')} className="mt-3 text-[#E8361E] text-sm">
          라이브러리로 돌아가기
        </button>
      </div>
    )
  }

  const announcement = announcements.find(a => a.scripts.some(s => s.id === id))
  const siblings = announcement?.scripts ?? []
  const otherLang = siblings.find(s => s.id !== id)

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    if (tab !== 'record') setShowDrill(false)
  }

  const handleFeedback = (result: FeedbackResult) => {
    setFeedback(result)
    markComplete(script.id, 'record')
  }

  const handleDrill = () => {
    setActiveTab('drill')
    setShowDrill(true)
  }

  const handleRetry = () => {
    setActiveTab('record')
    setFeedback(null)
    setShowDrill(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/')}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 font-mono">{script.number}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              script.lang === 'ko' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
            }`}>
              {script.lang === 'ko' ? '한국어' : 'English'}
            </span>
          </div>
          <p className="font-semibold text-gray-900 truncate">{script.name}</p>
        </div>
        {otherLang && (
          <button
            onClick={() => navigate(`/study/${otherLang.id}`)}
            className="flex-shrink-0 text-xs text-[#185FA5] border border-[#185FA5] px-2.5 py-1 rounded-full hover:bg-blue-50 transition-colors"
          >
            {otherLang.lang === 'ko' ? '한국어' : 'English'}
          </button>
        )}
      </div>

      <div className="flex border-b border-gray-200 gap-0 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[#E8361E] text-[#E8361E]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pb-6">
        {activeTab === 'markup' && (
          <div className="space-y-5">
            <MarkupScript segments={script.segments} />
            <div className="space-y-2.5">
              {script.points.map((pt, i) => (
                <div key={i} className="rounded-xl p-4 border" style={{ backgroundColor: pt.bg, borderColor: pt.bg }}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{pt.icon}</span>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: pt.color }}>{pt.title}</p>
                      <p className="text-sm text-gray-700 mt-0.5">{pt.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                markComplete(script.id, 'markup')
                handleTabChange('audio')
              }}
              className="w-full py-3 bg-[#E8361E] text-white rounded-xl font-medium hover:bg-[#c82d18] transition-colors"
            >
              다음 — 샘플보이스 듣기
            </button>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="space-y-4">
            <AudioPlayer scriptId={script.id} />
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 mb-2">방송문 전체</p>
              <p className="text-sm text-gray-700 leading-relaxed">{script.plain}</p>
            </div>
            <button
              onClick={() => {
                markComplete(script.id, 'audio')
                handleTabChange('record')
              }}
              className="w-full py-3 bg-[#E8361E] text-white rounded-xl font-medium hover:bg-[#c82d18] transition-colors"
            >
              다음 — 직접 녹음하기
            </button>
          </div>
        )}

        {activeTab === 'record' && (
          <div>
            {!feedback ? (
              <Recorder
                plain={script.plain}
                lang={script.lang}
                scriptName={script.name}
                onFeedback={handleFeedback}
              />
            ) : (
              <FeedbackView result={feedback} onDrill={handleDrill} />
            )}
          </div>
        )}

        {activeTab === 'drill' && feedback && showDrill && (
          <DrillView result={feedback} onRetry={handleRetry} />
        )}

        {activeTab === 'drill' && (!feedback || !showDrill) && (
          <div className="text-center py-12 text-gray-400">
            <Zap size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">먼저 녹음 피드백을 완료하면<br />개인 맞춤 드릴이 생성됩니다.</p>
            <button
              onClick={() => handleTabChange('record')}
              className="mt-4 text-[#E8361E] text-sm font-medium"
            >
              녹음 탭으로 이동 →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
