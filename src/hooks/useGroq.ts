import { useState, useCallback } from 'react'
import type { FeedbackResult, MarkupSegment, SegmentType } from '../types'

type Lang = 'ko' | 'en' | 'ja' | 'ca'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

const WHISPER_LANG: Record<Lang, string> = {
  ko: 'ko', en: 'en', ja: 'ja', ca: 'zh',
}

// 429일 때 재시도 간격: 1s → 2s → 4s
const RETRY_DELAYS = [1000, 2000, 4000]

export class GroqError extends Error {
  constructor(message: string, public readonly isRateLimit: boolean) {
    super(message)
    this.name = 'GroqError'
  }
}

export class ValidationError extends Error {
  constructor(
    public readonly reason: 'too_short' | 'unrelated_content' | 'mostly_silent',
    message: string,
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function classifyError(status: number): GroqError {
  if (status === 429) {
    return new GroqError(
      '지금 요청이 많아 잠시 기다려야 해요. 1분 후 다시 시도해주세요.',
      true,
    )
  }
  if (status === 401 || status === 403) {
    return new GroqError('API 키가 올바르지 않습니다. 설정을 확인해 주세요.', false)
  }
  return new GroqError(`오류가 발생했습니다. (${status})`, false)
}

async function fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    const res = await fetch(url, options)

    if (res.status !== 429) return res

    if (attempt === RETRY_DELAYS.length) throw classifyError(429)

    await sleep(RETRY_DELAYS[attempt])
  }
  throw classifyError(429)
}

// ── 언어 혼입 감지 ────────────────────────────────────────────────────────────

// 항공 약어 등 허용 영문 목록
const KO_ALLOW_LIST = new Set([
  'CIQ', 'PUS', 'FUK', 'GMP', 'ICN', 'DP', 'ATC', 'DEMO', 'AI',
  'JSON', 'OK', 'VIP', 'PA', 'FCL',
])

// 피드백 텍스트가 한국어가 아닌 언어로 작성됐는지 감지
// (모든 언어의 피드백은 한국어여야 하므로 항상 ko 기준으로 검사)
function detectForeignWords(text: string): boolean {
  const matches = text.match(/[a-zA-Z]{3,}/g)
  if (!matches) return false
  return matches.some(m => !KO_ALLOW_LIST.has(m.toUpperCase()))
}

function extractTextFields(result: FeedbackResult): string[] {
  const { categories, summary, nextStep, drills } = result
  const catFields = (cat: FeedbackResult['categories']['fluency']) => [
    cat.passengerImpression,
    cat.specificIssue,
    cat.actionGuide,
  ]
  return [
    ...catFields(categories.fluency),
    ...catFields(categories.voice),
    ...catFields(categories.intonation),
    ...catFields(categories.pronunciation),
    summary,
    nextStep,
    ...(drills ?? []),
  ]
}

function hasForeignMixture(result: FeedbackResult): boolean {
  return extractTextFields(result).some(field => detectForeignWords(field))
}

// ── 녹음 검증 ─────────────────────────────────────────────────────────────────

interface ValidationResult {
  isValid: boolean
  reason: 'too_short' | 'unrelated_content' | 'mostly_silent' | 'ok'
  partial: boolean
}

function validateTranscription(transcription: string, originalText: string): ValidationResult {
  const trimmed = transcription.trim()

  if (trimmed.length < 10) {
    return { isValid: false, reason: 'mostly_silent', partial: false }
  }

  const lengthRatio = trimmed.length / (originalText.trim().length || 1)
  if (lengthRatio < 0.3) {
    return { isValid: false, reason: 'too_short', partial: false }
  }

  return { isValid: true, reason: 'ok', partial: lengthRatio < 0.7 }
}

async function checkRelevance(originalText: string, transcription: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: '당신은 텍스트 비교 전문가입니다. 원본 방송문과 사용자 발화를 비교하세요. 발음이 틀리거나 일부 생략해도 방송문을 읽으려 한 시도라면 RELATED. 방송문과 전혀 다른 화제나 의미 없는 말이면 UNRELATED. RELATED 또는 UNRELATED 중 하나만 답하세요.',
          },
          {
            role: 'user',
            content: `원본 방송문: ${originalText}\n\n사용자 발화: ${transcription}`,
          },
        ],
        temperature: 0,
        max_tokens: 10,
      }),
    })
    if (!res.ok) return true // 실패 시 관대하게 통과
    const data = await res.json() as { choices: { message: { content: string } }[] }
    return !data.choices[0].message.content.trim().toUpperCase().includes('UNRELATED')
  } catch {
    return true // 네트워크 오류 시 통과
  }
}

// ── 프롬프트 빌더 ─────────────────────────────────────────────────────────────

function buildPrompt(lang: Lang, title: string, originalText: string, transcription: string) {
  const jsonSchema = `{
  "categories": {
    "fluency": {
      "score": "상|중|하",
      "passengerImpression": "승객이 들었을 때의 구체적 인상",
      "specificIssue": "어디서 무엇이 어땠는지 구체적 관찰",
      "actionGuide": "지금 당장 할 수 있는 구체적 행동 지침"
    },
    "voice": {"score":"상|중|하","passengerImpression":"...","specificIssue":"...","actionGuide":"..."},
    "intonation": {"score":"상|중|하","passengerImpression":"...","specificIssue":"...","actionGuide":"..."},
    "pronunciation": {"score":"상|중|하","passengerImpression":"...","specificIssue":"...","actionGuide":"..."}
  },
  "summary": "손님이 전체 방송을 들었을 때의 인상 2~3문장",
  "weakest": "fluency|voice|intonation|pronunciation",
  "nextStep": "다음 녹음에서 딱 한 가지만 고친다면 무엇을, 어떻게",
  "drills": ["실현 가능한 구체적 연습 1", "연습 2", "연습 3"]
}`

  if (lang === 'ko') return {
    system: [
      '중요: 모든 응답은 100% 한국어로만 작성하세요.',
      '영어, 베트남어, 중국어, 일본어 등 어떤 외국어 단어도 섞지 마세요.',
      '외래어 표기가 필요한 경우에도 한글로만 표기하세요.',
      '당신은 다정하지만 명확한 제주항공 기내방송 코치입니다.',
      '모호한 피드백("조금 더 좋아질 것 같아요")은 절대 금지합니다.',
      'passengerImpression: 승객 입장에서 이 방송을 들었을 때 어떤 느낌인지 구체적 상황으로 묘사.',
      'specificIssue: "어디서" 무엇이 어땠는지 막연한 평가어 대신 관찰된 사실 위주로.',
      'actionGuide: 추상적 조언 금지, 숫자나 구체적 동작 포함. 나쁜 예: "더 친절하게 말해보세요" / 좋은 예: "문장 끝 바랍니다에서 0.5초 더 끌어보세요".',
      'drills: weakest 카테고리의 actionGuide를 바탕으로 실현 가능한 연습 3개. 방송문 전체 암기를 요구하는 드릴은 절대 포함하지 마세요.',
      '반드시 JSON만 반환하고 다른 텍스트는 절대 포함하지 마세요.',
    ].join(' '),
    user: [
      `방송문: ${title}`,
      `평가기준: 유창성(30점)/분위기목소리(25점)/억양(25점)/발음(20점)`,
      `원본: ${originalText}`,
      `전사본: ${transcription}`,
      `JSON만 응답:\n${jsonSchema}`,
      '',
      '다시 한번 확인: 응답에 한국어가 아닌 단어가 하나라도 포함되면 안 됩니다.',
      'JSON의 모든 텍스트 값이 순수 한국어 문장인지 확인 후 응답하세요.',
    ].join('\n'),
  }

  if (lang === 'en') return {
    system: [
      '중요: 평가 대상 발화가 영어여도, 모든 피드백 텍스트(passengerImpression, specificIssue, actionGuide, summary, nextStep, drills)는 반드시 100% 한국어로만 작성하세요.',
      '예: "Great job" 대신 "발음이 좋았어요", "Focus on intonation" 대신 "억양에 집중해보세요".',
      '당신은 명확하고 구체적인 제주항공 기내방송 코치입니다.',
      '모호한 피드백("조금 더 좋아질 것 같아요") 금지.',
      'passengerImpression: 승객 관점에서 이 방송을 들었을 때의 구체적 인상, 한국어로.',
      'specificIssue: 어디서 무엇이 어땠는지 관찰 사실 위주, 한국어로.',
      'actionGuide: 숫자나 구체적 동작 포함한 행동 지침, 한국어로.',
      'drills: weakest 카테고리 기반 실현 가능한 연습 3개, 암기 요구 금지, 한국어로.',
      '유효한 JSON만 반환하세요.',
    ].join(' '),
    user: [
      `Script: ${title}`,
      `Criteria: Fluency(30pts)/Voice&Atmosphere(25pts)/Intonation(25pts)/Pronunciation(20pts)`,
      `Original: ${originalText}`,
      `Transcription: ${transcription}`,
      `JSON only (use 상/중/하 for scores):\n${jsonSchema}`,
      '',
      '최종 확인: passengerImpression, specificIssue, actionGuide, summary, nextStep, drills의 모든 텍스트가 순수 한국어인지 확인 후 응답하세요.',
    ].join('\n'),
  }

  if (lang === 'ja') return {
    system: [
      '중요: 평가 대상 발화가 일본어여도, 모든 피드백 텍스트(passengerImpression, specificIssue, actionGuide, summary, nextStep, drills)는 반드시 100% 한국어로만 작성하세요.',
      '일본어 피드백 금지. 모든 설명은 한국어로 작성합니다.',
      '당신은 명확하고 구체적인 제주항공 기내방송 코치입니다.',
      '모호한 피드백 금지.',
      'passengerImpression: 승객 관점에서 이 방송을 들었을 때의 구체적 인상, 한국어로.',
      'specificIssue: 어디서 무엇이 어땠는지 관찰 사실 위주, 한국어로.',
      'actionGuide: 숫자나 구체적 동작 포함한 행동 지침, 한국어로.',
      'drills: weakest 카테고리 기반 실현 가능한 연습 3개, 암기 요구 금지, 한국어로.',
      '유효한 JSON만 반환하세요.',
    ].join(' '),
    user: [
      `放送文: ${title}`,
      `評価基準: 流暢さ(30点)/雰囲気・声(25点)/イントネーション(25点)/発音(20点)`,
      `元の文: ${originalText}`,
      `書き起こし: ${transcription}`,
      `JSON only (スコアは상/중/하):\n${jsonSchema}`,
      '',
      '최종 확인: passengerImpression, specificIssue, actionGuide, summary, nextStep, drills의 모든 텍스트가 순수 한국어인지 확인 후 응답하세요.',
    ].join('\n'),
  }

  // ca (中文)
  return {
    system: [
      '중요: 평가 대상 발화가 중국어여도, 모든 피드백 텍스트(passengerImpression, specificIssue, actionGuide, summary, nextStep, drills)는 반드시 100% 한국어로만 작성하세요.',
      '중국어 피드백 금지. 모든 설명은 한국어로 작성합니다.',
      '당신은 명확하고 구체적인 제주항공 기내방송 코치입니다.',
      '모호한 피드백 금지.',
      'passengerImpression: 승객 관점에서 이 방송을 들었을 때의 구체적 인상, 한국어로.',
      'specificIssue: 어디서 무엇이 어땠는지 관찰 사실 위주, 한국어로.',
      'actionGuide: 숫자나 구체적 동작 포함한 행동 지침, 한국어로.',
      'drills: weakest 카테고리 기반 실현 가능한 연습 3개, 암기 요구 금지, 한국어로.',
      '유효한 JSON만 반환하세요.',
    ].join(' '),
    user: [
      `广播文: ${title}`,
      `评分标准: 流利度(30分)/氛围声音(25分)/语调(25分)/发音(20分)`,
      `原文: ${originalText}`,
      `转录: ${transcription}`,
      `JSON only (评分使用상/중/하):\n${jsonSchema}`,
      '',
      '최종 확인: passengerImpression, specificIssue, actionGuide, summary, nextStep, drills의 모든 텍스트가 순수 한국어인지 확인 후 응답하세요.',
    ].join('\n'),
  }
}

// ── 마크업 생성 ────────────────────────────────────────────────────────────────

const VALID_TYPES = new Set<SegmentType>([
  'break-long', 'break-short', 'stress', 'slow', 'up', 'down', 'flat', 'normal',
])

interface RawSegment { text: string; type: string; tip?: string }

function buildMarkupPrompt(plainText: string, lang: Lang, title: string) {
  if (lang === 'ko') return {
    system: '당신은 제주항공 기내방송 억양 분석 전문가입니다. 유효한 JSON만 반환하세요.',
    user: [
      `[제목] ${title}`,
      `[방송문]\n${plainText}`,
      '',
      '위 방송문을 의미 단위 세그먼트로 나누어 억양 마크업을 생성하세요.',
      '',
      '[타입]',
      '- break-long: 문장 끝/의미 전환 — text 반드시 ""',
      '- break-short: 절 사이 짧은 호흡 — text 반드시 ""',
      '- stress: 핵심 정보(항공사명/목적지/안전/시간) — 반드시 1~3어절만 선택. 문장·구절 전체에 절대 사용 금지.',
      '  예) "좌석벨트 표시등이 꺼졌습니다" 전체 X → "표시등" 또는 "꺼졌습니다" 중 하나만 O',
      '- slow: 천천히 읽기(감사 인사/안전 지시)',
      '- up: 올림 억양(인사/기대감)',
      '- down: 내림 억양(지시 마무리/작별)',
      '- flat: 평탄(호칭/안내 도입)',
      '- normal: 일반 텍스트',
      '',
      '[규칙] 세그먼트 text를 모두 이어붙이면 원본과 정확히 동일해야 합니다. break 타입은 text가 반드시 "".',
      '',
      '{"segments":[{"text":"...","type":"...","tip":"(선택)"},...]} 형식으로만 응답.',
    ].join('\n'),
  }
  if (lang === 'en') return {
    system: 'You are a Jeju Air cabin announcement intonation specialist. Return ONLY valid JSON.',
    user: [
      `[Title] ${title}`,
      `[Script]\n${plainText}`,
      '',
      'Generate intonation markup by splitting the text into meaning-unit segments.',
      '',
      '[Types]',
      '- break-long: end of sentence / major shift — text must be ""',
      '- break-short: clause pause — text must be ""',
      '- stress: key info — LIMIT to 1-3 words/phrases only. NEVER apply to a whole sentence or clause.',
      '  Example: not "The seatbelt sign is now off" entirely → only "seatbelt sign" or "off" (the more critical one)',
      '- slow: read slowly (thanks / safety instructions)',
      '- up: rising intonation (greetings / anticipation)',
      '- down: falling intonation (closing / farewell)',
      '- flat: level tone (addressing passengers)',
      '- normal: regular text',
      '',
      '[Rule] Concatenated segment texts must equal the original exactly. Break types must have text: "".',
      '',
      'Respond ONLY with: {"segments":[{"text":"...","type":"...","tip":"(optional)"},...]}',
    ].join('\n'),
  }
  if (lang === 'ja') return {
    system: 'あなたは済州航空機内放送のイントネーション専門家です。有効なJSONのみ返してください。',
    user: [
      `[タイトル] ${title}`,
      `[放送文]\n${plainText}`,
      '',
      '放送文を意味単位のセグメントに分けてイントネーションマークアップを生成してください。',
      '',
      '[タイプ]',
      '- break-long: 文末/意味転換 — textは必ず""',
      '- break-short: 節間ポーズ — textは必ず""',
      '- stress: 重要情報 — 必ず1〜3語節のみ。文・節全体への適用厳禁。',
      '- slow: ゆっくり読む(感謝/安全指示)',
      '- up: 上昇調(挨拶/期待感)',
      '- down: 下降調(指示終了/別れ)',
      '- flat: 平坦(呼びかけ)',
      '- normal: 通常テキスト',
      '',
      '[規則] セグメントのtextを結合すると原文と完全一致すること。breakタイプはtext必ず""。',
      '',
      '{"segments":[{"text":"...","type":"...","tip":"(任意)"},...]} のみで回答。',
    ].join('\n'),
  }
  // ca (中文)
  return {
    system: '您是济州航空机舱广播语调专家。请仅返回有效的JSON。',
    user: [
      `[标题] ${title}`,
      `[广播文]\n${plainText}`,
      '',
      '将广播文按意义单位分段生成语调标记。',
      '',
      '[类型]',
      '- break-long: 句末/意义转换 — text必须为""',
      '- break-short: 分句停顿 — text必须为""',
      '- stress: 关键信息 — 仅限1-3个词语。严禁对整个句子或从句使用。',
      '- slow: 缓读(致谢/安全指示)',
      '- up: 升调(问候/期待)',
      '- down: 降调(指示结束/道别)',
      '- flat: 平调(称呼/引导)',
      '- normal: 普通文本',
      '',
      '[规则] 所有segment的text拼接后须与原文完全相同。break类型text必须为""。',
      '',
      '仅以{"segments":[{"text":"...","type":"...","tip":"(可选)"},...]}格式回答。',
    ].join('\n'),
  }
}

function normalizeSegments(raw: RawSegment[], originalText: string): MarkupSegment[] {
  const segments: MarkupSegment[] = raw
    .filter(s => typeof s.text === 'string' && typeof s.type === 'string')
    .map(s => ({
      text: s.text,
      types: [VALID_TYPES.has(s.type as SegmentType) ? (s.type as SegmentType) : 'normal'],
      ...(s.tip ? { tip: s.tip } : {}),
    }))

  const joined = segments.map(s => s.text).join('')
  if (!joined || !originalText) return [{ text: originalText, types: ['normal'] }]
  const ratio = joined.length / originalText.length
  if (ratio < 0.7 || ratio > 1.4) return [{ text: originalText, types: ['normal'] }]

  return segments
}

export async function generateMarkup(
  plainText: string,
  lang: Lang,
  title: string,
): Promise<MarkupSegment[]> {
  const { system, user } = buildMarkupPrompt(plainText, lang, title)

  const res = await fetchWithRetry('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) throw classifyError(res.status)

  const data = await res.json() as { choices: { message: { content: string } }[] }
  const parsed = JSON.parse(data.choices[0].message.content) as { segments: RawSegment[] }

  return normalizeSegments(Array.isArray(parsed.segments) ? parsed.segments : [], plainText)
}

// ── LLaMA 호출 (단일) ─────────────────────────────────────────────────────────

async function callLlama(system: string, user: string): Promise<FeedbackResult> {
  const res = await fetchWithRetry('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) throw classifyError(res.status)
  const data = await res.json() as { choices: { message: { content: string } }[] }
  return JSON.parse(data.choices[0].message.content) as FeedbackResult
}

// ── React Hook ────────────────────────────────────────────────────────────────

export function useGroq() {
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isAnalyzing, setIsAnalyzing]       = useState(false)
  const [error, setError]                   = useState<string | null>(null)

  const transcribeAudio = useCallback(async (audioBlob: Blob, lang: Lang): Promise<string> => {
    setIsTranscribing(true)
    setError(null)
    try {
      const formData = new FormData()
      const ext = audioBlob.type.startsWith('audio/mp4') ? 'mp4'
        : audioBlob.type.startsWith('audio/ogg') ? 'ogg'
        : 'webm'
      formData.append('file', audioBlob, `recording.${ext}`)
      formData.append('model', 'whisper-large-v3')
      formData.append('language', WHISPER_LANG[lang])
      formData.append('response_format', 'json')

      const res = await fetchWithRetry('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
        body: formData,
      })

      if (!res.ok) throw classifyError(res.status)
      const data = await res.json() as { text: string }
      return data.text
    } catch (e) {
      const err = e instanceof GroqError ? e : new GroqError('네트워크 오류가 발생했습니다. 연결을 확인해 주세요.', false)
      setError(err.message)
      throw err
    } finally {
      setIsTranscribing(false)
    }
  }, [])

  const generateFeedback = useCallback(async (
    originalText: string,
    transcription: string,
    lang: Lang,
    scriptName: string,
  ): Promise<FeedbackResult> => {
    setIsAnalyzing(true)
    setError(null)
    try {
      // ── 1단계: 길이 검증 ──────────────────────────────────────────────────────
      const validation = validateTranscription(transcription, originalText)

      if (!validation.isValid) {
        const messages: Record<string, string> = {
          mostly_silent: '녹음에서 음성이 거의 감지되지 않았어요. 마이크가 제대로 작동하는지 확인하고 다시 녹음해주세요.',
          too_short: '녹음이 너무 짧아요. 방송문 전체를 끝까지 읽고 녹음해주세요. (원본 길이의 최소 절반 이상은 읽어야 정확한 피드백이 가능해요)',
        }
        throw new ValidationError(
          validation.reason as 'too_short' | 'mostly_silent',
          messages[validation.reason] ?? '녹음을 다시 시도해주세요.',
        )
      }

      // ── 2단계: 관련성 검증 ────────────────────────────────────────────────────
      const isRelated = await checkRelevance(originalText, transcription)
      if (!isRelated) {
        throw new ValidationError(
          'unrelated_content',
          '녹음된 내용이 방송문과 달라요. 화면에 표시된 방송문을 보면서 그대로 읽어주세요.',
        )
      }

      // ── 3단계: 피드백 생성 ────────────────────────────────────────────────────
      const { system, user } = buildPrompt(lang, scriptName, originalText, transcription)
      let result = await callLlama(system, user)

      // 한국어 혼입 감지 → 1회 재시도
      if (hasForeignMixture(result)) {
        console.warn('[useGroq] 언어 혼입 감지 — 재시도합니다.')
        result = await callLlama(system, user)

        if (hasForeignMixture(result)) {
          console.warn('[useGroq] 재시도 후에도 언어 혼입 감지 — 필드 오류 표시')
          const FALLBACK = '[표현 오류 - 다시 시도해주세요]'
          const fix = (field: string) => detectForeignWords(field) ? FALLBACK : field

          const fixCategory = (cat: FeedbackResult['categories']['fluency']) => ({
            ...cat,
            passengerImpression: fix(cat.passengerImpression),
            specificIssue:       fix(cat.specificIssue),
            actionGuide:         fix(cat.actionGuide),
          })

          result = {
            ...result,
            categories: {
              fluency:       fixCategory(result.categories.fluency),
              voice:         fixCategory(result.categories.voice),
              intonation:    fixCategory(result.categories.intonation),
              pronunciation: fixCategory(result.categories.pronunciation),
            },
            summary:  fix(result.summary),
            nextStep: fix(result.nextStep),
          }
        }
      }

      return { ...result, ...(validation.partial ? { partial: true } : {}) }
    } catch (e) {
      if (e instanceof ValidationError) throw e
      const err = e instanceof GroqError ? e : new GroqError('네트워크 오류가 발생했습니다. 연결을 확인해 주세요.', false)
      setError(err.message)
      throw err
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  return { transcribeAudio, generateFeedback, isTranscribing, isAnalyzing, error }
}
