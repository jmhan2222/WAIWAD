import { useState, useEffect } from 'react'
import type { MarkupSegment } from '../types'
import { generateMarkup } from './useGroq'

type Lang = 'ko' | 'en' | 'ja' | 'ca'

// 정적 사전생성 캐시 (markup-cache.json) — 싱글턴 로드
let staticCache: Record<string, Partial<Record<Lang, MarkupSegment[]>>> | null = null
let staticCacheLoading = false
const staticCacheListeners: Array<() => void> = []

function loadStaticCache(): Promise<void> {
  if (staticCache !== null) return Promise.resolve()
  return new Promise(resolve => {
    staticCacheListeners.push(resolve)
    if (!staticCacheLoading) {
      staticCacheLoading = true
      fetch('/data/markup-cache.json')
        .then(r => (r.ok ? r.json() : {}))
        .catch(() => ({}))
        .then((data: Record<string, Partial<Record<Lang, MarkupSegment[]>>>) => {
          staticCache = data
          staticCacheListeners.forEach(fn => fn())
          staticCacheListeners.length = 0
        })
    }
  })
}

export function useMarkup(
  announcementId: string,
  lang: Lang,
  plainText: string,
  title: string,
) {
  const [segments, setSegments] = useState<MarkupSegment[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    // 일본어는 JapaneseScript가 별도 처리 — 마크업 생성 스킵
    if (lang === 'ja' || !plainText || !announcementId) return

    let cancelled = false
    const cacheKey = `markup_${announcementId}_${lang}`

    setSegments(null)
    setError(false)

    async function load() {
      setLoading(true)

      // 1. localStorage 캐시
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const parsed = JSON.parse(cached) as MarkupSegment[]
          if (Array.isArray(parsed) && parsed.length > 0 && !cancelled) {
            setSegments(parsed)
            setLoading(false)
            return
          }
        }
      } catch { /* localStorage 파싱 오류 무시 */ }

      // 2. 정적 파일 캐시 (pregenerate 결과)
      await loadStaticCache()
      const staticEntry = staticCache?.[announcementId]?.[lang]
      if (staticEntry && !cancelled) {
        setSegments(staticEntry)
        try { localStorage.setItem(cacheKey, JSON.stringify(staticEntry)) } catch { /* 스토리지 초과 무시 */ }
        setLoading(false)
        return
      }

      // 3. Groq API 실시간 생성
      try {
        const result = await generateMarkup(plainText, lang, title)
        if (!cancelled) {
          setSegments(result)
          try { localStorage.setItem(cacheKey, JSON.stringify(result)) } catch { /* 스토리지 초과 무시 */ }
        }
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [announcementId, lang, plainText, title])

  return { segments, loading, error }
}
