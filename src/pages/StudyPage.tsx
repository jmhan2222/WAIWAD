import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, BookOpen, Volume2, Mic, Zap, CheckSquare, Square } from 'lucide-react'
import { useAnnouncements } from '../hooks/useAnnouncements'
import { AudioPlayer } from '../components/AudioPlayer'
import { Recorder } from '../components/Recorder'
import { FeedbackView } from '../components/FeedbackView'
import { DrillView } from '../components/DrillView'
import { JapaneseScript } from '../components/JapaneseScript'
import type { FeedbackResult } from '../types'

type Lang = 'ko' | 'en' | 'ja' | 'ca'
type Tab = 'study' | 'audio' | 'record' | 'drill'

const LANG_LABELS: Record<Lang, string> = {
  ko: '한국어', en: 'English', ja: '日本語', ca: '中文',
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'study', label: '방송문 학습', icon: <BookOpen size={14} /> },
  { id: 'audio', label: '샘플 보이스', icon: <Volume2 size={14} /> },
  { id: 'record', label: '녹음·피드백', icon: <Mic size={14} /> },
  { id: 'drill', label: '개선 학습', icon: <Zap size={14} /> },
]

function markComplete(announcementId: string, tab: Tab) {
  const key = `tab_${announcementId}_${tab}`
  localStorage.setItem(key, 'true')
  const tabs: Tab[] = ['study', 'audio', 'record', 'drill']
  const allDone = tabs.every(t => localStorage.getItem(`tab_${announcementId}_${t}`) === 'true')
  if (allDone) localStorage.setItem(`completed_${announcementId}`, 'true')
}

function ChecklistItem({ label }: { label: string }) {
  const [checked, setChecked] = useState(false)
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <button onClick={() => setChecked(v => !v)} className="flex-shrink-0 mt-0.5">
        {checked
          ? <CheckSquare size={16} className="text-[#1D9E75]" />
          : <Square size={16} className="text-gray-300" />
        }
      </button>
      <span className={`text-sm ${checked ? 'text-[#1D9E75] line-through' : 'text-gray-700'}`}>
        {label}
      </span>
    </label>
  )
}

export function StudyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { announcements, loading } = useAnnouncements()

  const [activeTab, setActiveTab] = useState<Tab>('study')
  const [selectedLang, setSelectedLang] = useState<Lang | null>(null)
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null)
  const [showDrill, setShowDrill] = useState(false)

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

  const announcement = announcements.find(a => a.id === id)

  if (!announcement) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>방송문을 찾을 수 없습니다.</p>
        <button onClick={() => navigate('/')} className="mt-3 text-[#E8361E] text-sm">
          라이브러리로 돌아가기
        </button>
      </div>
    )
  }

  const lang: Lang = selectedLang ?? announcement.evalLang[0]
  const plainText = announcement[lang] ?? ''

  const handleLangChange = (l: Lang) => {
    setSelectedLang(l)
    setFeedback(null)
    setShowDrill(false)
  }

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    if (tab !== 'record') setShowDrill(false)
  }

  const handleFeedback = (result: FeedbackResult) => {
    setFeedback(result)
    markComplete(announcement.id, 'record')
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
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/')}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <span className="text-xs text-gray-400 font-mono">{announcement.section}</span>
          <p className="font-semibold text-gray-900 truncate">{announcement.title}</p>
        </div>
      </div>

      {/* Language tabs */}
      {announcement.evalLang.length > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          {announcement.evalLang.map(l => (
            <button
              key={l}
              onClick={() => handleLangChange(l)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                lang === l
                  ? 'bg-[#185FA5] text-white border-[#185FA5]'
                  : 'text-gray-500 border-gray-200 hover:border-gray-400 bg-white'
              }`}
            >
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
      )}

      {/* Content tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
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

      {/* Content */}
      <div className="pb-6">
        {/* Tab 1: 방송문 학습 */}
        {activeTab === 'study' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              {lang === 'ja' ? (
                <JapaneseScript text={plainText} />
              ) : (
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{plainText}</p>
              )}
            </div>

            {announcement.checkpoints && announcement.checkpoints.length > 0 && (
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">체크포인트</p>
                <div className="space-y-2">
                  {announcement.checkpoints.map((cp, i) => (
                    <div key={i} className="flex gap-2.5">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#E8361E] text-white text-[10px] flex items-center justify-center font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-gray-700 leading-relaxed">{cp}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                markComplete(announcement.id, 'study')
                handleTabChange('audio')
              }}
              className="w-full py-3 bg-[#E8361E] text-white rounded-xl font-medium hover:bg-[#c82d18] transition-colors"
            >
              다음 — 샘플 보이스 듣기
            </button>
          </div>
        )}

        {/* Tab 2: 샘플 보이스 */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            <AudioPlayer scriptId={`${announcement.id}-${lang}`} />
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 mb-2">방송문 전체</p>
              {lang === 'ja' ? (
                <JapaneseScript text={plainText} />
              ) : (
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{plainText}</p>
              )}
            </div>
            <button
              onClick={() => {
                markComplete(announcement.id, 'audio')
                handleTabChange('record')
              }}
              className="w-full py-3 bg-[#E8361E] text-white rounded-xl font-medium hover:bg-[#c82d18] transition-colors"
            >
              다음 — 직접 녹음하기
            </button>
          </div>
        )}

        {/* Tab 3: 녹음 & AI 피드백 */}
        {activeTab === 'record' && (
          <div>
            {!feedback ? (
              <Recorder
                plain={plainText}
                lang={lang}
                scriptName={announcement.title}
                onFeedback={handleFeedback}
              />
            ) : (
              <FeedbackView result={feedback} onDrill={handleDrill} />
            )}
          </div>
        )}

        {/* Tab 4: 개선 학습 */}
        {activeTab === 'drill' && feedback && showDrill && (
          <div className="space-y-5">
            <DrillView result={feedback} onRetry={handleRetry} />

            {announcement.checkpoints && announcement.checkpoints.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">방송 체크포인트</p>
                <div className="space-y-2.5">
                  {announcement.checkpoints.map((cp, i) => (
                    <ChecklistItem key={i} label={cp} />
                  ))}
                </div>
              </div>
            )}
          </div>
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
