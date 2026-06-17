export type SegmentType =
  | 'break-long'
  | 'break-short'
  | 'stress'
  | 'slow'
  | 'up'
  | 'down'
  | 'flat'
  | 'normal'

export interface MarkupSegment {
  text: string
  types: SegmentType[]
  tip?: string
}

export interface LearningPoint {
  icon: string
  color: string
  bg: string
  title: string
  desc: string
}

export interface AnnouncementData {
  revVersion: string
  updatedAt: string
  announcements: Announcement[]
}

export interface Announcement {
  id: string
  chapter: number
  chapterName: string
  section: string
  title: string
  evalLang: ('ko' | 'en' | 'ja' | 'ca')[]
  quarters_ko_en?: string[]
  quarters_ja_ca?: string[]
  ko?: string
  en?: string
  ja?: string
  ca?: string
  checkpoints?: string[]
}

export type FeedbackScore = '상' | '중' | '하'

export interface CategoryFeedback {
  score: '상' | '중' | '하'
  passengerImpression: string
  specificIssue: string
  actionGuide: string
}

export interface FocusSegment {
  text: string
  reason: string
}

export interface FeedbackResult {
  categories: {
    fluency: CategoryFeedback
    voice: CategoryFeedback
    intonation: CategoryFeedback
    pronunciation: CategoryFeedback
  }
  summary: string
  weakest: 'fluency' | 'voice' | 'intonation' | 'pronunciation'
  nextStep: string
  drills?: string[]
  partial?: number
  needsReeval?: string[]
  focusSegment?: FocusSegment
}
