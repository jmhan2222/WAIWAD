import type { MarkupSegment, WordTimestamp, RhythmPoint, RhythmMismatch, RhythmAnalysis } from '../types'

function segVirtualLen(seg: MarkupSegment): number {
  if (seg.text.length > 0) return seg.text.length
  if (seg.types.includes('break-long')) return 3
  if (seg.types.includes('break-short')) return 1.5
  return 0
}

export function buildReferenceRhythm(segments: MarkupSegment[]): RhythmPoint[] {
  const totalLen = segments.reduce((sum, s) => sum + segVirtualLen(s), 0)
  if (totalLen === 0) return []

  const points: RhythmPoint[] = []
  let pos = 0

  for (const seg of segments) {
    const len = segVirtualLen(seg)
    if (len === 0) continue

    const centerPos = (pos + len / 2) / totalLen

    if (seg.types.includes('break-long')) {
      points.push({ position: centerPos, intensity: 0, type: 'pause' })
    } else if (seg.types.includes('break-short')) {
      points.push({ position: centerPos, intensity: 0.05, type: 'pause' })
    } else {
      let intensity = 0.3
      let type: RhythmPoint['type'] = 'normal'

      if (seg.types.includes('stress')) { intensity = 0.88; type = 'stress' }
      else if (seg.types.includes('slow')) { intensity = 0.55; type = 'slow' }
      else if (seg.types.includes('up')) { intensity = 0.42; type = 'normal' }
      else if (seg.types.includes('down')) { intensity = 0.35; type = 'normal' }

      points.push({ position: centerPos, intensity, type })
    }

    pos += len
  }

  return points
}

export function buildUserRhythm(words: WordTimestamp[]): RhythmPoint[] {
  if (words.length === 0) return []

  const firstStart = words[0].start
  const lastEnd = words[words.length - 1].end
  const totalDuration = lastEnd - firstStart
  if (totalDuration <= 0) return []

  const durations = words.map(w => w.end - w.start).filter(d => d > 0)
  const avgDuration = durations.reduce((a, b) => a + b, 0) / (durations.length || 1)

  const points: RhythmPoint[] = [{ position: 0, intensity: 0.2, type: 'normal' }]

  for (let i = 0; i < words.length; i++) {
    const w = words[i]
    const duration = w.end - w.start

    // Gap before this word → pause point
    if (i > 0) {
      const gap = w.start - words[i - 1].end
      if (gap > 0.28) {
        const gapPos = (words[i - 1].end - firstStart + gap / 2) / totalDuration
        points.push({ position: Math.min(1, Math.max(0, gapPos)), intensity: 0, type: 'pause' })
      }
    }

    const wordPos = (w.start - firstStart + duration / 2) / totalDuration
    const ratio = avgDuration > 0 ? duration / avgDuration : 1
    const intensity = Math.min(1, Math.max(0.1, 0.3 + (ratio - 1) * 0.4))
    const type: RhythmPoint['type'] = ratio > 1.4 ? 'slow' : ratio < 0.65 ? 'stress' : 'normal'

    points.push({ position: Math.min(1, Math.max(0, wordPos)), intensity, type })
  }

  points.push({ position: 1, intensity: 0.1, type: 'normal' })

  return points
}

export function interpolate(points: RhythmPoint[], pos: number): number {
  if (!points.length) return 0
  if (pos <= points[0].position) return points[0].intensity
  if (pos >= points[points.length - 1].position) return points[points.length - 1].intensity

  for (let i = 1; i < points.length; i++) {
    if (pos <= points[i].position) {
      const t = (pos - points[i - 1].position) / (points[i].position - points[i - 1].position)
      return points[i - 1].intensity + t * (points[i].intensity - points[i - 1].intensity)
    }
  }
  return 0
}

export function analyzeRhythm(
  referencePoints: RhythmPoint[],
  userPoints: RhythmPoint[],
  segments: MarkupSegment[],
): RhythmAnalysis {
  if (!referencePoints.length || !userPoints.length) {
    return { similarityScore: 50, mismatchPoints: [] }
  }

  const SAMPLES = 40
  let totalDiff = 0
  for (let i = 0; i <= SAMPLES; i++) {
    const pos = i / SAMPLES
    totalDiff += Math.abs(interpolate(referencePoints, pos) - interpolate(userPoints, pos))
  }
  const similarityScore = Math.round(Math.max(0, Math.min(100, (1 - (totalDiff / (SAMPLES + 1)) * 1.6) * 100)))

  const totalLen = segments.reduce((sum, s) => sum + segVirtualLen(s), 0)
  const mismatchPoints: RhythmMismatch[] = []
  let pos = 0

  for (const seg of segments) {
    const len = segVirtualLen(seg)
    if (len === 0) { continue }

    const segPos = (pos + len / 2) / totalLen
    const userVal = interpolate(userPoints, segPos)

    if (seg.types.includes('stress') && userVal < 0.42) {
      mismatchPoints.push({ position: segPos, issue: 'missing_stress', expectedText: seg.text })
    } else if (seg.types.includes('break-long') && userVal > 0.22) {
      mismatchPoints.push({ position: segPos, issue: 'missing_pause', expectedText: '(문장 쉼)' })
    } else if (seg.types.includes('break-short') && userVal > 0.32) {
      mismatchPoints.push({ position: segPos, issue: 'missing_pause', expectedText: '(절 쉼)' })
    } else if (seg.text.length > 0) {
      const refVal = interpolate(referencePoints, segPos)
      const diff = userVal - refVal
      if (diff < -0.32 && refVal > 0.28) {
        mismatchPoints.push({ position: segPos, issue: 'too_fast', expectedText: seg.text })
      } else if (diff > 0.38 && !seg.types.includes('slow')) {
        mismatchPoints.push({ position: segPos, issue: 'too_slow', expectedText: seg.text })
      }
    }

    pos += len
  }

  return { similarityScore, mismatchPoints: mismatchPoints.slice(0, 5) }
}

const ISSUE_KO: Record<string, string> = {
  missing_stress: '강조가 부족했습니다 (또렷하게 강조 필요)',
  too_fast: '너무 빠르게 읽었습니다 (천천히 읽어야 함)',
  too_slow: '너무 느리게 읽었습니다 (속도 조절 필요)',
  missing_pause: '쉬지 않고 이어서 읽었습니다 (쉼 필요)',
  extra_pause: '너무 오래 멈췄습니다',
}

export function formatMismatchSummary(mismatches: RhythmMismatch[]): string {
  if (!mismatches.length) return ''
  return mismatches
    .map(m => {
      const label = m.expectedText && !m.expectedText.startsWith('(')
        ? `"${m.expectedText}" 구간에서 `
        : m.expectedText + ' 구간에서 '
      return `- ${label}${ISSUE_KO[m.issue] ?? m.issue}`
    })
    .join('\n')
}
