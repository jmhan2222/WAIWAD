import { useState, useCallback } from 'react'
import type { FeedbackResult } from '../types'

type Lang = 'ko' | 'en' | 'ja' | 'ca'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

const WHISPER_LANG: Record<Lang, string> = {
  ko: 'ko',
  en: 'en',
  ja: 'ja',
  ca: 'zh',
}

function buildPrompt(lang: Lang, title: string, originalText: string, transcription: string): { system: string; user: string } {
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

  if (lang === 'ko') {
    return {
      system: '제주항공 기내방송 코치입니다. 반드시 JSON만 반환하고 다른 텍스트는 절대 포함하지 마세요.',
      user: `방송문: ${title}
평가기준: 유창성(30점)/분위기목소리(25점)/억양(25점)/발음(20점)
원본: ${originalText}
전사본: ${transcription}
JSON만 응답:
${jsonSchema}`,
    }
  }

  if (lang === 'en') {
    return {
      system: 'You are a Jeju Air cabin announcement coach. Return ONLY valid JSON, no other text.',
      user: `Script: ${title}
Criteria: Fluency(30pts)/Voice&Atmosphere(25pts)/Intonation(25pts)/Pronunciation(20pts)
Original: ${originalText}
Transcription: ${transcription}
Respond in JSON only (use 상/중/하 for scores):
${jsonSchema}`,
    }
  }

  if (lang === 'ja') {
    return {
      system: '済州航空の機内放送コーチです。JSONのみで回答してください。',
      user: `放送文: ${title}
評価基準: 流暢さ(30点)/雰囲気・声(25点)/イントネーション(25点)/発音(25点)
元の文: ${originalText}
書き起こし: ${transcription}
JSONのみで回答 (스코어는 상/중/하 사용):
${jsonSchema}`,
    }
  }

  // ca (Cantonese/Chinese)
  return {
    system: '您是济州航空机舱广播教练。仅用JSON回答。',
    user: `广播文: ${title}
评分标准: 流利度(30分)/氛围声音(25分)/语调(25分)/发音(20分)
原文: ${originalText}
转录: ${transcription}
仅用JSON回答 (评分使用상/중/하):
${jsonSchema}`,
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

      const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
        body: formData,
      })

      if (!res.ok) throw new Error(`Transcription failed: ${res.status}`)
      const data = await res.json() as { text: string }
      return data.text
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

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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

      if (!res.ok) throw new Error(`Feedback failed: ${res.status}`)
      const data = await res.json() as { choices: { message: { content: string } }[] }
      return JSON.parse(data.choices[0].message.content) as FeedbackResult
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
      throw e
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  return { transcribeAudio, generateFeedback, isTranscribing, isAnalyzing, error }
}
