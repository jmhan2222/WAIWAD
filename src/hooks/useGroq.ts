import { useState, useCallback } from 'react'
import type { FeedbackResult } from '../types'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

export function useGroq() {
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const transcribeAudio = useCallback(async (audioBlob: Blob, lang: 'ko' | 'en'): Promise<string> => {
    setIsTranscribing(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', audioBlob, 'recording.webm')
      formData.append('model', 'whisper-large-v3')
      formData.append('language', lang === 'ko' ? 'ko' : 'en')
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
    lang: 'ko' | 'en',
    scriptName: string,
  ): Promise<FeedbackResult> => {
    setIsAnalyzing(true)
    setError(null)
    try {
      const systemPrompt = lang === 'ko'
        ? `당신은 항공사 객실승무원 기내방송 훈련 전문 코치입니다. 반드시 JSON만 반환하고 다른 텍스트는 절대 포함하지 마세요.`
        : `You are an expert airline cabin crew PA announcement training coach. Return ONLY valid JSON, no other text.`

      const userPrompt = lang === 'ko'
        ? `방송문 제목: ${scriptName}
원본 방송문:
${originalText}

훈련생 발음 전사본:
${transcription}

아래 JSON 형식으로만 평가해주세요. 평가기준: 유창성(30점)/분위기목소리(25점)/억양(25점)/발음(20점). 각 부문을 상/중/하로 평가.

{
  "categories": {
    "fluency": {"score":"상|중|하","good":"잘한점","improve":"개선점","drill":"연습법"},
    "voice": {"score":"상|중|하","good":"잘한점","improve":"개선점","drill":"연습법"},
    "intonation": {"score":"상|중|하","good":"잘한점","improve":"개선점","drill":"연습법"},
    "pronunciation": {"score":"상|중|하","good":"잘한점","improve":"개선점","drill":"연습법"}
  },
  "summary": "전체 총평",
  "weakest": "fluency|voice|intonation|pronunciation",
  "nextStep": "다음 집중 포인트"
}`
        : `Script: ${scriptName}
Original text:
${originalText}

Trainee transcription:
${transcription}

Evaluate in this exact JSON format only. Criteria: Fluency(30)/Voice(25)/Intonation(25)/Pronunciation(20). Score each as high/medium/low.

{
  "categories": {
    "fluency": {"score":"high|medium|low","good":"what was good","improve":"what to improve","drill":"drill method"},
    "voice": {"score":"high|medium|low","good":"what was good","improve":"what to improve","drill":"drill method"},
    "intonation": {"score":"high|medium|low","good":"what was good","improve":"what to improve","drill":"drill method"},
    "pronunciation": {"score":"high|medium|low","good":"what was good","improve":"what to improve","drill":"drill method"}
  },
  "summary": "overall summary",
  "weakest": "fluency|voice|intonation|pronunciation",
  "nextStep": "next focus point"
}`

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
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
