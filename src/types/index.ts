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

export interface Script {
  id: string
  number: string
  name: string
  quarter: 1 | 2 | 3 | 4
  lang: 'ko' | 'en'
  plain: string
  segments: MarkupSegment[]
  points: LearningPoint[]
}

export interface Announcement {
  id: string
  number: string
  name: string
  quarter: 1 | 2 | 3 | 4
  scripts: Script[]
}

export type FeedbackScore = '상' | '중' | '하'

export interface FeedbackCategory {
  score: FeedbackScore
  good: string
  improve: string
  drill: string
}

export interface FeedbackResult {
  categories: {
    fluency: FeedbackCategory
    voice: FeedbackCategory
    intonation: FeedbackCategory
    pronunciation: FeedbackCategory
  }
  summary: string
  weakest: 'fluency' | 'voice' | 'intonation' | 'pronunciation'
  nextStep: string
}
