import { useState, useCallback } from 'react'
import type { FeedbackResult } from '../types'

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

    // 429: 마지막 시도였으면 에러 throw
    if (attempt === RETRY_DELAYS.length) throw classifyError(429)

    await sleep(RETRY_DELAYS[attempt])
  }
  // unreachable — TypeScript를 위해
  throw classifyError(429)
}

function buildPrompt(lang: Lang, title: string, originalText: string, transcription: string) {
  const jsonSchema = `{
  "categories": {
    "fluency": {"score":"상|중|하","good":"내용","improve":"내용","drill":"내용"},
    "voice": {"score":"상|중|하","good":"내용","improve":"내용","drill":"내용"},
    "intonation": {"score":"상|중|하","good":"내용","improve":"내용","drill":"내용"},
    "pronunciation": {"score":"상|중|하","good":"내용","improve":"내용","drill":"내용"}
  },
  "summary": "전체 총평",
  "weakest": "fluency|voice|intonation|pronunciation",
  "nextStep": "다음 집중 포인트"
}`

  if (lang === 'ko') return {
    system: '제주항공 기내방송 코치입니다. 반드시 JSON만 반환하고 다른 텍스트는 절대 포함하지 마세요.',
    user: `방송문: ${title}\n평가기준: 유창성(30점)/분위기목소리(25점)/억양(25점)/발음(20점)\n원본: ${originalText}\n전사본: ${transcription}\nJSON만 응답:\n${jsonSchema}`,
  }

  if (lang === 'en') return {
    system: 'You are a Jeju Air cabin announcement coach. Return ONLY valid JSON, no other text.',
    user: `Script: ${title}\nCriteria: Fluency(30pts)/Voice&Atmosphere(25pts)/Intonation(25pts)/Pronunciation(20pts)\nOriginal: ${originalText}\nTranscription: ${transcription}\nRespond in JSON only (use 상/중/하 for scores):\n${jsonSchema}`,
  }

  if (lang === 'ja') return {
    system: '済州航空の機内放送コーチです。JSONのみで回答してください。',
    user: `放送文: ${title}\n評価基準: 流暢さ(30点)/雰囲気・声(25点)/イントネーション(25点)/発音(25点)\n元の文: ${originalText}\n書き起こし: ${transcription}\nJSONのみで回答 (스코어는 상/중/하 사용):\n${jsonSchema}`,
  }

  return {
    system: '您是济州航空机舱广播教练。仅用JSON回答。',
    user: `广播文: ${title}\n评分标准: 流利度(30分)/氛围声音(25分)/语调(25分)/发音(20分)\n原文: ${originalText}\n转录: ${transcription}\n仅用JSON回答 (评分使用상/중/하):\n${jsonSchema}`,
  }
}

export function useGroq() {
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const transcribeAudio = useCallback(async (audioBlob: Blob, lang: Lang): Promise<string> => {
    setIsTranscribing(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', audioBlob, 'recording.webm')
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
