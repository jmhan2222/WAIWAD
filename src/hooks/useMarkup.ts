import { useState, useEffect } from 'react'
import type { MarkupSegment } from '../types'
import { generateMarkup } from './useGroq'

type Lang = 'ko' | 'en' | 'ja' | 'ca'

type StaticCacheData = Record<string, Partial<Record<Lang, MarkupSegment[]>>> & { _generatedAt?: string }

// 정적 사전생성 캐시 (markup-cache.json) — 싱글턴 로드
let staticCache: StaticCacheData | null = null
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
        .then((data: StaticCacheData) => {
          staticCache = data
          staticCacheListeners.forEach(fn => fn())
          staticCacheListeners.length = 0
        })
    }
  })
}

function getLocalCache(cacheKey: string): MarkupSegment[] | null {
  try {
    const raw = localStorage.getItem(cacheKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { _v?: string; data: MarkupSegment[] } | MarkupSegment[]
    // 구버전 형식 (배열 직접 저장) — 버전 검증 불가이므로 무효화
    if (Array.isArray(parsed)) return null
    const currentVersion = staticCache?._generatedAt
    if (currentVersion && parsed._v !== currentVersion) return null
    return Array.isArray(parsed.data) && parsed.data.length > 0 ? parsed.data : null
  } catch {
    return null
  }
}

function setLocalCache(cacheKey: string, segments: MarkupSegment[]): void {
  try {
    const version = staticCache?._generatedAt ?? ''
    localStorage.setItem(cacheKey, JSON.stringify({ _v: version, data: segments }))
  } catch { /* 스토리지 초과 무시 */ }
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

      // 1. 정적 파일 캐시 먼저 로드 (버전 확인을 위해 선행 필요)
      await loadStaticCache()

      // 2. localStorage 캐시 (버전 일치 시만 사용)
      const localHit = getLocalCache(cacheKey)
      if (localHit && !cancelled) {
        setSegments(localHit)
        setLoading(false)
        return
      }

      // 3. 정적 파일 캐시 (pregenerate 결과)
      const staticEntry = staticCache?.[announcementId]?.[lang]
      if (staticEntry && !cancelled) {
        setSegments(staticEntry)
        setLocalCache(cacheKey, staticEntry)
        setLoading(false)
        return
      }

      // 4. Groq API 실시간 생성
      try {
        const result = await generateMarkup(plainText, lang, title)
        if (!cancelled) {
          setSegments(result)
          setLocalCache(cacheKey, result)
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
