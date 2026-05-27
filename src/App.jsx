import { useState, useEffect, useRef } from "react";

const C = {
  orange: "#FF6600",
  dark: "#1A1A1A",
  card: "#2A2A2A",
  grayLight: "#F5F5F5",
  gray: "#6B6B6B",
  white: "#FFFFFF",
  red: "#E53E3E",
  green: "#2E9E6B",
  amber: "#FF8533",
};

const PART_C = { 0: "#555", 1: C.orange, 2: C.amber, 3: C.red, 4: C.green };

// ── Primitives ─────────────────────────────────────

function Bar({ color = C.orange }) {
  return <div style={{ height: 6, background: `linear-gradient(90deg,${color},${color}88)`, flexShrink: 0 }} />;
}

function Accent({ color = C.orange, style }) {
  return <div style={{ width: 44, height: 4, background: color, borderRadius: 2, ...style }} />;
}

function Pill({ children, bg = C.orange, style }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", background: bg, color: C.white, borderRadius: 4, padding: "2px 11px", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", ...style }}>
      {children}
    </span>
  );
}

function Tag({ children, color = C.orange }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", background: `${color}18`, color, border: `1px solid ${color}40`, borderRadius: 4, padding: "2px 11px", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em" }}>
      {children}
    </span>
  );
}

function Ph({ label, style }) {
  return (
    <div style={{ background: "#FF660008", border: "1.5px dashed #FF660030", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 48, ...style }}>
      <span style={{ fontSize: 12, color: "#FF660055", fontStyle: "italic" }}>{label || "[ 내용 작성 예정 ]"}</span>
    </div>
  );
}

// ── Timer ──────────────────────────────────────────

function useTimer(totalSec) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (running) ref.current = setInterval(() => setElapsed(e => Math.min(e + 1, totalSec)), 1000);
    else clearInterval(ref.current);
    return () => clearInterval(ref.current);
  }, [running, totalSec]);
  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const reset = () => { setElapsed(0); setRunning(false); };
  return { elapsed, running, setRunning, fmt, reset, pct: elapsed / totalSec };
}

// ── PART 1 DATA ────────────────────────────────────

const CASES = [
  {
    title: "터뷸런스 + 라면 요청",
    type: "안전 vs 서비스 판단",
    context: ["중거리 노선", "라이트 터뷸런스 잠잠해짐", "벨트사인 켜진 상태"],
    scenario: "물 붓자마자 라이트 터뷸런스 발생. 벨트사인 아직 On.\n32열 승객이 아까 주문한 라면 빨리 달라고 함.",
    questions: [
      "지금 라면을 제공할 수 있는가? 판단 근거는?",
      "벨트사인이 켜진 상태에서 서비스 제공은 어떤 기준을 위반하는가?",
      "승객에게 어떻게 안내할 것인가?",
    ],
  },
  {}, {}, {}, {}, {},
];

// ── PART 3 DATA ────────────────────────────────────

const SCENES = [
  {
    n: 1,
    time: "DOOR CLOSE 1분 전",
    phase: "지상",
    title: '"이번만 해드리는 거예요"',
    narrative: "운송직원은 보이지 않는 상태.\n승객이 갑자기 좌석 변경을 요청했고,\n사무장이 직접 나서서 처리했다.",
    violations: [
      "운송직원 부재 중 사무장 단독 좌석 변경 처리",
      '"이번만이에요" — 예외 승인 발언으로 선례 형성 위험',
    ],
  },
  {
    n: 2,
    time: "이륙 후 서비스",
    phase: "기내 후방",
    title: '"새벽이니까 얼른 끝내자"',
    narrative: "사전기내식 14개가 후방에 탑재.\n갤리브리핑도, 카트도 없이 서비스가 시작됐다.\n인디비쥬얼 서비스 — 선임이 혼자 나가라고 했다.\n기내식 1개 부족 → 남은 거 드릴게요. 알러지는?",
    violations: [
      "카트 미사용 서비스 — 난기류 없어도 규정 위반",
      "한국어 방송만 종료 후 즉시 서비스 개시",
      "인디비쥬얼 서비스 2인 1조 원칙 미준수",
      "갤리브리핑 미진행",
      "대체 기내식 제공 시 알러지 확인 미실시",
    ],
  },
  {
    n: 3,
    time: "기내 면세 서비스",
    phase: "기내",
    title: '"일단 해보자"',
    narrative: "DP 배정이 불분명한 상태.\nAL이 사무장에게 자신이 함께 하겠다고 했고,\n확인 없이 서비스가 시작됐다.",
    violations: [
      "DP 부듀티 여부 미확인 상태에서 AL 임의 배정",
      "탑승권 확인 없이 카드 결제 진행",
      "액체류 100ml 구매 승객 — 환승 여부 미확인 (5월 강조 사항)",
    ],
  },
  {
    n: 4,
    time: "기내 비정상 상황",
    phase: "IRRE 발생",
    title: '"방송은 네가 해줘"',
    narrative: "기내 비정상 상황(IRRE)이 발생했다.\n사무장은 방송등급이 높다는 이유로 AL에게 방송을 넘겼다.\n기장으로부터 정보는 오지 않았고, 15분이 지났다.",
    violations: [
      "IRRE 방송을 AL에게 위임 — 방송등급은 위임 사유가 아님",
      "기장으로부터 정보 미수신 상태로 15분 경과",
      "10분마다 업데이트 방송 규정 미준수",
    ],
  },
];

// ── PART 0: Title ──────────────────────────────────

function TitleSlide() {
  return (
    <div style={{ width: "100%", height: "100%", background: C.dark, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", right: -100, top: -100, width: 520, height: 520, borderRadius: "50%", background: `radial-gradient(circle,${C.orange}1A 0%,transparent 65%)` }} />
      <div style={{ position: "absolute", left: -60, bottom: -60, width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle,${C.orange}0C 0%,transparent 65%)` }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 84px", zIndex: 2 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.orange, letterSpacing: "0.22em", marginBottom: 22 }}>JEJU AIR · CABIN SERVICE TRAINING · 50MIN</div>
        <div style={{ fontSize: 64, fontWeight: 900, color: C.white, lineHeight: 1.0, letterSpacing: "-0.03em", marginBottom: 10 }}>규정과 판단 사이</div>
        <div style={{ fontSize: 18, color: "#4A4A4A", marginBottom: 36, letterSpacing: "0.06em" }}>Between Rules and Judgment</div>
        <Accent />
        <div style={{ marginTop: 26, fontSize: 12, color: "#444" }}>전 경력 객실승무원 대상 · 50분 세션</div>
      </div>
      <Bar />
    </div>
  );
}

// ── Section Opener ─────────────────────────────────

const PART_META = {
  1: { title: "규정과 실제 근무 사이의 간극", sub: "현장에서 우리는 어떻게 판단하고 있는가", tag: "케이스 6개 · 소그룹 토의" },
  2: { title: "사무장 판단 영역", sub: "CSM 조문이 말하는 것과 현장 사이", tag: "CSM 조문 기반 토론" },
  3: { title: "지켜야 하는 규정 — Red Line", sub: "신입 승무원의 눈으로 다시 보기", tag: "내러티브 방식" },
  4: { title: "올바른 문화 만들기", sub: "우리가 함께 만들어가야 할 것", tag: "클로징" },
};

function SectionOpener({ part }) {
  const color = PART_C[part];
  const m = PART_META[part];
  return (
    <div style={{ width: "100%", height: "100%", background: C.dark, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, background: color }} />
      <div style={{ position: "absolute", right: -80, top: -80, width: 420, height: 420, borderRadius: "50%", background: `radial-gradient(circle,${color}14 0%,transparent 65%)` }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 80px 0 92px", zIndex: 2 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color, letterSpacing: "0.22em", marginBottom: 16 }}>PART {part} · {m.tag}</div>
        <div style={{ fontSize: 44, fontWeight: 900, color: C.white, lineHeight: 1.1, marginBottom: 14 }}>{m.title}</div>
        <div style={{ fontSize: 17, color: "#4A4A4A", marginBottom: 32 }}>{m.sub}</div>
        <Accent color={color} />
      </div>
      <Bar color={color} />
    </div>
  );
}

// ── PART 1 ─────────────────────────────────────────

function CaseSlide({ n, data = {} }) {
  const dark = n % 2 === 0;
  const bg = dark ? C.dark : C.white;
  const fg = dark ? C.white : C.dark;
  const cardBg = dark ? C.card : C.grayLight;
  const sub = dark ? "#888" : C.gray;
  const ctx = data.context?.length ? data.context : ["[ 노선 ]", "[ 조건 A ]", "[ 조건 B ]"];
  const qs = data.questions ?? [];
  return (
    <div style={{ width: "100%", height: "100%", background: bg, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "30px 64px 0" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <Pill>PART 1</Pill>
          <Tag>케이스 {n} / 6</Tag>
          <span style={{ fontSize: 11, color: sub }}>{data.type || "[ 케이스 유형 ]"}</span>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: fg, marginBottom: 6 }}>{data.title || `[ 케이스 ${n} 제목 ]`}</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {ctx.map((t, i) => (
            <span key={i} style={{ background: cardBg, borderRadius: 6, padding: "3px 12px", fontSize: 11, color: sub }}>{t}</span>
          ))}
        </div>
        <Accent style={{ marginBottom: 14 }} />
      </div>
      <div style={{ flex: 1, padding: "0 64px 22px", display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}>
        <div style={{ background: dark ? "#1E1E1E" : C.grayLight, borderRadius: 12, padding: "18px 22px", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.orange, letterSpacing: "0.1em", marginBottom: 10 }}>SCENARIO</div>
          {data.scenario
            ? <div style={{ fontSize: 13, color: dark ? "#CCC" : C.dark, lineHeight: 1.9, whiteSpace: "pre-line", flex: 1 }}>{data.scenario}</div>
            : <Ph label={`[ 케이스 ${n} — 시나리오 내용 ]`} style={{ flex: 1, background: "transparent", border: "none", justifyContent: "flex-start", alignItems: "flex-start" }} />
          }
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.orange, letterSpacing: "0.1em" }}>생각해볼 것</div>
          {[0, 1, 2].map(qi => (
            <div key={qi} style={{ background: cardBg, borderRadius: 10, padding: "12px 16px", borderLeft: `4px solid ${C.orange}` }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: C.orange, marginRight: 6 }}>Q{qi + 1}</span>
              <span style={{ fontSize: 12, color: sub }}>{qs[qi] || `[ 생각해볼 질문 ${qi + 1} ]`}</span>
            </div>
          ))}
        </div>
      </div>
      <Bar />
    </div>
  );
}

function DiscussTimerSlide() {
  const totalSec = 15 * 60;
  const { elapsed, running, setRunning, fmt, reset, pct } = useTimer(totalSec);
  const remaining = totalSec - elapsed;
  const tc = remaining < 120 ? "#FF4444" : remaining < 300 ? "#FFA500" : C.orange;
  return (
    <div style={{ width: "100%", height: "100%", background: C.dark, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "26px 64px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <Pill>PART 1</Pill>
              <Tag color={C.green}>소그룹 토의 · 15분</Tag>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.white }}>[ 소그룹 토의 — 가이드 ]</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 54, fontWeight: 900, color: tc, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>{fmt(remaining)}</div>
            <div style={{ position: "relative", height: 8, width: 180, background: "#2A2A2A", borderRadius: 4, margin: "6px auto" }}>
              <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${(1 - pct) * 100}%`, background: tc, borderRadius: 4, transition: "width 1s linear" }} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button onClick={() => setRunning(r => !r)} style={{ background: running ? "#444" : C.orange, color: C.white, border: "none", borderRadius: 6, padding: "6px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {running ? "⏸ 일시정지" : elapsed === 0 ? "▶ 시작" : "▶ 재개"}
              </button>
              <button onClick={reset} style={{ background: "#333", color: "#888", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer" }}>↺</button>
            </div>
          </div>
        </div>
        <Accent style={{ marginTop: 14, marginBottom: 18 }} />
      </div>
      <div style={{ flex: 1, padding: "0 64px 22px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.orange, letterSpacing: "0.1em" }}>토의 질문</div>
          {[1, 2, 3].map(q => (
            <div key={q} style={{ background: C.card, borderRadius: 10, padding: "14px 18px", borderLeft: `4px solid ${C.orange}` }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: C.orange, marginRight: 8 }}>Q{q}</span>
              <span style={{ fontSize: 13, color: "#CCC" }}>[ 토의 질문 {q} ]</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: "0.1em" }}>진행 안내</div>
          {["[ 진행 안내 A ]", "[ 진행 안내 B ]", "[ 진행 안내 C ]"].map((g, i) => (
            <div key={i} style={{ background: "#242424", borderRadius: 8, padding: "12px 16px" }}>
              <span style={{ color: C.orange, marginRight: 8 }}>›</span>
              <span style={{ fontSize: 12, color: "#AAA" }}>{g}</span>
            </div>
          ))}
        </div>
      </div>
      <Bar />
    </div>
  );
}

// ── PART 2 ─────────────────────────────────────────

function CSMSlide({ n }) {
  const color = C.amber;
  const dark = n % 2 === 0;
  const bg = dark ? C.dark : C.white;
  const fg = dark ? C.white : C.dark;
  const cardBg = dark ? C.card : C.grayLight;
  const sub = dark ? "#888" : C.gray;
  return (
    <div style={{ width: "100%", height: "100%", background: bg, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "32px 64px 0" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <Pill bg={color}>PART 2</Pill>
          <Tag color={color}>CSM 조문 {n}</Tag>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: fg, marginBottom: 6 }}>[ CSM 조문 {n} 제목 ]</div>
        <Accent color={color} style={{ marginBottom: 18 }} />
      </div>
      <div style={{ flex: 1, padding: "0 64px 22px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.1em" }}>조문 내용</div>
          <Ph label="[ CSM 조문 원문 ]" style={{ flex: 1 }} />
          <Ph label="[ 관련 해설 또는 배경 ]" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.1em" }}>토론 포인트</div>
          {["A", "B", "C"].map((p, i) => (
            <div key={i} style={{ background: cardBg, borderRadius: 10, padding: "14px 18px", borderLeft: `4px solid ${color}` }}>
              <span style={{ fontSize: 11, fontWeight: 800, color, marginRight: 8 }}>P{i + 1}</span>
              <span style={{ fontSize: 12, color: sub }}>[ 토론 포인트 {p} ]</span>
            </div>
          ))}
        </div>
      </div>
      <Bar color={color} />
    </div>
  );
}

function Part2DiscussSlide() {
  const color = C.amber;
  return (
    <div style={{ width: "100%", height: "100%", background: C.dark, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "32px 64px 0" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <Pill bg={color}>PART 2</Pill>
          <Tag color={color}>사무장 판단 토론</Tag>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.white, marginBottom: 6 }}>[ 토론 주제 ]</div>
        <Accent color={color} style={{ marginBottom: 18 }} />
      </div>
      <div style={{ flex: 1, padding: "0 64px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
        <Ph label="[ 토론 시나리오 또는 상황 설명 ]" style={{ flex: 2 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, flex: 1 }}>
          <Ph label="[ 토론 질문 A ]" />
          <Ph label="[ 토론 질문 B ]" />
        </div>
      </div>
      <Bar color={color} />
    </div>
  );
}

// ── PART 3: Storytelling ───────────────────────────

function P3InterviewSlide() {
  return (
    <div style={{ width: "100%", height: "100%", background: "#1A1510", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", right: -80, top: -80, width: 360, height: 360, borderRadius: "50%", background: `radial-gradient(circle,${C.amber}0C 0%,transparent 65%)` }} />
      <div style={{ position: "absolute", left: -40, bottom: -40, width: 260, height: 260, borderRadius: "50%", background: `radial-gradient(circle,${C.red}0A 0%,transparent 65%)` }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 100px", zIndex: 2 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 36 }}>
          <Pill bg={C.red}>PART 3</Pill>
          <Tag color={C.amber}>신입 인터뷰</Tag>
        </div>
        <div style={{ fontSize: 26, fontWeight: 400, color: "#E8DDD0", lineHeight: 1.9, marginBottom: 32, whiteSpace: "pre-line" }}>
          {"\"교관님이 규정은 다 가르쳐 주셨어요.\n근데 실제 비행은... 달랐어요.\n\n선배님이 이렇게 하라고 하면,\n그게 맞는 건지 물어볼 수가 없어요.\n비행 중이잖아요.\""}
        </div>
        <Accent color={C.amber} style={{ marginBottom: 18 }} />
        <div style={{ fontSize: 12, color: "#6A5A48" }}>신입 CA · 입사 8개월 차 · ICN → NRT · 새벽 비행</div>
      </div>
      <Bar color={C.red} />
    </div>
  );
}

function P3TimelineSlide() {
  return (
    <div style={{ width: "100%", height: "100%", background: C.dark, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "28px 64px 0" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <Pill bg={C.red}>PART 3</Pill>
          <Tag color={C.red}>ICN → NRT 비행 타임라인</Tag>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.white, marginBottom: 4 }}>이 비행에서 무슨 일이 있었나</div>
        <Accent color={C.red} />
      </div>
      <div style={{ padding: "18px 64px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: C.white }}>ICN</div>
            <div style={{ fontSize: 10, color: "#555" }}>인천</div>
          </div>
          <div style={{ flex: 1, position: "relative", height: 2 }}>
            <div style={{ position: "absolute", inset: 0, background: "#2A2A2A" }} />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg,${C.red},${C.red}33)` }} />
            {[14, 38, 62, 86].map((pct, i) => (
              <div key={i} style={{ position: "absolute", top: "50%", left: `${pct}%`, transform: "translate(-50%,-50%)", width: 10, height: 10, borderRadius: "50%", background: C.red, border: "2px solid #1A1A1A" }} />
            ))}
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: C.white }}>NRT</div>
            <div style={{ fontSize: 10, color: "#555" }}>나리타</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          {SCENES.map(s => (
            <div key={s.n} style={{ background: "#222", borderRadius: 12, padding: "16px 18px", borderTop: `3px solid ${C.red}` }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.red, letterSpacing: "0.1em", marginBottom: 5 }}>장면 {s.n}</div>
              <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>{s.time}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.white, lineHeight: 1.4, marginBottom: 10, fontStyle: "italic" }}>{s.title}</div>
              <div style={{ fontSize: 10, color: "#555" }}>위반 {s.violations.length}건</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <Bar color={C.red} />
    </div>
  );
}

function P3SceneSlide({ scene }) {
  const [revealed, setRevealed] = useState(new Set());
  const toggle = (i) => setRevealed(prev => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });
  const revealAll = () => setRevealed(new Set(scene.violations.map((_, i) => i)));
  const found = revealed.size;
  const total = scene.violations.length;

  return (
    <div style={{ width: "100%", height: "100%", background: C.dark, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "24px 64px 0" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
          <Pill bg={C.red}>PART 3</Pill>
          <Tag color={C.red}>장면 {scene.n}</Tag>
          <span style={{ fontSize: 11, color: "#777" }}>{scene.time}</span>
          <span style={{ fontSize: 10, color: "#3A3A3A", margin: "0 2px" }}>·</span>
          <span style={{ fontSize: 11, color: "#555" }}>{scene.phase}</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.white, marginBottom: 8, fontStyle: "italic" }}>{scene.title}</div>
        <Accent color={C.red} />
      </div>
      <div style={{ flex: 1, padding: "14px 64px 18px", display: "grid", gridTemplateColumns: "2fr 3fr", gap: 20 }}>
        {/* Left: Narrative */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#555", letterSpacing: "0.1em", marginBottom: 8 }}>상황 전개</div>
          <div style={{ background: "#1C1C1C", borderRadius: 12, padding: "18px 20px", flex: 1 }}>
            <div style={{ fontSize: 13, color: "#C4B5A8", lineHeight: 2.1, whiteSpace: "pre-line" }}>{scene.narrative}</div>
          </div>
        </div>
        {/* Right: Violations (reveal on click) */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.red, letterSpacing: "0.1em" }}>
              레드라인 위반{found > 0 ? ` · ${found} / ${total} 확인` : ""}
            </div>
            {found < total && (
              <button onClick={revealAll} style={{ background: "transparent", border: "1px solid #333", borderRadius: 4, padding: "3px 10px", fontSize: 10, color: "#555", cursor: "pointer" }}>
                전체 보기
              </button>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
            {scene.violations.map((v, i) => {
              const on = revealed.has(i);
              return (
                <div
                  key={i}
                  onClick={() => toggle(i)}
                  style={{
                    cursor: "pointer",
                    background: on ? `${C.red}14` : "#1E1E1E",
                    border: `1.5px solid ${on ? C.red + "55" : "#2A2A2A"}`,
                    borderRadius: 8,
                    padding: "10px 14px",
                    transition: "background 0.2s, border-color 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    minHeight: 44,
                    userSelect: "none",
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                    background: on ? C.red : "#2A2A2A",
                    border: `2px solid ${on ? C.red : "#3A3A3A"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 900, color: C.white,
                    transition: "background 0.2s",
                  }}>
                    {on ? "!" : "?"}
                  </div>
                  {on
                    ? <span style={{ fontSize: 12, color: "#EEE", lineHeight: 1.55, flex: 1 }}>{v}</span>
                    : <span style={{ fontSize: 11, color: "#3A3A3A", fontStyle: "italic" }}>클릭해서 확인</span>
                  }
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Bar color={C.red} />
    </div>
  );
}

// ── PART 4 ─────────────────────────────────────────

function CultureSlide() {
  const color = C.green;
  return (
    <div style={{ width: "100%", height: "100%", background: C.white, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "32px 64px 0" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <Pill bg={color}>PART 4</Pill>
          <Tag color={color}>올바른 문화 만들기</Tag>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.dark, marginBottom: 6 }}>[ 문화 만들기 — 주제 ]</div>
        <Accent color={color} style={{ marginBottom: 18 }} />
      </div>
      <div style={{ flex: 1, padding: "0 64px 22px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Ph label="[ 핵심 내용 또는 사례 ]" />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {["[ 실천 포인트 A ]", "[ 실천 포인트 B ]", "[ 실천 포인트 C ]"].map((t, i) => (
            <div key={i} style={{ background: C.grayLight, borderRadius: 10, padding: "14px 18px", borderLeft: `4px solid ${color}` }}>
              <span style={{ fontSize: 11, fontWeight: 800, color, marginRight: 8 }}>›</span>
              <span style={{ fontSize: 12, color: C.gray }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
      <Bar color={color} />
    </div>
  );
}

function ClosingSlide() {
  const color = C.green;
  return (
    <div style={{ width: "100%", height: "100%", background: C.dark, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", right: -80, bottom: -80, width: 440, height: 440, borderRadius: "50%", background: `radial-gradient(circle,${color}18 0%,transparent 65%)` }} />
      <div style={{ position: "absolute", left: -40, top: -40, width: 260, height: 260, borderRadius: "50%", background: `radial-gradient(circle,${C.orange}0C 0%,transparent 65%)` }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 84px", zIndex: 2 }}>
        <Pill bg={color} style={{ marginBottom: 20, alignSelf: "flex-start" }}>PART 4 — CLOSING</Pill>
        <div style={{ fontSize: 40, fontWeight: 900, color: C.white, lineHeight: 1.2, marginBottom: 20 }}>[ 클로징 핵심 메시지 ]</div>
        <Accent color={color} style={{ marginBottom: 28 }} />
        <Ph label="[ 마무리 메시지 — 참석자에게 전하는 말 ]" style={{ maxWidth: 580 }} />
      </div>
      <Bar color={color} />
    </div>
  );
}

// ── Slide Registry ─────────────────────────────────

const SLIDES = [
  { id: "title",        part: 0, label: "타이틀",              Comp: TitleSlide },
  { id: "p1-open",      part: 1, label: "PART 1 오프너",       Comp: () => <SectionOpener part={1} /> },
  { id: "p1-c1",        part: 1, label: "케이스 1",            Comp: () => <CaseSlide n={1} data={CASES[0]} /> },
  { id: "p1-c2",        part: 1, label: "케이스 2",            Comp: () => <CaseSlide n={2} data={CASES[1]} /> },
  { id: "p1-c3",        part: 1, label: "케이스 3",            Comp: () => <CaseSlide n={3} data={CASES[2]} /> },
  { id: "p1-c4",        part: 1, label: "케이스 4",            Comp: () => <CaseSlide n={4} data={CASES[3]} /> },
  { id: "p1-c5",        part: 1, label: "케이스 5",            Comp: () => <CaseSlide n={5} data={CASES[4]} /> },
  { id: "p1-c6",        part: 1, label: "케이스 6",            Comp: () => <CaseSlide n={6} data={CASES[5]} /> },
  { id: "p1-discuss",   part: 1, label: "소그룹 토의 (15분)",  Comp: DiscussTimerSlide },
  { id: "p2-open",      part: 2, label: "PART 2 오프너",       Comp: () => <SectionOpener part={2} /> },
  { id: "p2-csm1",      part: 2, label: "CSM 조문 A",          Comp: () => <CSMSlide n={1} /> },
  { id: "p2-csm2",      part: 2, label: "CSM 조문 B",          Comp: () => <CSMSlide n={2} /> },
  { id: "p2-discuss",   part: 2, label: "사무장 판단 토론",     Comp: Part2DiscussSlide },
  { id: "p3-open",      part: 3, label: "PART 3 오프너",       Comp: () => <SectionOpener part={3} /> },
  { id: "p3-interview", part: 3, label: "신입 인터뷰",         Comp: P3InterviewSlide },
  { id: "p3-timeline",  part: 3, label: "비행 타임라인",       Comp: P3TimelineSlide },
  { id: "p3-scene1",    part: 3, label: "장면 1 — 좌석 변경",  Comp: () => <P3SceneSlide scene={SCENES[0]} /> },
  { id: "p3-scene2",    part: 3, label: "장면 2 — 기내식",     Comp: () => <P3SceneSlide scene={SCENES[1]} /> },
  { id: "p3-scene3",    part: 3, label: "장면 3 — 면세",       Comp: () => <P3SceneSlide scene={SCENES[2]} /> },
  { id: "p3-scene4",    part: 3, label: "장면 4 — IRRE",       Comp: () => <P3SceneSlide scene={SCENES[3]} /> },
  { id: "p4-open",      part: 4, label: "PART 4 오프너",       Comp: () => <SectionOpener part={4} /> },
  { id: "p4-culture",   part: 4, label: "문화 만들기",          Comp: CultureSlide },
  { id: "p4-closing",   part: 4, label: "클로징",              Comp: ClosingSlide },
];

// ── App ────────────────────────────────────────────

export default function App() {
  const [cur, setCur] = useState(0);
  const total = SLIDES.length;
  const slide = SLIDES[cur];
  const go = d => setCur(p => Math.max(0, Math.min(total - 1, p + d)));

  useEffect(() => {
    const onKey = e => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") go(1);
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cur]);

  const { Comp } = slide;

  return (
    <div style={{ minHeight: "100vh", background: "#0D0D0D", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 16px", fontFamily: "'Noto Sans KR','Apple SD Gothic Neo',sans-serif" }}>

      <div style={{ width: "100%", maxWidth: 960, aspectRatio: "16/9", borderRadius: 16, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.85)" }}>
        <Comp />
      </div>

      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => go(-1)} disabled={cur === 0} style={{ background: cur === 0 ? "#222" : C.orange, color: C.white, border: "none", borderRadius: 8, padding: "9px 22px", fontSize: 13, fontWeight: 700, cursor: cur === 0 ? "default" : "pointer", opacity: cur === 0 ? 0.3 : 1 }}>
          ← 이전
        </button>
        <div style={{ textAlign: "center", minWidth: 200 }}>
          <div style={{ fontSize: 13, color: "#AAA", fontWeight: 600 }}>{slide.label}</div>
          <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>{cur + 1} / {total}</div>
        </div>
        <button onClick={() => go(1)} disabled={cur === total - 1} style={{ background: cur === total - 1 ? "#222" : C.orange, color: C.white, border: "none", borderRadius: 8, padding: "9px 22px", fontSize: 13, fontWeight: 700, cursor: cur === total - 1 ? "default" : "pointer", opacity: cur === total - 1 ? 0.3 : 1 }}>
          다음 →
        </button>
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap", justifyContent: "center", maxWidth: 800 }}>
        {SLIDES.map((s, i) => {
          const isActive = i === cur;
          const dotColor = PART_C[s.part];
          const prevPart = i > 0 ? SLIDES[i - 1].part : s.part;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {s.part !== prevPart && i > 0 && <div style={{ width: 1, height: 14, background: "#333", marginRight: 2 }} />}
              <button onClick={() => setCur(i)} title={s.label} style={{ width: isActive ? 28 : 8, height: 8, borderRadius: 4, background: isActive ? dotColor : "#2A2A2A", border: `1px solid ${isActive ? dotColor : "#3A3A3A"}`, cursor: "pointer", transition: "all 0.25s", padding: 0 }} />
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 16, alignItems: "center" }}>
        {[1, 2, 3, 4].map(p => (
          <div key={p} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: PART_C[p] }} />
            <span style={{ fontSize: 10, color: "#444" }}>PART {p}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
