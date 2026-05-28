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
    badge: "CASE 1 · 안전 직결 🔴",
    badgeColor: C.red,
    title: "벨트사인이 켜져 있는데, 라면은 빨리 달라고 해요",
    context: ["✈️ 중거리 국제선", "⚡ 라이트 터뷸런스 직후", "🔔 벨트사인 ON"],
    scenario:
`인천→방콕 편. 순항 중 라이트 터뷸런스가 있었고 지금은 잠잠해진 상태.
벨트사인은 아직 켜져 있음.

AR이 갤리에서 에어카페 라면 준비 중,
32열 승객이 콜버튼을 눌렀다.

승객  "아까 라면 주문했는데요, 물 넣어서 빨리 갖다주실 수 있어요?
배가 너무 고파서요."

AR이 뜨거운 물을 붓는 순간,
기체가 다시 한 번 가볍게 흔들렸다.`,
    questions: [
      "🤔 벨트사인이 켜진 상태에서 뜨거운 물을 붓는 행위 — 가능한가?",
      "💬 승객에게 어떻게 안내할 것인가? 구체적인 한 마디는?",
      "📢 사무장에게 보고해야 하는 상황인가? 타이밍은?",
    ],
  },
  {
    badge: "CASE 2 · 서비스 절차 🟠",
    badgeColor: C.amber,
    title: "저만 먼저 받으면 안 되나요?",
    context: ["🌙 야간 중거리 I/B", "🍱 일괄제공 준비 중", "👤 개별 먼저 요청"],
    scenario:
`인천 귀국편 야간 중거리. 현지 시각 새벽 1시 출발.
순항 고도 도달 후, AR이 사전기내식 일괄 제공을 준비 중.
아직 배포 시작 전이다.

7C 승객(한국인 남성, 50대)이 AR을 불렀다.

승객  "저 기내식 사전 주문했는데, 저만 먼저 받으면 안 돼요?
현지에서 못 먹고 온 터라 너무 배가 고파서요.
옆에 분들이랑 같이 드시면 될 것 같은데..."

갤리에 해당 승객 기내식이 탑재되어 있고,
사전기내식 제공은 일괄 제공이 원칙.
주변 5~6명의 사전기내식 승객도 아직 제공 전이다.`,
    questions: [
      "⚖️ 일괄 제공 원칙이 있는 상황에서 개별 먼저 제공 — 가능한가? 근거는?",
      "🎫 \"사전 주문했다\"는 말이 판단을 바꾸는 근거가 되는가?",
      "👥 주변 승객들도 아직 못 받은 상황 — 형평성 문제가 생길 수 있는가?",
    ],
  },
  {
    badge: "CASE 3 · 서비스 판단 🟠",
    badgeColor: C.amber,
    title: "맥주 세 번째 요청, 근데 이미 취기가 있어요",
    context: ["🍺 맥주 2캔 기구매", "😶 이미 취기 있음", "📋 최대 3캔 규정"],
    scenario:
`인천→오사카 편. 에어카페 서비스 진행 중.

22B 승객(남성, 30대)이 맥주를 이미 2캔 구매한 상태.
서비스가 어느 정도 마무리될 즈음, 승객이 AR을 다시 불렀다.

승객  "맥주 하나만 더요~ 마지막이에요!"

AR이 보니 얼굴이 이미 붉고, 눈이 약간 충혈되어 있다.
말투는 명랑하지만 발음이 조금 어눌하다.

제주항공 기내 주류 제공 기준은 최대 3캔.
승객이 요청하는 건 규정상 마지막 1캔이다.`,
    questions: [
      "📋 규정상 3캔 한도 — 3번째 요청이라고 제공해야 하는가?",
      "🤔 \"규정상 마지막 1캔\"이라는 사실이 판단을 쉽게 만드는가, 더 어렵게 만드는가?",
      "📢 거절 시 승객 반응이 거세질 경우 대응 방식은? 사무장 보고는 언제 하는가?",
    ],
  },
  {
    badge: "CASE 4 · 절차 판단 🟠",
    badgeColor: C.amber,
    title: "탑승권을 못 찾겠대요, 사무장님은 응대 중이고",
    context: ["🚪 보딩 진행 중", "🧳 사무장 응대 중", "❓ FR 단독 판단 상황"],
    scenario:
`탑승 시작 15분째. 비즈니스라이트 구역 승객 6명이
짐 정리와 웰컴그리팅을 받고 있는 상황.
사무장은 Aisle 앞쪽에서 응대 중이다.

FR이 탑승구 쪽에 있는데, 운송직원이 다가왔다.

운송직원  "이 손님이 탑승권을 못 찾겠다고 하시는데,
일단 안으로 들어오셨어요."

승객은 핸드폰과 가방을 계속 뒤지고 있고,
탑승구 밖에는 아직 줄이 길다.

사무장에게 직접 다가가야 하나, 콜버튼을 눌러야 하나.`,
    questions: [
      "🔄 FR이 선택할 수 있는 행동 옵션은? 각각의 장단점은?",
      "📣 사무장이 다른 승객 응대 중일 때 — 어떤 방식으로 보고하는 것이 맞는가?",
      "🚫 탑승권 없는 승객 처리 — FR이 단독으로 결정할 수 있는가?",
    ],
  },
  {
    badge: "CASE 5 · 서비스 절차 🟡",
    badgeColor: "#C8A800",
    title: "배가 고프다며 보딩 중에 몇 번이나 요청해요",
    context: ["🚶 보딩 진행 중", "🛒 에어카페 미개시", "🔁 반복 요청"],
    scenario:
`탑승이 한창 진행 중인 상황.
13열에 짐을 넣던 승객이 지나가는 AR을 불러 세웠다.

승객  "저 에어카페에서 신라면이랑 음료 미리 살 수 있어요?
배가 너무 고파서요, 이륙하고 나서 기다리기가 힘들 것 같아요."

AR이 정중히 "이륙 후에 안내드리겠다"고 했지만,
승객은 잠시 후 다시 말했다.

승객  "그냥 지금 결제만 해주시면 되는 거 아닌가요?
카드 여기 있는데, 금방이잖아요."

탑승이 계속 진행되는 중에 두 번, 세 번째로 요청이 이어진다.`,
    questions: [
      "🚫 보딩 중 에어카페 개별 판매 — 가능한가? 왜 안 되는가?",
      "🔁 같은 요청이 반복될 때 — AR의 응대 방식은 어떻게 달라져야 하는가?",
      "📢 사무장에게 보고해야 하는 시점은 언제인가? AR 선에서 해결 가능한가?",
    ],
  },
  {
    badge: "CASE 6 · 재량 영역 🟡",
    badgeColor: "#C8A800",
    title: "지난번에도 줬는데, 담요 하나만 주시면 안 돼요?",
    context: ["🌡️ 단거리 국내선 겨울편", "🛑 담요 서비스 규정 없음", "👶 유아 동반 승객 있음"],
    scenario:
`김포→제주 편. 순항 중.

3B 승객(여성, 40대)이 AR을 불렀다.

승객  "저 좀 추운데요, 담요 하나 주실 수 있어요?
지난번에 이 비행기 탔을 때 받았거든요."

국내선에는 담요 서비스 규정이 없다.
응급 담요(Emergency Blanket)는 갤리에 있지만
이건 응급 상황 전용이다.
옆자리에 유아를 안고 있는 승객도 추워 보인다.`,
    questions: [
      "❓ \"지난번에 줬다\"는 말 — 판단 근거가 될 수 있는가?",
      "🚨 응급 담요 사용 — 비응급 상황에서 가능한가?",
      "👨‍✈️ 유아 동반 승객까지 있는 이 상황 — 사무장 판단이 필요한가?",
    ],
  },
];

// ── SLIDE 01: Title ─────────────────────────────────

function TitleSlide() {
  return (
    <div style={{ width: "100%", height: "100%", background: C.dark, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", right: -100, top: -100, width: 520, height: 520, borderRadius: "50%", background: `radial-gradient(circle,${C.orange}1A 0%,transparent 65%)` }} />
      <div style={{ position: "absolute", left: -60, bottom: -60, width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle,${C.orange}0C 0%,transparent 65%)` }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 84px", zIndex: 2 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.orange, letterSpacing: "0.22em", marginBottom: 22 }}>JEJU AIR · 객실서비스 교육 · 오전 1교시 · 50분</div>
        <div style={{ fontSize: 64, fontWeight: 900, color: C.white, lineHeight: 1.0, letterSpacing: "-0.03em", marginBottom: 12 }}>규정과 판단 사이</div>
        <div style={{ fontSize: 18, color: "#4A4A4A", marginBottom: 36, letterSpacing: "0.04em" }}>우리는 현장에서 어떻게 결정하는가</div>
        <Accent />
        <div style={{ marginTop: 26, fontSize: 12, color: "#444" }}>전 경력 객실승무원 대상 · 50분 세션</div>
      </div>
      <Bar />
    </div>
  );
}

// ── SLIDE 02: Table of Contents ─────────────────────

function TableOfContentsSlide() {
  const parts = [
    { n: 1, color: C.orange, emoji: "💬", title: "규정과 실제 근무 사이의 간극", desc: "조별 토론 6케이스", time: "35분" },
    { n: 2, color: C.amber,  emoji: "📋", title: "사무장 판단 하에 제공 가능한 영역", desc: "CSM 조문 기반 토론", time: "준비 중" },
    { n: 3, color: C.red,    emoji: "🔍", title: "지켜야 하는 규정", desc: "사례 중심 분석", time: "준비 중" },
    { n: 4, color: C.green,  emoji: "🌱", title: "올바른 문화 만들기", desc: "클로징", time: "준비 중" },
  ];
  return (
    <div style={{ width: "100%", height: "100%", background: C.dark, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "30px 72px 18px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#555", letterSpacing: "0.22em", marginBottom: 8 }}>SESSION OVERVIEW</div>
        <div style={{ fontSize: 32, fontWeight: 900, color: C.white }}>오늘의 세션 구성</div>
        <Accent style={{ marginTop: 12 }} />
      </div>
      <div style={{ flex: 1, padding: "0 72px 28px", display: "flex", flexDirection: "column", gap: 10 }}>
        {parts.map(p => (
          <div key={p.n} style={{ display: "flex", alignItems: "center", gap: 20, background: "#1E1E1E", borderRadius: 12, padding: "16px 24px", borderLeft: `4px solid ${p.color}` }}>
            <div style={{ minWidth: 64 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: p.color, letterSpacing: "0.1em" }}>PART {p.n}</div>
              <div style={{ fontSize: 10, color: p.n === 1 ? p.color + "99" : "#3A3A3A", marginTop: 3, fontWeight: p.n === 1 ? 700 : 400 }}>{p.time}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: p.n === 1 ? C.white : "#444", marginBottom: 3 }}>{p.title}</div>
              <div style={{ fontSize: 11, color: p.n === 1 ? "#666" : "#333" }}>{p.desc}</div>
            </div>
            <div style={{ fontSize: 22, opacity: p.n === 1 ? 1 : 0.3 }}>{p.emoji}</div>
          </div>
        ))}
      </div>
      <Bar />
    </div>
  );
}

// ── Section Opener ─────────────────────────────────

const PART_META = {
  1: { title: "규정과 실제 근무 사이의 간극", sub: "아래 6가지 상황, 우리 편조라면 어떻게 했을까요?", tag: "케이스 6개 · 소그룹 토의 후 전체 공유" },
  2: { title: "사무장 판단 하에\n제공 가능한 영역", sub: "규정이 허용한 재량 — 그 기준은 무엇인가?", tag: "CSM 조문 기반 토론" },
  3: { title: "지켜야 하는 규정", sub: "신입승무원의 눈으로 본 ICN-NRT 비행", tag: "사례 중심 분석" },
  4: { title: "올바른 문화\n만들기", sub: "누가 해도 동일한 비행", tag: "클로징" },
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
        <div style={{ fontSize: 44, fontWeight: 900, color: C.white, lineHeight: 1.1, marginBottom: 14, whiteSpace: "pre-line" }}>{m.title}</div>
        <div style={{ fontSize: 17, color: "#4A4A4A", marginBottom: 28 }}>{m.sub}</div>
        <Accent color={color} style={{ marginBottom: 28 }} />
        {part === 1 && (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 18 }}>💬</span>
            <span style={{ fontSize: 13, color: "#555" }}>케이스별 소그룹 토의 → 전체 공유 순으로 진행됩니다</span>
          </div>
        )}
      </div>
      <Bar color={color} />
    </div>
  );
}

// ── PART 1: Case Scenario Slide (dark) ─────────────

function CaseScenarioSlide({ data }) {
  const bc = data.badgeColor;
  return (
    <div style={{ width: "100%", height: "100%", background: C.dark, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "22px 60px 0" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <Pill bg={C.orange}>PART 1</Pill>
          <span style={{ background: bc + "22", color: bc, border: `1px solid ${bc}55`, borderRadius: 4, padding: "2px 12px", fontSize: 11, fontWeight: 800 }}>{data.badge}</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.white, lineHeight: 1.3, marginBottom: 10 }}>{data.title}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {data.context.map((t, i) => (
            <span key={i} style={{ background: "#222", borderRadius: 20, padding: "4px 14px", fontSize: 11, color: "#666", border: "1px solid #2A2A2A" }}>{t}</span>
          ))}
        </div>
        <Accent />
      </div>
      <div style={{ flex: 1, padding: "12px 60px 22px" }}>
        <div style={{ background: "#111", borderRadius: 14, padding: "22px 28px", height: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: C.orange, letterSpacing: "0.18em", marginBottom: 14 }}>SCENARIO</div>
          <div style={{ fontSize: 13.5, color: "#B8B8B8", lineHeight: 2.0, whiteSpace: "pre-line", flex: 1 }}>{data.scenario}</div>
        </div>
      </div>
      <Bar />
    </div>
  );
}

// ── PART 1: Case Discussion Slide (light + timer) ──

function CaseDiscussSlide({ data }) {
  const totalSec = 15 * 60;
  const { elapsed, running, setRunning, fmt, reset, pct } = useTimer(totalSec);
  const remaining = totalSec - elapsed;
  const tc = remaining < 120 ? "#FF4444" : remaining < 300 ? "#FFA500" : C.orange;
  const bc = data.badgeColor;
  return (
    <div style={{ width: "100%", height: "100%", background: C.grayLight, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 60px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
              <Pill>PART 1</Pill>
              <span style={{ background: bc + "22", color: bc, border: `1px solid ${bc}55`, borderRadius: 4, padding: "2px 12px", fontSize: 11, fontWeight: 800 }}>{data.badge}</span>
              <Tag color={C.green}>소그룹 토의 · 15분</Tag>
            </div>
            <div style={{ fontSize: 19, fontWeight: 800, color: C.dark, lineHeight: 1.35 }}>{data.title}</div>
          </div>
          <div style={{ textAlign: "center", background: C.dark, borderRadius: 14, padding: "14px 20px", flexShrink: 0 }}>
            <div style={{ fontSize: 44, fontWeight: 900, color: tc, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em", lineHeight: 1 }}>{fmt(remaining)}</div>
            <div style={{ position: "relative", height: 5, width: 130, background: "#2A2A2A", borderRadius: 4, margin: "8px auto" }}>
              <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${(1 - pct) * 100}%`, background: tc, borderRadius: 4, transition: "width 1s linear" }} />
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 8 }}>
              <button onClick={() => setRunning(r => !r)} style={{ background: running ? "#444" : C.orange, color: C.white, border: "none", borderRadius: 6, padding: "5px 13px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                {running ? "⏸ 일시정지" : elapsed === 0 ? "▶ 시작" : "▶ 재개"}
              </button>
              <button onClick={reset} style={{ background: "#333", color: "#888", border: "none", borderRadius: 6, padding: "5px 9px", fontSize: 11, cursor: "pointer" }}>↺</button>
            </div>
          </div>
        </div>
        <Accent style={{ marginTop: 12 }} />
      </div>
      <div style={{ flex: 1, padding: "12px 60px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: C.orange, letterSpacing: "0.18em" }}>소그룹 토의 질문</div>
        {data.questions.map((q, i) => (
          <div key={i} style={{ background: C.white, borderRadius: 12, padding: "15px 20px", borderLeft: `5px solid ${C.orange}`, boxShadow: "0 2px 6px rgba(0,0,0,0.06)", display: "flex", alignItems: "flex-start", gap: 12, flex: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: C.orange, minWidth: 22, marginTop: 2, background: C.orange + "18", borderRadius: 4, padding: "2px 6px", textAlign: "center" }}>Q{i + 1}</span>
            <span style={{ fontSize: 13.5, color: C.dark, lineHeight: 1.65 }}>{q}</span>
          </div>
        ))}
      </div>
      <Bar />
    </div>
  );
}

// ── PART 1: Share Slide (전체 공유) ─────────────────

function ShareSlide() {
  const [checked, setChecked] = useState(new Set());
  const toggle = (i) => setChecked(prev => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });
  const items = [
    { emoji: "🔴", text: "케이스 1 — 벨트사인 상황: 우리 편조의 판단 기준은 무엇이었나요?" },
    { emoji: "🟠", text: "케이스 2 — 개별 먼저 제공: 허용한 경우와 거절한 경우, 그 이유는?" },
    { emoji: "🟠", text: "케이스 3 — 주류 거절: 실제로 어떻게 말했나요?" },
    { emoji: "🟠", text: "케이스 4 — 보딩 중 단독 판단: 어느 시점에 사무장에게 보고했나요?" },
    { emoji: "🟡", text: "케이스 5 — 보딩 중 반복 요청: 몇 번째에서 대응 방식을 바꿨나요?" },
    { emoji: "🟡", text: "케이스 6 — 담요 요청: 사무장 판단을 구했나요, 직접 결정했나요?" },
  ];
  return (
    <div style={{ width: "100%", height: "100%", background: C.white, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "24px 60px 0" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <Pill>PART 1</Pill>
          <Tag color={C.green}>전체 공유</Tag>
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.dark, marginBottom: 4 }}>그룹별 공유 포인트</div>
        <div style={{ fontSize: 12, color: C.gray, marginBottom: 12 }}>각 케이스에서 편조가 나눈 판단을 전체와 함께 공유합니다</div>
        <Accent />
      </div>
      <div style={{ flex: 1, padding: "12px 60px 22px", display: "flex", flexDirection: "column", gap: 7 }}>
        {items.map((item, i) => {
          const on = checked.has(i);
          return (
            <div
              key={i}
              onClick={() => toggle(i)}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                background: on ? C.orange + "0C" : C.grayLight,
                border: `1.5px solid ${on ? C.orange + "44" : "transparent"}`,
                borderRadius: 10, padding: "11px 18px", cursor: "pointer",
                transition: "all 0.2s", userSelect: "none", flex: 1,
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                background: on ? C.orange : C.white,
                border: `2px solid ${on ? C.orange : "#CCC"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: C.white, fontWeight: 900,
                transition: "all 0.2s",
              }}>
                {on ? "✓" : ""}
              </div>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{item.emoji}</span>
              <span style={{ fontSize: 13, color: on ? C.dark : "#888", fontWeight: on ? 700 : 400, lineHeight: 1.5 }}>{item.text}</span>
            </div>
          );
        })}
      </div>
      <Bar />
    </div>
  );
}

// ── Session Timeline ────────────────────────────────

const TIMELINE = [
  { label: "도입", color: "#555",    from: 0,  to: 1  },
  { label: "PART 1 · 케이스 토의",  color: C.orange, from: 2,  to: 14 },
  { label: "전체 공유", color: C.green,  from: 15, to: 15 },
  { label: "PART 2–4", color: "#333",    from: 16, to: 18 },
];

const TIMELINE_FLEX = [5, 35, 10, 2];

function SessionTimeline({ cur }) {
  const seg = TIMELINE.findIndex(s => cur >= s.from && cur <= s.to);
  return (
    <div style={{ marginTop: 12, width: "100%", maxWidth: 960 }}>
      <div style={{ display: "flex", gap: 3, height: 24 }}>
        {TIMELINE.map((s, i) => {
          const active = i === seg;
          return (
            <div
              key={i}
              style={{
                flex: TIMELINE_FLEX[i],
                borderRadius: 6,
                background: active ? s.color : s.color + "33",
                border: `1.5px solid ${active ? s.color : s.color + "22"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.3s",
              }}
            >
              <span style={{ fontSize: 9, fontWeight: active ? 800 : 500, color: active ? C.white : s.color + "66", letterSpacing: "0.04em" }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PART 2: CSM Card Slide A ───────────────────────

function P2CSMCardSlide() {
  return (
    <div style={{ width: "100%", height: "100%", background: C.white, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "24px 60px 0" }}>
        <Pill bg={C.amber}>PART 2</Pill>
        <div style={{ marginTop: 12, fontSize: 13, fontWeight: 800, color: C.amber, letterSpacing: "0.1em" }}>📋 CSM 3.4.2.4  사무장의 권한</div>
        <Accent color={C.amber} style={{ marginTop: 10 }} />
      </div>
      <div style={{ flex: 1, padding: "16px 60px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ flex: 1, display: "flex", gap: 20 }}>
          <div style={{ flex: 1, background: C.grayLight, borderRadius: 14, padding: "24px 28px", borderTop: `4px solid ${C.amber}` }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.dark, marginBottom: 14 }}>라. 에어카페 상품 제공</div>
            <div style={{ background: C.white, borderRadius: 10, padding: "16px 20px", borderLeft: `4px solid ${C.amber}` }}>
              <div style={{ fontSize: 13, color: C.dark, lineHeight: 1.9 }}>4. 기타 사무장의 판단 하에<br />제공이 필요한 상황 발생 시</div>
            </div>
          </div>
          <div style={{ flex: 1, background: C.grayLight, borderRadius: 14, padding: "24px 28px", borderTop: `4px solid ${C.amber}` }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.dark, marginBottom: 14 }}>마. 클리닝 쿠폰</div>
            <div style={{ background: C.white, borderRadius: 10, padding: "16px 20px", borderLeft: `4px solid ${C.amber}` }}>
              <div style={{ fontSize: 13, color: C.dark, lineHeight: 1.9 }}>3. 기타 사무장의 판단 하에<br />제공이 필요한 상황 발생 시</div>
            </div>
          </div>
        </div>
        <div style={{ background: "#FFF8F0", border: `1px solid ${C.amber}33`, borderRadius: 10, padding: "14px 24px" }}>
          <div style={{ fontSize: 13, color: "#7A4A00", lineHeight: 1.85 }}>
            📌 '판단 하에'라는 표현 — 이것이 어떤 의미인지,<br />어떤 상황에 적용할 수 있는지를 함께 생각해봅시다.
          </div>
        </div>
      </div>
      <Bar color={C.amber} />
    </div>
  );
}

// ── PART 2: Water Slide B ──────────────────────────

function P2WaterSlide() {
  return (
    <div style={{ width: "100%", height: "100%", background: C.dark, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "24px 60px 0" }}>
        <Pill bg={C.amber}>PART 2</Pill>
        <div style={{ marginTop: 12, fontSize: 13, fontWeight: 800, color: "#7EB8E0", letterSpacing: "0.1em" }}>💧 CSM 4.6.1  무상 생수 서비스 기준</div>
        <Accent color={C.amber} style={{ marginTop: 10 }} />
      </div>
      <div style={{ flex: 1, padding: "16px 60px 22px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 24 }}>
        <div style={{ background: "#1E1E1E", borderRadius: 14, padding: "32px 40px", borderTop: `4px solid ${C.amber}`, alignSelf: "center", width: "100%", maxWidth: 520, boxSizing: "border-box" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.white, marginBottom: 16 }}>다. 기타 비정상 상황</div>
          <div style={{ background: "#111", borderRadius: 10, padding: "20px 24px", borderLeft: `4px solid ${C.amber}` }}>
            <div style={{ fontSize: 14, color: "#C8C8C8", lineHeight: 2.0 }}>비정상 상황 발생으로<br />무상 생수 제공이 필요하다고<br />판단되는 경우</div>
          </div>
        </div>
        <div style={{ background: "#1A2A1A", border: "1px solid #2A4A2A", borderRadius: 10, padding: "14px 24px", alignSelf: "center", width: "100%", maxWidth: 520, boxSizing: "border-box" }}>
          <div style={{ fontSize: 13, color: "#7ABF7A", lineHeight: 1.85 }}>🔗 PART 1의 케이스들 중<br />이 조문이 적용될 수 있는 상황이 있었나요?</div>
        </div>
      </div>
      <Bar color={C.amber} />
    </div>
  );
}

// ── PART 2: Discussion Slide C ─────────────────────

function P2DiscussSlide() {
  const totalSec = 15 * 60;
  const { elapsed, running, setRunning, fmt, reset, pct } = useTimer(totalSec);
  const remaining = totalSec - elapsed;
  const tc = remaining < 120 ? "#FF4444" : remaining < 300 ? "#FFA500" : C.amber;
  const qs = [
    { emoji: "👨‍✈️", text: "PART 1의 케이스 중 사무장 권한으로 해결 가능한 상황은 어떤 것인가?" },
    { emoji: "⚖️",   text: '"판단 하에 제공"과 "무조건 제공"의 차이는 무엇인가?' },
    { emoji: "🔄",   text: "사무장마다 판단이 다르다면 승객 입장에서는 어떻게 느껴지는가?" },
  ];
  return (
    <div style={{ width: "100%", height: "100%", background: C.white, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 60px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
              <Pill bg={C.amber}>PART 2 · 조별 토의 🗣️</Pill>
              <Tag color={C.green}>15분</Tag>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.dark, lineHeight: 1.3 }}>우리 조가 생각하는 판단의 기준은?</div>
          </div>
          <div style={{ textAlign: "center", background: C.dark, borderRadius: 14, padding: "14px 20px", flexShrink: 0 }}>
            <div style={{ fontSize: 44, fontWeight: 900, color: tc, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em", lineHeight: 1 }}>{fmt(remaining)}</div>
            <div style={{ position: "relative", height: 5, width: 130, background: "#2A2A2A", borderRadius: 4, margin: "8px auto" }}>
              <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${(1 - pct) * 100}%`, background: tc, borderRadius: 4, transition: "width 1s linear" }} />
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 8 }}>
              <button onClick={() => setRunning(r => !r)} style={{ background: running ? "#444" : C.amber, color: C.white, border: "none", borderRadius: 6, padding: "5px 13px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                {running ? "⏸ 일시정지" : elapsed === 0 ? "▶ 시작" : "▶ 재개"}
              </button>
              <button onClick={reset} style={{ background: "#333", color: "#888", border: "none", borderRadius: 6, padding: "5px 9px", fontSize: 11, cursor: "pointer" }}>↺</button>
            </div>
          </div>
        </div>
        <Accent color={C.amber} style={{ marginTop: 12 }} />
      </div>
      <div style={{ flex: 1, padding: "12px 60px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: C.amber, letterSpacing: "0.18em" }}>조별 토의 질문</div>
        {qs.map((q, i) => (
          <div key={i} style={{ background: C.grayLight, borderRadius: 12, padding: "16px 20px", borderLeft: `5px solid ${C.amber}`, display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: C.amber, minWidth: 22, background: C.amber + "18", borderRadius: 4, padding: "2px 6px", textAlign: "center" }}>Q{i + 1}</span>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{q.emoji}</span>
            <span style={{ fontSize: 13.5, color: C.dark, lineHeight: 1.65 }}>{q.text}</span>
          </div>
        ))}
      </div>
      <Bar color={C.amber} />
    </div>
  );
}

// ── PART 3: Interview Slide ────────────────────────

function P3InterviewSlide() {
  return (
    <div style={{ width: "100%", height: "100%", background: C.dark, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "24px 60px 0" }}>
        <Pill bg={C.red}>PART 3</Pill>
        <div style={{ marginTop: 12, fontSize: 12, fontWeight: 800, color: "#CC8888", letterSpacing: "0.12em" }}>🎙️ 신입승무원 인터뷰</div>
        <Accent color={C.red} style={{ marginTop: 10 }} />
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 60px 28px" }}>
        <div style={{ background: "#111", borderRadius: 16, padding: "36px 44px", borderLeft: `5px solid ${C.red}`, maxWidth: 680, width: "100%" }}>
          <div style={{ fontSize: 32, color: C.red, lineHeight: 1, marginBottom: 16, opacity: 0.5 }}>"</div>
          <div style={{ fontSize: 14.5, color: "#C8C8C8", lineHeight: 2.1, whiteSpace: "pre-line" }}>{"첫 비행, 솔직히 말하면 많이 긴장됐어요.\n\n교육에서 배운 것들이 있는데\n현장에서는 다르게 적용되는 경우가 많았고,\n\n선배마다 하는 방식이 달라서\n어떤 게 맞는 건지 잘 모르겠더라고요."}</div>
          <div style={{ marginTop: 20, fontSize: 11, color: "#555", fontStyle: "italic" }}>— 입사 6개월 차 신입승무원</div>
        </div>
      </div>
      <Bar color={C.red} />
    </div>
  );
}

// ── PART 3: Flight Timeline Slide ─────────────────

function P3FlightTimelineSlide() {
  const steps = [
    { icon: "🚪", label: "보딩" },
    { icon: "🛫", label: "이륙" },
    { icon: "🍱", label: "기내식" },
    { icon: "🛍️", label: "면세" },
    { icon: "🚨", label: "비정상" },
  ];
  return (
    <div style={{ width: "100%", height: "100%", background: C.dark, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "24px 60px 0" }}>
        <Pill bg={C.red}>PART 3</Pill>
        <div style={{ marginTop: 12, fontSize: 22, fontWeight: 900, color: C.white }}>✈️  ICN → NRT  오늘의 비행</div>
        <Accent color={C.red} style={{ marginTop: 10 }} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 60px 28px", gap: 28 }}>
        <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{ width: 68, height: 68, borderRadius: "50%", background: "#1E1E1E", border: `2px solid ${C.red}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
                  {s.icon}
                </div>
                <div style={{ fontSize: 11, color: "#888", fontWeight: 600, textAlign: "center" }}>{s.label}</div>
              </div>
              {i < steps.length - 1 && (
                <div style={{ width: 36, height: 2, background: `linear-gradient(90deg,${C.red}66,${C.red}11)`, flexShrink: 0, marginBottom: 20 }} />
              )}
            </div>
          ))}
        </div>
        <div style={{ background: "#1A1A2A", border: `1px solid ${C.red}22`, borderRadius: 10, padding: "14px 28px" }}>
          <div style={{ fontSize: 12.5, color: "#8888CC", lineHeight: 1.7 }}>이 비행에서 신입의 눈에 포착된 장면들이 있습니다.</div>
        </div>
      </div>
      <Bar color={C.red} />
    </div>
  );
}

// ── PART 3: Scene Slide (reusable) ────────────────

function P3SceneSlide({ sceneNum, sceneIcon, sceneTitle, dark, situation, thought, violations }) {
  const [open, setOpen] = useState(false);
  const bg = dark ? C.dark : C.white;
  const textMain = dark ? C.white : C.dark;
  const textSub = dark ? "#B8B8B8" : "#555";
  const sceneBg = dark ? "#111" : C.grayLight;
  const thoughtBg = dark ? "#1A1A2A" : "#F0F4FF";
  const thoughtColor = dark ? "#8888CC" : "#4455AA";
  return (
    <div style={{ width: "100%", height: "100%", background: bg, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "18px 60px 0" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <Pill bg={C.red}>PART 3</Pill>
          <span style={{ background: C.red + "22", color: C.red, border: `1px solid ${C.red}44`, borderRadius: 4, padding: "2px 12px", fontSize: 11, fontWeight: 800 }}>{sceneNum} {sceneIcon}</span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, color: textMain, marginBottom: 8 }}>{sceneTitle}</div>
        <Accent color={C.red} />
      </div>
      <div style={{ flex: 1, padding: "10px 60px 16px", display: "flex", flexDirection: "column", gap: 10, overflow: "hidden" }}>
        <div style={{ background: sceneBg, borderRadius: 12, padding: "14px 22px", flexShrink: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: C.red, letterSpacing: "0.18em", marginBottom: 8 }}>SCENARIO</div>
          <div style={{ fontSize: 12.5, color: textSub, lineHeight: 1.85, whiteSpace: "pre-line" }}>{situation}</div>
        </div>
        <div style={{ background: thoughtBg, borderRadius: 10, padding: "11px 20px", flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: thoughtColor, lineHeight: 1.7 }}>💭 신입의 생각 — <span style={{ whiteSpace: "pre-line" }}>{thought}</span></span>
        </div>
        {!open ? (
          <button
            onClick={() => setOpen(true)}
            style={{ background: C.red, color: C.white, border: "none", borderRadius: 8, padding: "11px 24px", fontSize: 13, fontWeight: 800, cursor: "pointer", alignSelf: "flex-start", letterSpacing: "0.04em" }}
          >
            🔍 위반 포인트 확인하기
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, overflowY: "auto" }}>
            {violations.map((v, i) => (
              <div key={i} style={{ background: v.color + "14", border: `1px solid ${v.color}44`, borderRadius: 10, padding: "12px 18px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{v.icon}</span>
                <span style={{ fontSize: 12.5, color: v.color, lineHeight: 1.75, fontWeight: 600 }}>{v.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <Bar color={C.red} />
    </div>
  );
}

// ── PART 3: Scene Data ─────────────────────────────

const SCENE1 = {
  sceneNum: "SCENE 1", sceneIcon: "🚪", sceneTitle: "도어 클로즈 1분 전", dark: false,
  situation: `도어 클로즈까지 1분이 채 남지 않았다.\n운송직원은 이미 보이지 않는 상태.\n\n사무장이 Aisle에서 승객에게 말하고 있다.\n\n사무장  "이번만 해드리는 거예요~\n          자리 바꾸셔도 됩니다!"`,
  thought: `"운송직원도 없는데 좌석 변경을 해드려도 되는 건가?\n뭔가 이상한 것 같은데... 선배한테 물어봐도 될까?"`,
  violations: [
    { icon: "🔴", color: "#D63B3B", text: "도어 클로즈 전 좌석 변경은 반드시 운송직원 확인 후 처리" },
    { icon: "🔴", color: "#D63B3B", text: "운송직원 부재 상태의 임의 좌석 변경은 탑승 매니페스트 오류로 이어질 수 있으며 보안·안전 규정 위반에 해당한다" },
  ],
};

const SCENE2 = {
  sceneNum: "SCENE 2", sceneIcon: "🍱", sceneTitle: "사전기내식 서비스 — 뭔가 다르다", dark: true,
  situation: `① 카트 없이 개별 트레이로 진행\n   선임  "난기류도 없으니까 그냥 들고 나가자"\n② 한국어 방송만 끝나자마자 바로 시작\n   선임  "새벽이니까 얼른 끝내자"\n③ 선임 FR이 신입에게\n   선임  "2인 1조 안 해도 돼, 그냥 혼자 나가"\n④ 갤리 브리핑 없이 바로 시작`,
  thought: `"다들 이렇게 하는 건가?\n내가 배운 것들이랑 너무 다른데..."`,
  violations: [
    { icon: "🔴", color: "#D63B3B", text: "① 카트 미사용 — 뜨거운 음식의 카트 외 운반 금지" },
    { icon: "🔴", color: "#D63B3B", text: "② 외국어 방송 생략 — 전 노선 한·영 방송 의무, 새벽이라는 이유로 생략 불가" },
    { icon: "🔴", color: "#D63B3B", text: "③ 2인 1조 위반 — 사전기내식 서비스는 반드시 2인 1조" },
    { icon: "🔴", color: "#D63B3B", text: "④ 갤리 브리핑 미실시 — 서비스 전 갤리 브리핑 절차상 필수" },
  ],
};

const SCENE3 = {
  sceneNum: "SCENE 3", sceneIcon: "🛍️", sceneTitle: "기내 면세 서비스 — 세 가지가 빠졌다", dark: false,
  situation: `① DP가 부두티인 줄 모르는 상황\n   AL  "사무장님, 저 OOO님이랑 같이 할게요"\n   → 확인 없이 그냥 진행\n② 탑승권 확인 없이 결제 처리\n   AL  "손님, 명의 카드 맞으시죠?"\n   → 탑승권 확인 없이 바로 결제\n      (5월 기내 면세 강조사항 — 탑승권 확인 필수)\n③ 100ml 액체류 구매 승객에게\n   환승 여부를 묻지 않고 판매 완료`,
  thought: `"다들 바빠서 그런 건지...\n이렇게 해도 되는 건지 모르겠어."`,
  violations: [
    { icon: "🟠", color: "#FF8533", text: "① 듀티 미확인 — 서비스 전 담당 듀티 확인은 기본 절차" },
    { icon: "🟠", color: "#FF8533", text: "② 탑승권 미확인 — 5월 기내 면세 강조사항 위반, 신분 확인 없는 결제 처리 불가" },
    { icon: "🟠", color: "#FF8533", text: "③ 액체류 환승 확인 누락 — 환승 승객의 액체류 구매는 목적지 통관 문제 발생 가능, 반드시 환승 여부 확인 후 판매" },
  ],
};

const SCENE4 = {
  sceneNum: "SCENE 4", sceneIcon: "🚨", sceneTitle: "회항 결정 — 방송은 누가 하나요?", dark: true,
  situation: `기장으로부터 회항 결정이 통보되었다.\n\n사무장이 AL에게 말했다.\n사무장  "방송 등급이 높으니까 네가 해줘."\nAL      "...네?"\n\n이후 15분이 지나도록 추가 방송 없음.\n승객들이 술렁이기 시작했다.\n\n사무장  "기장님이 정보를 안 주시네.\n          정확한 정보로 해주세요."`,
  thought: `"방송 등급이 높으면 AL이 해야 하는 건가?\n회항인데 방송이 이렇게 늦어도 되는 건가?"`,
  violations: [
    { icon: "🔴", color: "#D63B3B", text: "① 비정상 상황 방송 주체 오류 — 비정상 상황 방송은 사무장이 직접 실시. '방송 등급이 높다'는 이유로 AL에게 위임 불가. 방송 능숙도와 규정 주체는 별개의 문제" },
    { icon: "🔴", color: "#D63B3B", text: "② 10분 방송 규정 위반 — 비정상 상황 발생 시 10분마다 승객 안내 방송 의무. 15분 경과 후에도 추가 방송 없음 — 명백한 위반. '기장이 정보를 안 준다'는 방송 지연의 이유가 될 수 없다" },
  ],
};

// ── PART 4: Quote Grid Slide A ─────────────────────

function P4QuoteGridSlide() {
  const quotes = [
    "우리 편에서만\n이렇게 하자",
    "바쁘니까\n이번만",
    "원래 다들\n이렇게 해",
    "선배한테\n배운 대로",
  ];
  return (
    <div style={{ width: "100%", height: "100%", background: C.dark, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "24px 60px 0" }}>
        <Pill bg={C.green}>PART 4</Pill>
        <div style={{ marginTop: 12, fontSize: 14, fontWeight: 800, color: "#AAA", letterSpacing: "0.1em" }}>🤔 낯설지 않은 말들</div>
        <Accent color={C.green} style={{ marginTop: 10 }} />
      </div>
      <div style={{ flex: 1, padding: "14px 60px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, flex: 1 }}>
          {quotes.map((q, i) => (
            <div key={i} style={{ background: "#1E1E1E", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 28px", border: "1px solid #2A2A2A" }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#777", textAlign: "center", lineHeight: 1.75, whiteSpace: "pre-line" }}>{q}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "#0D1A0D", border: "1px solid #1A3A1A", borderRadius: 10, padding: "14px 28px" }}>
          <div style={{ fontSize: 13, color: "#6A9A6A", lineHeight: 2.0 }}>
            이 말들이 쌓이면<br />
            누군가는 눈치를 보고<br />
            누군가는 불편함을 참고<br />
            누군가는 잘못된 걸 맞는 걸로 배운다.
          </div>
        </div>
      </div>
      <Bar color={C.green} />
    </div>
  );
}

// ── PART 4: Core Message Slide B ──────────────────

function P4CoreMessageSlide() {
  return (
    <div style={{ width: "100%", height: "100%", background: C.white, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "24px 60px 0" }}>
        <Pill bg={C.green}>PART 4</Pill>
        <Accent color={C.green} style={{ marginTop: 12 }} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 60px 28px", gap: 22 }}>
        <div style={{ fontSize: 34, fontWeight: 900, color: C.dark, lineHeight: 1.3 }}>
          사람마다 다른 비행이 아닌<br />
          <span style={{ color: C.green }}>누가 해도 동일한 비행</span>
        </div>
        <div style={{ width: 56, height: 4, background: C.green, borderRadius: 2 }} />
        <div style={{ fontSize: 14, color: "#555", lineHeight: 2.1 }}>
          어떤 편조가 타도, 어떤 선배를 만나도<br />
          승객이 경험하는 안전과 서비스의 수준이 같아야 한다.<br /><br />
          그게 시스템이고<br />
          그게 곧 문화다. ✈️
        </div>
      </div>
      <Bar color={C.green} />
    </div>
  );
}

// ── PART 4: Closing Slide C ───────────────────────

function P4ClosingSlide() {
  return (
    <div style={{ width: "100%", height: "100%", background: C.dark, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", right: -80, top: -80, width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle,${C.green}14 0%,transparent 65%)` }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 80px", zIndex: 2, gap: 24 }}>
        <Pill bg={C.green}>PART 4</Pill>
        <div style={{ fontSize: 21, fontWeight: 900, color: C.white, lineHeight: 1.8 }}>
          올바른 문화는<br />
          특별한 누군가가 만드는 것이 아니라<br /><br />
          지금 이 자리에 있는<br />
          우리 각자가<br />
          매 비행에서 만들어가는 것입니다. 🌟
        </div>
        <div style={{ width: "100%", height: 1, background: "#2A2A2A" }} />
        <div style={{ fontSize: 13, color: "#555", lineHeight: 1.9 }}>
          오후 세션에서 오늘 이야기한 것들이<br />
          다른 언어로 다시 등장합니다.<br />
          그때 연결해보세요. 🔗
        </div>
      </div>
      <Bar color={C.green} />
    </div>
  );
}

// ── Slide Registry ─────────────────────────────────

const SLIDES = [
  { id: "title",    part: 0, label: "타이틀",             Comp: TitleSlide },
  { id: "toc",      part: 0, label: "세션 구성",           Comp: TableOfContentsSlide },
  { id: "p1-open",  part: 1, label: "PART 1 오프너",       Comp: () => <SectionOpener part={1} /> },
  { id: "p1-c1a",   part: 1, label: "케이스 1 — 시나리오", Comp: () => <CaseScenarioSlide data={CASES[0]} /> },
  { id: "p1-c1b",   part: 1, label: "케이스 1 — 토의",    Comp: () => <CaseDiscussSlide data={CASES[0]} /> },
  { id: "p1-c2a",   part: 1, label: "케이스 2 — 시나리오", Comp: () => <CaseScenarioSlide data={CASES[1]} /> },
  { id: "p1-c2b",   part: 1, label: "케이스 2 — 토의",    Comp: () => <CaseDiscussSlide data={CASES[1]} /> },
  { id: "p1-c3a",   part: 1, label: "케이스 3 — 시나리오", Comp: () => <CaseScenarioSlide data={CASES[2]} /> },
  { id: "p1-c3b",   part: 1, label: "케이스 3 — 토의",    Comp: () => <CaseDiscussSlide data={CASES[2]} /> },
  { id: "p1-c4a",   part: 1, label: "케이스 4 — 시나리오", Comp: () => <CaseScenarioSlide data={CASES[3]} /> },
  { id: "p1-c4b",   part: 1, label: "케이스 4 — 토의",    Comp: () => <CaseDiscussSlide data={CASES[3]} /> },
  { id: "p1-c5a",   part: 1, label: "케이스 5 — 시나리오", Comp: () => <CaseScenarioSlide data={CASES[4]} /> },
  { id: "p1-c5b",   part: 1, label: "케이스 5 — 토의",    Comp: () => <CaseDiscussSlide data={CASES[4]} /> },
  { id: "p1-c6a",   part: 1, label: "케이스 6 — 시나리오", Comp: () => <CaseScenarioSlide data={CASES[5]} /> },
  { id: "p1-c6b",   part: 1, label: "케이스 6 — 토의",    Comp: () => <CaseDiscussSlide data={CASES[5]} /> },
  { id: "p1-share", part: 1, label: "전체 공유",            Comp: ShareSlide },
  { id: "p2-open",  part: 2, label: "PART 2 오프너",          Comp: () => <SectionOpener part={2} /> },
  { id: "p2-a",     part: 2, label: "PART 2 — CSM 권한",     Comp: P2CSMCardSlide },
  { id: "p2-b",     part: 2, label: "PART 2 — 무상 생수",    Comp: P2WaterSlide },
  { id: "p2-c",     part: 2, label: "PART 2 — 조별 토의",    Comp: P2DiscussSlide },
  { id: "p3-open",  part: 3, label: "PART 3 오프너",          Comp: () => <SectionOpener part={3} /> },
  { id: "p3-intro", part: 3, label: "PART 3 — 신입 인터뷰",  Comp: P3InterviewSlide },
  { id: "p3-tl",    part: 3, label: "PART 3 — 비행 타임라인", Comp: P3FlightTimelineSlide },
  { id: "p3-s1",    part: 3, label: "SCENE 1 — 도어 클로즈", Comp: () => <P3SceneSlide {...SCENE1} /> },
  { id: "p3-s2",    part: 3, label: "SCENE 2 — 사전기내식",  Comp: () => <P3SceneSlide {...SCENE2} /> },
  { id: "p3-s3",    part: 3, label: "SCENE 3 — 기내 면세",   Comp: () => <P3SceneSlide {...SCENE3} /> },
  { id: "p3-s4",    part: 3, label: "SCENE 4 — 회항 방송",   Comp: () => <P3SceneSlide {...SCENE4} /> },
  { id: "p4-open",  part: 4, label: "PART 4 오프너",          Comp: () => <SectionOpener part={4} /> },
  { id: "p4-a",     part: 4, label: "PART 4 — 낯선 말들",    Comp: P4QuoteGridSlide },
  { id: "p4-b",     part: 4, label: "PART 4 — 핵심 메시지",  Comp: P4CoreMessageSlide },
  { id: "p4-c",     part: 4, label: "PART 4 — 클로징",       Comp: P4ClosingSlide },
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

      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 16 }}>
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

      <div style={{ marginTop: 12, display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap", justifyContent: "center", maxWidth: 800 }}>
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

      <SessionTimeline cur={cur} />

      <div style={{ marginTop: 10, display: "flex", gap: 16, alignItems: "center" }}>
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
