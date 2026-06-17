import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, BookOpen, Volume2, Mic, Zap, CheckSquare, Square } from 'lucide-react'
import { useAnnouncements } from '../hooks/useAnnouncements'
import { useMarkup } from '../hooks/useMarkup'
import { AudioPlayer } from '../components/AudioPlayer'
import { Recorder } from '../components/Recorder'
import { FeedbackView } from '../components/FeedbackView'
import { DrillView } from '../components/DrillView'
import { JapaneseScript } from '../components/JapaneseScript'
import { MarkupScript } from '../components/MarkupScript'
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
          ? <CheckSquare size={16} className="text-[#34C759]" />
          : <Square size={16} className="text-[#8E8E93]" />
        }
      </button>
      <span className={`text-sm leading-snug ${checked ? 'text-[#34C759] line-through' : 'text-[#1D1D1F]'}`}>
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

  // 훅은 조건부 실행 불가 — announcement 로드 전/후 모두 안전하게 처리
  const announcement = announcements.find(a => a.id === id) ?? null
  const lang: Lang = (selectedLang ?? announcement?.evalLang[0] ?? 'ko') as Lang
  const plainText = announcement ? (announcement[lang] ?? '') : ''

  const {
    segments: markupSegments,
    loading: markupLoading,
    error: markupError,
  } = useMarkup(announcement?.id ?? '', lang, plainText, announcement?.title ?? '')

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
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#E5E5EA] hover:bg-[#F5F5F7] transition-colors flex-shrink-0"
        >
          <ChevronLeft size={18} className="text-[#1D1D1F]" />
        </button>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-[#6E6E73] font-mono">{announcement.section}</span>
          <p className="font-semibold text-[#1D1D1F] truncate text-sm">{announcement.title}</p>
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
                  ? 'bg-[#007AFF] text-white border-[#007AFF]'
                  : 'text-[#6E6E73] border-[#E5E5EA] hover:border-[#8E8E93] bg-white'
              }`}
            >
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
      )}

      {/* Content tabs — pill style */}
      <div className="bg-[#E5E5EA] rounded-xl p-1 flex gap-1 overflow-x-auto scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap rounded-lg transition-all flex-shrink-0 ${
              activeTab === tab.id
                ? 'bg-white text-[#1D1D1F] shadow-sm'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
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
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-[#E5E5EA] p-4">
              {!plainText.trim() ? (
                <p className="text-sm text-[#8E8E93] leading-relaxed">
                  이 방송문의 텍스트가 아직 등록되지 않았어요.{'\n'}방송교범을 참고해 텍스트를 추가하면 자동으로 학습 가이드가 생성됩니다.
                </p>
              ) : lang === 'ja' ? (
                <JapaneseScript text={plainText} />
              ) : markupLoading ? (
                <div className="flex items-center gap-2.5 py-2">
                  <div
                    className="w-4 h-4 rounded-full animate-spin flex-shrink-0"
                    style={{ border: '2px solid #E5E5EA', borderTopColor: '#E8361E' }}
                  />
                  <span className="text-xs text-[#6E6E73]">억양을 분석하는 중...</span>
                </div>
              ) : markupSegments ? (
                <MarkupScript segments={markupSegments} />
              ) : (
                <>
                  {markupError && (
                    <p className="text-[10px] text-[#8E8E93] mb-2">
                      마크업을 불러올 수 없어 원문을 표시합니다.
                    </p>
                  )}
                  <p className="text-sm text-[#1D1D1F] leading-relaxed whitespace-pre-wrap">{plainText}</p>
                </>
              )}
            </div>

            {announcement.checkpoints && announcement.checkpoints.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E5E5EA] p-4">
                <p className="text-[10px] font-semibold text-[#6E6E73] uppercase tracking-widest mb-3">체크포인트</p>
                <div className="space-y-2.5">
                  {announcement.checkpoints.map((cp, i) => (
                    <div key={i} className="flex gap-2.5">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1D1D1F] text-white text-[10px] flex items-center justify-center font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-[#1D1D1F] leading-relaxed">{cp}</p>
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
              className="w-full py-3.5 bg-[#E8361E] text-white rounded-2xl font-semibold text-sm hover:bg-[#c82d18] transition-all active:scale-[0.98]"
            >
              다음 — 샘플 보이스 듣기
            </button>
          </div>
        )}

        {/* Tab 2: 샘플 보이스 */}
        {activeTab === 'audio' && (
          <div className="space-y-3">
            <AudioPlayer scriptId={`${announcement.id}-${lang}`} />
            <div className="bg-white rounded-2xl border border-[#E5E5EA] p-4">
              <p className="text-[10px] text-[#6E6E73] font-medium mb-2 uppercase tracking-widest">방송문 전체</p>
              {lang === 'ja' ? (
                <JapaneseScript text={plainText} />
              ) : (
                <p className="text-sm text-[#1D1D1F] leading-relaxed whitespace-pre-wrap">{plainText}</p>
              )}
            </div>
            <button
              onClick={() => {
                markComplete(announcement.id, 'audio')
                handleTabChange('record')
              }}
              className="w-full py-3.5 bg-[#E8361E] text-white rounded-2xl font-semibold text-sm hover:bg-[#c82d18] transition-all active:scale-[0.98]"
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
          <div className="space-y-4">
            <DrillView result={feedback} onRetry={handleRetry} />

            {announcement.checkpoints && announcement.checkpoints.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E5E5EA] p-4">
                <p className="text-[10px] font-semibold text-[#6E6E73] uppercase tracking-widest mb-3">방송 체크포인트</p>
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
          <div className="text-center py-14 text-[#6E6E73]">
            <Zap size={32} className="mx-auto mb-3 opacity-25" />
            <p className="text-sm leading-relaxed">먼저 녹음 피드백을 완료하면<br />개인 맞춤 드릴이 생성됩니다.</p>
            <button
              onClick={() => handleTabChange('record')}
              className="mt-4 text-[#E8361E] text-sm font-semibold"
            >
              녹음 탭으로 이동 →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
