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

// 3자 이상 연속 알파벳이 허용 목록에 없으면 외국어 혼입으로 판정
function detectForeignWords(text: string, lang: Lang): boolean {
  if (lang === 'ko') {
    const matches = text.match(/[a-zA-Z]{3,}/g)
    if (!matches) return false
    return matches.some(m => !KO_ALLOW_LIST.has(m.toUpperCase()))
  }
  if (lang === 'ja') {
    // 일본어 응답에 한글이 섞이면 혼입으로 판정
    return /[가-힣]/.test(text)
  }
  if (lang === 'ca') {
    // 중국어 응답에 한글이 섞이면 혼입으로 판정
    return /[가-힣]/.test(text)
  }
  return false
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

function hasForeignMixture(result: FeedbackResult, lang: Lang): boolean {
  return extractTextFields(result).some(field => detectForeignWords(field, lang))
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
      'IMPORTANT: Write ALL responses in 100% English only.',
      'Do not mix in Korean, Japanese, Chinese, Vietnamese, or any other language.',
      'You are a clear, direct Jeju Air cabin announcement coach.',
      'Never give vague feedback like "try to sound more natural". Instead be concrete and specific.',
      'passengerImpression: describe how a passenger actually experienced this announcement (specific scenario).',
      'specificIssue: state observed facts about where and what went wrong — avoid vague judgment words.',
      'actionGuide: give a specific, actionable instruction with numbers or exact words. Bad: "speak more clearly". Good: "hold the word landing for 0.5 seconds longer".',
      'drills: 3 achievable practice exercises based on the weakest category\'s actionGuide. Never require memorizing the full script.',
      'Return ONLY valid JSON, no other text.',
    ].join(' '),
    user: [
      `Script: ${title}`,
      `Criteria: Fluency(30pts)/Voice&Atmosphere(25pts)/Intonation(25pts)/Pronunciation(20pts)`,
      `Original: ${originalText}`,
      `Transcription: ${transcription}`,
      `Respond in JSON only (use 상/중/하 for scores):\n${jsonSchema}`,
      '',
      'Final check: Every text value (passengerImpression, specificIssue, actionGuide, summary, nextStep, drills) must be in English only.',
    ].join('\n'),
  }

  if (lang === 'ja') return {
    system: [
      '重要：すべての回答を100%日本語のみで記述してください。',
      '韓国語、英語、ベトナム語、中国語など他の言語の単語を混ぜないでください。',
      'あなたは明確で具体的な済州航空の機内放送コーチです。',
      '曖昧なフィードバック（「もう少し良くなれば」）は絶対禁止です。',
      'passengerImpression: 乗客がこの放送を聞いたときの具体的な印象を場面で描写。',
      'specificIssue: どこで何が問題だったか、曖昧な評価語でなく観察した事実を中心に。',
      'actionGuide: 抽象的なアドバイス禁止。数字や具体的な動作を含めること。',
      'drills: weakestカテゴリのactionGuideを基に実現可能な練習3つ。全文暗記を要求するドリルは絶対含めないこと。',
      'JSONのみで回答してください。',
    ].join(' '),
    user: [
      `放送文: ${title}`,
      `評価基準: 流暢さ(30点)/雰囲気・声(25点)/イントネーション(25点)/発音(20点)`,
      `元の文: ${originalText}`,
      `書き起こし: ${transcription}`,
      `JSONのみで回答 (スコアは상/중/하を使用):\n${jsonSchema}`,
      '',
      '最終確認：すべてのテキスト値が日本語のみであることを確認してから回答してください。',
    ].join('\n'),
  }

  // ca (中文)
  return {
    system: [
      '重要：所有回答必须100%使用中文书写。',
      '不得混入韩语、英语、越南语、日语等任何其他语言的单词。',
      '您是清晰、直接的济州航空机舱广播教练。',
      '严禁模糊反馈（"再好一点就好了"）。',
      'passengerImpression: 从乘客角度具体描述听到这段广播时的感受。',
      'specificIssue: 具体说明在哪里出了什么问题，用观察到的事实代替模糊评价词。',
      'actionGuide: 禁止抽象建议，包含数字或具体动作。',
      'drills: 基于weakest类别的actionGuide，提供3个可实现的练习。不得要求背诵全文。',
      '仅用JSON回答。',
    ].join(' '),
    user: [
      `广播文: ${title}`,
      `评分标准: 流利度(30分)/氛围声音(25分)/语调(25分)/发音(20分)`,
      `原文: ${originalText}`,
      `转录: ${transcription}`,
      `仅用JSON回答 (评分使用상/중/하):\n${jsonSchema}`,
      '',
      '最终确认：请确保所有文本值均为纯中文后再回答。',
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
      const { system, user } = buildPrompt(lang, scriptName, originalText, transcription)

      // 1차 시도
      let result = await callLlama(system, user)

      // 언어 혼입 감지 → 1회 재시도
      if (hasForeignMixture(result, lang)) {
        console.warn('[useGroq] 언어 혼입 감지 — 재시도합니다.', lang)
        result = await callLlama(system, user)

        // 재시도 후에도 혼입이 있으면 해당 필드에 오류 표시
        if (hasForeignMixture(result, lang)) {
          console.warn('[useGroq] 재시도 후에도 언어 혼입 감지 — 필드 오류 표시')
          const FALLBACK = '[표현 오류 - 다시 시도해주세요]'
          const fix = (field: string) =>
            detectForeignWords(field, lang) ? FALLBACK : field

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

      return result
    } catch (e) {
      const err = e instanceof GroqError ? e : new GroqError('네트워크 오류가 발생했습니다. 연결을 확인해 주세요.', false)
      setError(err.message)
      throw err
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  return { transcribeAudio, generateFeedback, isTranscribing, isAnalyzing, error }
}
