/**
 * check-markup-coverage.js
 * announcements.json vs markup-cache.json 커버리지 현황 출력.
 *
 * 사용법:
 *   node scripts/check-markup-coverage.js
 *   npm run markup:check
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')

const announcementsPath = path.join(PROJECT_ROOT, 'public', 'data', 'announcements.json')
const cachePath         = path.join(PROJECT_ROOT, 'public', 'data', 'markup-cache.json')

const VALIDATE_COMPLETENESS = process.argv.includes('--validate-completeness')

const { announcements } = JSON.parse(fs.readFileSync(announcementsPath, 'utf8'))
const cache = fs.existsSync(cachePath)
  ? JSON.parse(fs.readFileSync(cachePath, 'utf8'))
  : {}

const normalizeStr = s => s.replace(/\s+/g, '').trim()
function checkCompleteness(originalText, segments) {
  const reconstructed = normalizeStr(segments.map(s => s.text).join(''))
  return originalText ? reconstructed.length / normalizeStr(originalText).length : 1
}

let hasText = 0, hasMarkup = 0
const missing    = []   // { id, lang, title }
const noTextMap  = {}   // id → { id, title, langs[] }

for (const ann of announcements) {
  for (const lang of ann.evalLang) {
    const text = (ann[lang] ?? '').trim()
    if (text) {
      hasText++
      if (cache[ann.id]?.[lang]) {
        hasMarkup++
      } else {
        missing.push({ id: ann.id, lang, title: ann.title })
      }
    } else {
      if (!noTextMap[ann.id]) noTextMap[ann.id] = { id: ann.id, title: ann.title, langs: [] }
      noTextMap[ann.id].langs.push(lang)
    }
  }
}

const noText   = Object.values(noTextMap)
const coverage = hasText > 0 ? Math.round(hasMarkup / hasText * 100) : 0

console.log('\n📊 마크업 커버리지 현황')
console.log('─'.repeat(54))
console.log(`  텍스트 보유 항목:  ${String(hasText).padStart(3)}개  (섹션 × 언어 조합)`)
console.log(`  마크업 보유 항목:  ${String(hasMarkup).padStart(3)}개`)
console.log(`  마크업 누락 항목:  ${String(missing.length).padStart(3)}개`)
console.log(`  텍스트 없는 섹션:  ${String(noText.length).padStart(3)}개`)
console.log(`  커버리지:          ${coverage}%`)
console.log('─'.repeat(54))

if (missing.length > 0) {
  console.log(`\n❌ 마크업 누락 (${missing.length}개) — npm run markup:generate 로 생성 가능`)
  for (const m of missing) {
    console.log(`  ${m.id.padEnd(20)} [${m.lang}]  "${m.title}"`)
  }
}

if (noText.length > 0) {
  console.log(`\n⚠️  텍스트 없음 (${noText.length}개 섹션) — PDF 교범에서 텍스트 보충 필요`)
  for (const n of noText) {
    console.log(`  ${n.id.padEnd(20)} [${n.langs.join('/')}]  "${n.title}"`)
  }
}

// ── 완전성 검증 ──────────────────────────────────────────────────────────────
if (VALIDATE_COMPLETENESS) {
  const incomplete = []
  for (const ann of announcements) {
    for (const lang of ann.evalLang) {
      const text = (ann[lang] ?? '').trim()
      if (!text || !cache[ann.id]?.[lang]) continue
      const ratio = checkCompleteness(text, cache[ann.id][lang])
      if (ratio < 0.95) {
        incomplete.push({ id: ann.id, lang, title: ann.title, ratio })
      }
    }
  }

  console.log('\n🔍 완전성 검증 결과 (95% 기준)')
  console.log('─'.repeat(54))
  if (incomplete.length === 0) {
    console.log('  ✅ 모든 항목이 95% 이상 완전합니다.')
  } else {
    console.log(`  ❌ 불완전 항목: ${incomplete.length}개 — npm run markup:fix 로 재생성 가능`)
    for (const m of incomplete) {
      const pct = (m.ratio * 100).toFixed(1)
      console.log(`  ${m.id.padEnd(20)} [${m.lang}]  ${pct.padStart(5)}%  "${m.title}"`)
    }
  }
  console.log('─'.repeat(54))
}

console.log()
