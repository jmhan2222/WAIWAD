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
  2: { title: "사무장 판단 하에 제공 가능한 영역", sub: "CSM 조문이 말하는 것과 현장 사이", tag: "CSM 조문 기반 토론" },
  3: { title: "지켜야 하는 규정", sub: "사례 중심으로 살펴보는 판단의 경계", tag: "사례 분석" },
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
        <div style={{ fontSize: 17, color: "#4A4A4A", marginBottom: 28 }}>{m.sub}</div>
        <Accent color={color} style={{ marginBottom: 28 }} />
        {part === 1 ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 18 }}>💬</span>
            <span style={{ fontSize: 13, color: "#555" }}>케이스별 소그룹 토의 → 전체 공유 순으로 진행됩니다</span>
          </div>
        ) : (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#1E1E1E", borderRadius: 8, padding: "10px 18px", alignSelf: "flex-start" }}>
            <span style={{ fontSize: 14 }}>🔧</span>
            <span style={{ fontSize: 12, color: "#444" }}>내용 준비 중입니다</span>
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
  { id: "p2-open",  part: 2, label: "PART 2 오프너",       Comp: () => <SectionOpener part={2} /> },
  { id: "p3-open",  part: 3, label: "PART 3 오프너",       Comp: () => <SectionOpener part={3} /> },
  { id: "p4-open",  part: 4, label: "PART 4 오프너",       Comp: () => <SectionOpener part={4} /> },
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
