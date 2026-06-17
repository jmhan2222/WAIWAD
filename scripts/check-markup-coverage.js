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

const { announcements } = JSON.parse(fs.readFileSync(announcementsPath, 'utf8'))
const cache = fs.existsSync(cachePath)
  ? JSON.parse(fs.readFileSync(cachePath, 'utf8'))
  : {}

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

console.log()
