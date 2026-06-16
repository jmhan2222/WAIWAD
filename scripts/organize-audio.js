/**
 * organize-audio.js
 * 모델보이스 음성 파일을 public/audio/ 로 자동 정리하는 스크립트.
 *
 * 사용법:
 *   node scripts/organize-audio.js --dry-run          # 복사 없이 매칭 결과만 확인
 *   node scripts/organize-audio.js                    # 실제 복사 실행
 *   node scripts/organize-audio.js --source=D:\audio  # 소스 경로 직접 지정
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── 설정 ─────────────────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes('--dry-run')

const SOURCE_ROOT =
  process.argv.find(a => a.startsWith('--source='))?.slice(9) ??
  path.join('C:', 'Users', 'admin', 'Desktop', 'cabinvoicepro2')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const TARGET_ROOT   = path.join(PROJECT_ROOT, 'public', 'audio')
const UNMATCHED_DIR = path.join(TARGET_ROOT, 'unmatched')

// ── 언어/성별 매핑 ────────────────────────────────────────────────────────────

/** 폴더명 키워드 → 언어 코드 */
function folderToLang(name) {
  if (name.includes('영어'))   return 'en'
  if (name.includes('일본어')) return 'ja'
  if (name.includes('중국어')) return 'ca'
  if (name.includes('한국어')) return 'ko'
  return null
}

/** 폴더명 키워드 → 성별 코드 */
function folderToGender(name) {
  if (name.includes('(남)')) return 'm'
  if (name.includes('(여)')) return 'f'
  return null
}

// ── 섹션번호 추출 ────────────────────────────────────────────────────────────

/**
 * 파일명에서 섹션 문자열 추출.
 * - 별표:  "[별표 3] 분실물..."  → "별표3"
 * - 일반:  "2.4.1 Safety..."    → "2.4.1"
 *          "3.10 Approach..."   → "3.10"
 */
function extractSection(filename) {
  // 별표 패턴
  const starMatch = filename.match(/^\[별표\s*(\d+)\]/)
  if (starMatch) return `별표${starMatch[1]}`

  // 일반 패턴: 숫자.숫자(.숫자...) 로 시작
  const normalMatch = filename.match(/^(\d+(?:\.\d+)+)/)
  if (normalMatch) return normalMatch[1]

  return null
}

// ── 파일 스캔 ─────────────────────────────────────────────────────────────────

function scanDir(dir) {
  const results = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...scanDir(fullPath))
    } else if (/\.(wav|mp3)$/i.test(entry.name)) {
      results.push(fullPath)
    }
  }
  return results
}

function scanSourceFiles() {
  let subfolders
  try {
    subfolders = fs.readdirSync(SOURCE_ROOT, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
  } catch (e) {
    console.error(`\n❌ 소스 폴더를 열 수 없습니다: ${SOURCE_ROOT}`)
    console.error(`   → --source=경로 로 소스 폴더를 직접 지정해주세요.`)
    console.error(`   원인: ${e.message}\n`)
    process.exit(1)
  }

  const files = []
  for (const folder of subfolders) {
    const lang   = folderToLang(folder)
    const gender = folderToGender(folder)

    if (!lang || !gender) {
      console.warn(`⚠️  폴더 스킵 (언어/성별 미인식): ${folder}`)
      continue
    }

    const folderPath = path.join(SOURCE_ROOT, folder)
    for (const filePath of scanDir(folderPath)) {
      files.push({ filePath, folder, lang, gender })
    }
  }
  return files
}

// ── 메인 ──────────────────────────────────────────────────────────────────────

function main() {
  const hr = '─'.repeat(90)
  console.log(`\n🎵  음성 파일 자동 정리 ${DRY_RUN ? '[DRY RUN — 실제 복사 없음]' : '[실제 복사 모드]'}`)
  console.log(`📂  소스:  ${SOURCE_ROOT}`)
  console.log(`📂  타겟:  ${TARGET_ROOT}\n`)

  // announcements.json 로드 → section → announcement 맵
  const announcementsPath = path.join(PROJECT_ROOT, 'public', 'data', 'announcements.json')
  const { announcements } = JSON.parse(fs.readFileSync(announcementsPath, 'utf8'))

  const sectionMap = new Map()            // "2.4.1" → announcement
  for (const ann of announcements) {
    sectionMap.set(ann.section, ann)
  }

  // 파일 스캔
  const sourceFiles = scanSourceFiles()
  console.log(`📊  스캔된 파일: ${sourceFiles.length}개\n`)

  const matched   = []
  const unmatched = []

  for (const { filePath, folder, lang, gender } of sourceFiles) {
    const filename = path.basename(filePath)
    const ext      = path.extname(filename).slice(1).toLowerCase()
    const section  = extractSection(filename)

    if (!section) {
      unmatched.push({ filePath, filename, folder, reason: '섹션번호 추출 실패' })
      continue
    }

    const ann = sectionMap.get(section)
    if (!ann) {
      unmatched.push({ filePath, filename, folder, reason: `섹션 미매칭 (추출값: '${section}')` })
      continue
    }

    const targetName = `${ann.id}-${lang}-model-${gender}.${ext}`
    const targetPath = path.join(TARGET_ROOT, targetName)
    matched.push({ filePath, filename, folder, ann, lang, gender, ext, targetName, targetPath })
  }

  // ── 결과 출력 ────────────────────────────────────────────────────────────────

  // 성공 테이블
  console.log('✅  매칭 성공')
  console.log(hr)
  console.log(`${'원본 파일명'.padEnd(55)} ${'→'.padEnd(4)} 타겟 파일명`)
  console.log(hr)

  const byLang = { ko: 0, en: 0, ja: 0, ca: 0 }
  for (const m of matched) {
    console.log(`${m.filename.padEnd(55)} →  ${m.targetName}`)
    byLang[m.lang] = (byLang[m.lang] ?? 0) + 1
  }
  console.log(hr)
  console.log(`합계: ${matched.length}개  |  ko:${byLang.ko}  en:${byLang.en}  ja:${byLang.ja}  ca:${byLang.ca}\n`)

  // 실패 테이블
  if (unmatched.length > 0) {
    console.log('❌  매칭 실패')
    console.log(hr)
    console.log(`${'파일명'.padEnd(55)} ${'폴더'.padEnd(20)} 원인`)
    console.log(hr)
    for (const u of unmatched) {
      console.log(`${u.filename.padEnd(55)} ${u.folder.padEnd(20)} ${u.reason}`)
    }
    console.log(hr)
    console.log(`합계: ${unmatched.length}개  → ${DRY_RUN ? '(실행 시) ' : ''}public/audio/unmatched/ 로 분리\n`)
  }

  if (DRY_RUN) {
    console.log('🏃  DRY RUN 완료 — 실제 파일은 변경되지 않았습니다.')
    console.log('    실제 복사를 실행하려면:\n')
    console.log(`    node scripts/organize-audio.js --source="${SOURCE_ROOT}"\n`)
    return
  }

  // ── 실제 복사 ────────────────────────────────────────────────────────────────

  fs.mkdirSync(TARGET_ROOT, { recursive: true })

  let copiedCount = 0
  for (const m of matched) {
    fs.copyFileSync(m.filePath, m.targetPath)
    copiedCount++
    console.log(`  복사: ${m.targetName}`)
  }

  if (unmatched.length > 0) {
    fs.mkdirSync(UNMATCHED_DIR, { recursive: true })
    for (const u of unmatched) {
      const rel  = path.relative(SOURCE_ROOT, u.filePath)
      const dest = path.join(UNMATCHED_DIR, rel)
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.copyFileSync(u.filePath, dest)
    }
    console.log(`\n⚠️  미매칭 ${unmatched.length}개 → public/audio/unmatched/`)
  }

  console.log(`\n✅  복사 완료: ${copiedCount}개`)
}

main()
