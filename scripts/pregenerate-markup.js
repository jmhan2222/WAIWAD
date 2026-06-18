/**
 * pregenerate-markup.js
 * 모든 방송문의 억양 마크업을 사전 생성해서 public/data/markup-cache.json 에 저장.
 *
 * 사용법:
 *   node scripts/pregenerate-markup.js              # 전체 생성
 *   node scripts/pregenerate-markup.js --force      # 기존 캐시 무시하고 재생성
 *   node scripts/pregenerate-markup.js --id=2-3     # 특정 ID만 생성
 *   node scripts/pregenerate-markup.js --dry-run    # API 호출 없이 대상 목록만 출력
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')

// ── .env.local 에서 API 키 로드 ──────────────────────────────────────────────

function loadEnv() {
  try {
    const envPath = path.join(PROJECT_ROOT, '.env.local')
    const content = fs.readFileSync(envPath, 'utf8')
    for (const line of content.split('\n')) {
      const match = line.match(/^([A-Z_a-z][A-Z_a-z0-9]*)=(.*)$/)
      if (match) process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '')
    }
  } catch { /* .env.local 없으면 process.env 그대로 사용 */ }
}

loadEnv()

const API_KEY = process.env.VITE_GROQ_API_KEY
if (!API_KEY) {
  console.error('❌  VITE_GROQ_API_KEY 가 없습니다. .env.local 또는 환경변수를 확인해주세요.')
  process.exit(1)
}

// ── 옵션 파싱 ────────────────────────────────────────────────────────────────

const FORCE           = process.argv.includes('--force')
const DRY_RUN         = process.argv.includes('--dry-run')
const FIX_INCOMPLETE  = process.argv.includes('--fix-incomplete')
const ONLY_ID         = process.argv.find(a => a.startsWith('--id='))?.slice(5)
const ONLY_LANG       = process.argv.find(a => a.startsWith('--lang='))?.slice(7)
const DELAY_MS        = 1000  // API 호출 사이 딜레이 (rate limit 방지)

const normalizeStr = s => s.replace(/\s+/g, '')
function checkSentences(segments, originalText) {
  const reconstructed = segments.map(s => s.text).join('')
  const normalizedRecon = normalizeStr(reconstructed)
  const sentences = originalText
    .split(/(?<=[.!?！？。])\s*/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
  const missing = sentences.filter(sentence => {
    const norm = normalizeStr(sentence)
    const check = norm.substring(0, Math.min(15, norm.length))
    return check.length > 0 && !normalizedRecon.includes(check)
  })
  return { isComplete: missing.length === 0, missingSentences: missing }
}
function saveCache(cachePath, cache) {
  cache._generatedAt = new Date().toISOString()
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2))
}

function buildFallback(originalText, segments) {
  const joined = segments.map(s => s.text).join('')
  if (joined.length < originalText.length && originalText.startsWith(joined)) {
    const missing = originalText.slice(joined.length)
    return [...segments, { text: missing, types: ['normal'] }]
  }
  return [{ text: originalText, types: ['normal'] }]
}

// ── 타입 정의 ────────────────────────────────────────────────────────────────

const VALID_TYPES = new Set([
  'break-long', 'break-short', 'stress', 'slow', 'up', 'down', 'flat', 'normal',
])

// ── Groq API 호출 ────────────────────────────────────────────────────────────

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function callGroq(system, user, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
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

    if (res.status === 429) {
      const waitMs = [2000, 5000, 10000][attempt] ?? 10000
      console.warn(`  ⏳ Rate limit (429) — ${waitMs / 1000}s 후 재시도...`)
      await sleep(waitMs)
      continue
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()
    return JSON.parse(data.choices[0].message.content)
  }
  throw new Error('재시도 횟수 초과')
}

// ── 프롬프트 빌더 ────────────────────────────────────────────────────────────

function buildPrompt(plainText, lang, title) {
  const common = [
    '[규칙] 세그먼트 text를 이어붙이면 원본과 정확히 동일해야 합니다. break 타입은 text가 반드시 "".',
    '{"segments":[{"text":"...","type":"...","tip":"(선택/optional)"},...]} 형식으로만 응답.',
  ]

  if (lang === 'ko') return {
    system: '당신은 제주항공 기내방송 억양 분석 전문가입니다. 유효한 JSON만 반환하세요.',
    user: [
      `[제목] ${title}`,
      `[방송문]\n${plainText}`,
      '',
      '위 방송문을 의미 단위 세그먼트로 나누어 억양 마크업을 생성하세요.',
      '[타입] break-long(문장끝/의미전환,text="") | break-short(절사이,text="") | stress(핵심정보 — 반드시 1~3어절만, 문장전체 X) | slow(천천히) | up(올림) | down(내림) | flat(평탄) | normal(일반)',
      ...common,
    ].join('\n'),
  }

  if (lang === 'en') return {
    system: 'You are a Jeju Air cabin announcement intonation specialist. Return ONLY valid JSON.',
    user: [
      `[Title] ${title}`,
      `[Script]\n${plainText}`,
      '',
      'Generate intonation markup by splitting the text into meaning-unit segments.',
      '[Types] break-long(sentence end, text="") | break-short(clause pause, text="") | stress(key info — 1-3 words ONLY, never whole sentence) | slow(read slowly) | up(rising) | down(falling) | flat(level) | normal',
      '[Rule] Concatenated texts must equal the original. Break types: text must be "".',
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
      '[タイプ] break-long(文末,text="") | break-short(節間,text="") | stress(重要情報 — 1〜3語節のみ、文全体禁止) | slow(ゆっくり) | up(上昇) | down(下降) | flat(平坦) | normal',
      '[規則] text結合=原文。breakのtextは必ず""。',
      '{"segments":[{"text":"...","type":"...","tip":"(任意)"},...]} のみで回答。',
    ].join('\n'),
  }

  // ca
  return {
    system: '您是济州航空机舱广播语调专家。请仅返回有效的JSON。',
    user: [
      `[标题] ${title}`,
      `[广播文]\n${plainText}`,
      '',
      '将广播文按意义单位分段生成语调标记。',
      '[类型] break-long(句末,text="") | break-short(分句,text="") | stress(关键信息 — 仅限1-3词，禁止整句) | slow(缓读) | up(升调) | down(降调) | flat(平调) | normal',
      '[规则] text拼接=原文。break的text必须为""。',
      '{"segments":[{"text":"...","type":"...","tip":"(可选)"},...]}',
    ].join('\n'),
  }
}

// ── 세그먼트 정규화 & 검증 ───────────────────────────────────────────────────

function normalizeSegments(raw, originalText) {
  if (!Array.isArray(raw)) return null

  const segments = raw
    .filter(s => typeof s.text === 'string' && typeof s.type === 'string')
    .map(s => ({
      text: s.text,
      types: [VALID_TYPES.has(s.type) ? s.type : 'normal'],
      ...(s.tip ? { tip: s.tip } : {}),
    }))

  const joined = segments.map(s => s.text).join('')
  if (!joined || !originalText) return null
  const ratio = joined.length / originalText.length
  if (ratio < 0.7 || ratio > 1.4) {
    console.warn(`    ⚠️  텍스트 불일치 (비율: ${ratio.toFixed(2)}) — 스킵`)
    return null
  }

  return segments
}

// ── 메인 ──────────────────────────────────────────────────────────────────────

async function main() {
  const announcementsPath = path.join(PROJECT_ROOT, 'public', 'data', 'announcements.json')
  const cachePath         = path.join(PROJECT_ROOT, 'public', 'data', 'markup-cache.json')

  const { announcements } = JSON.parse(fs.readFileSync(announcementsPath, 'utf8'))
  const cache = fs.existsSync(cachePath)
    ? JSON.parse(fs.readFileSync(cachePath, 'utf8'))
    : {}

  // 생성 대상 목록 수집
  const targets = []
  for (const ann of announcements) {
    if (ONLY_ID && ann.id !== ONLY_ID) continue
    for (const lang of ann.evalLang) {
      if (ONLY_LANG && lang !== ONLY_LANG) continue
      const text = ann[lang]
      if (!text || !text.trim()) continue
      if (FIX_INCOMPLETE) {
        // 캐시에 있지만 문장 단위 검증 실패인 항목만 대상
        const cached = cache[ann.id]?.[lang]
        if (!cached) continue
        const { isComplete, missingSentences } = checkSentences(cached, text)
        if (isComplete) continue
        targets.push({ ann, lang, text, missingSentences })
      } else {
        if (!FORCE && cache[ann.id]?.[lang]) continue  // 이미 캐시됨
        targets.push({ ann, lang, text })
      }
    }
  }

  if (FIX_INCOMPLETE && targets.length > 0) {
    console.log(`\n🔍 불완전 항목 (${targets.length}개):`)
    for (const { ann, lang, missingSentences } of targets) {
      console.log(`  ${ann.id}  [${lang}]  "${ann.title}"`)
      for (const s of missingSentences ?? []) {
        console.log(`    누락: "${s.substring(0, 50)}${s.length > 50 ? '...' : ''}"`)
      }
    }
    console.log()
  }

  const modeLabel = DRY_RUN ? '[DRY RUN]' : FIX_INCOMPLETE ? '[불완전 항목 재생성]' : ''
  console.log(`\n🎵  억양 마크업 사전 생성 ${modeLabel}`)
  console.log(`📊  생성 대상: ${targets.length}개 (전체 건너뜀: ${
    announcements.reduce((n, a) => n + a.evalLang.filter(l => {
      const t = a[l]; return t && t.trim() && !FORCE && cache[a.id]?.[l]
    }).length, 0)
  }개 기존 캐시)\n`)

  if (targets.length === 0) {
    console.log('✅  모두 이미 캐시되어 있습니다.')
    return
  }

  if (DRY_RUN) {
    for (const { ann, lang } of targets) {
      console.log(`  ${ann.id}  ${lang}  "${ann.title}"`)
    }
    return
  }

  let ok = 0, fail = 0

  for (let i = 0; i < targets.length; i++) {
    const { ann, lang, text } = targets[i]
    process.stdout.write(`  [${i + 1}/${targets.length}] ${ann.id} (${lang}) "${ann.title}" ... `)

    try {
      const { system, user } = buildPrompt(text, lang, ann.title)
      let parsed = await callGroq(system, user)
      let segments = normalizeSegments(parsed.segments, text)

      if (!segments) {
        // normalizeSegments가 비율 0.7 미만으로 거부 — 전체 원문 normal로 폴백
        console.log(`⚠️  형식 검증 실패 — 원문 전체 normal 폴백 적용`)
        if (!cache[ann.id]) cache[ann.id] = {}
        cache[ann.id][lang] = [{ text: text, types: ['normal'] }]
        saveCache(cachePath, cache)
        ok++
        if (i < targets.length - 1) await sleep(DELAY_MS)
        continue
      }

      // 완전성 검증 (문장 단위)
      let { isComplete, missingSentences } = checkSentences(segments, text)
      if (!isComplete) {
        process.stdout.write(`\n    ⚠️  문장 누락 (${missingSentences.length}개) — 재시도... `)
        const retryHint = '⚠️ 이전 시도에서 일부 문장이 누락되었습니다. 원본의 첫 글자부터 마지막 글자까지 모든 텍스트를 빠짐없이 세그먼트에 포함하세요. 특히 질문형 문장이나 마지막 안내 문장을 누락하지 마세요.'
        const { user: retryUser } = buildPrompt(text, lang, ann.title)
        parsed = await callGroq(system, `${retryUser}\n\n${retryHint}`)
        const retried = normalizeSegments(parsed.segments, text)
        if (retried) {
          segments = retried
          const r2 = checkSentences(segments, text)
          isComplete = r2.isComplete
          missingSentences = r2.missingSentences
        }
      }

      if (!isComplete) {
        process.stdout.write(`\n    ❌  재시도 후에도 문장 누락 (${missingSentences?.length}개) — 폴백 적용 `)
        segments = buildFallback(text, segments)
      }

      if (!cache[ann.id]) cache[ann.id] = {}
      cache[ann.id][lang] = segments
      fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2))
      const { isComplete: finalOk } = checkSentences(segments, text)
      console.log(`✅  ${segments.length}개 세그먼트 (${finalOk ? '완전' : '⚠️불완전'})`)
      ok++
    } catch (e) {
      console.log(`❌  오류: ${e.message}`)
      fail++
    }

    // 마지막 항목이 아니면 딜레이
    if (i < targets.length - 1) await sleep(DELAY_MS)
  }

  console.log(`\n완료: ✅ ${ok}개 성공  ❌ ${fail}개 실패`)
  console.log(`캐시 파일: ${cachePath}\n`)
}

main().catch(e => {
  console.error('치명적 오류:', e)
  process.exit(1)
})
