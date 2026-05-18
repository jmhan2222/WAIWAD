import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────
// 데이터
// ─────────────────────────────────────────────
const SESSION = {
  title: "우리는 어떻게 일하고 있는가?",
  subtitle: "서비스 현장 케이스스터디",
  meta: "객실서비스 교육 · 오전 1교시 · 50분",
};

const TIMELINE = [
  { label: "오프닝", time: "00:00", dur: 5, color: "#6B6B6B" },
  { label: "케이스 A\n소그룹 토의", time: "05:00", dur: 15, color: "#FF6600" },
  { label: "케이스 A\n전체 공유", time: "20:00", dur: 5, color: "#FF8533" },
  { label: "케이스 B\n소그룹 토의", time: "25:00", dur: 15, color: "#FF6600" },
  { label: "케이스 B\n전체 공유", time: "40:00", dur: 5, color: "#FF8533" },
  { label: "브릿지\n클로징", time: "45:00", dur: 5, color: "#2C2C2C" },
];

const CASE_A = {
  id: "A",
  badge: "CASE A — 워밍업",
  difficulty: "명확한 상황 · 토의 방향 잡기 쉬움",
  title: "사전 구매 고객인데, 지금 드려도 될까요?",
  context: [
    "노선: 인천 → 오사카 (2h 30min)",
    "탑승률 거의 만석 / 이륙 후 25분 경과",
    "에어카페 서비스 시작 직전",
  ],
  scenario: `AL이 카트를 준비하던 중, 14C 승객이 먼저 말을 걸어왔다.

승객(14C)  "저 오늘 에어카페 라면 사전 주문했는데요,
            지금 받을 수 있어요? 배가 많이 고파서요."

AL은 확인해보니 실제로 사전 구매가 되어 있었다.
아직 카트 서비스는 공식적으로 시작 전.
바로 뒷좌석 승객들도 통로를 주시하고 있다.`,
  scenes: [
    {
      label: "상황 1",
      text: `AL이 사무장에게 인터폰으로 물어봤다.
"사전 구매 고객인데, 서비스 시작 전에 먼저 드려도 될까요?"`,
      questions: [
        "사무장이라면 어떻게 지시하겠는가?",
        "먼저 드리는 것이 재량인가, 기준 이탈인가?",
        "뒷좌석 승객 반응이 신경 쓰인다면 — 그것도 판단 근거가 되어야 하는가?",
      ],
    },
    {
      label: "상황 2",
      text: `사무장이 "일단 드려도 돼"라고 했고, AL이 라면을 먼저 제공했다.
그러자 옆자리 15C 승객이 말했다.
"저도 사전 주문했는데, 저도 지금 받을 수 있어요?"`,
      questions: [
        "이 상황을 만든 원인은 무엇인가?",
        "AL은 지금 어떻게 해야 하는가?",
        "이 상황을 처음부터 막으려면 사무장의 지시가 어땠어야 했나?",
      ],
    },
    {
      label: "상황 3",
      text: `서비스가 마무리된 후, AL이 사무장에게 말했다.
"오늘 사전 구매 손님들 먼저 드리다 보니까
일반 판매 시작 타이밍이 좀 어긋났어요."`,
      questions: [
        "이 피드백에 사무장은 어떻게 반응해야 하는가?",
        "같은 상황이 다음 편에 또 생기면, 편조는 어떻게 움직여야 하는가?",
        "이걸 브리핑에서 사전에 공유했다면 달라졌을까?",
      ],
    },
  ],
  groupGuide: [
    "각자 비슷한 상황을 겪어본 적 있는지 먼저 나눠보세요",
    "정답을 찾는 게 아니라 — 우리 편조라면 어떻게 했을지를 이야기해보세요",
    "의견이 갈린다면 그 이유를 말해보세요 — 그게 더 중요합니다",
  ],
  sharePoints: [
    "그룹마다 사무장 지시 내용이 달랐나요?",
    "상황 2가 발생한 원인에 대해 그룹별 분석은?",
    "브리핑의 역할에 대해 어떤 이야기가 나왔나요?",
  ],
};

const CASE_B = {
  id: "B",
  badge: "CASE B — 심화",
  difficulty: "정답 없음 · 그룹마다 다른 결론 가능",
  title: "선배가 늘 해오던 방식인데, 맞는 건가요?",
  context: [
    "노선: 김포 → 제주 (55min) 국내선",
    "신입 1년 차 AL / 경력 8년 차 선임 FR",
    "에어카페 판매 진행 중",
  ],
  scenario: `FR(선임)이 AL에게 조용히 말했다.

FR  "이 노선은 시간이 짧아서 우리 보통 이렇게 해.
     컵라면은 뜨거운 물 붓고 바로 드리는 게 아니라
     카트에서 미리 준비해두고 한꺼번에 돌리거든.
     그래야 시간 안에 다 처리할 수 있어."

AL은 매뉴얼에서는 컵라면을 고객 앞에서 직접 제공하라고
배웠던 것 같은데 — 정확히 기억이 나지 않는다.`,
  scenes: [
    {
      label: "상황 1",
      text: `AL은 FR이 시키는 대로 했다.
서비스는 빠르게 마무리됐고, FR은 "이렇게 하면 다 돼"라고 했다.

비행이 끝난 후, AL은 혼자 생각했다.
'이게 맞는 건지 아닌지를 어디서 확인해야 하지?'`,
      questions: [
        "AL의 행동은 적절했는가?",
        "AL이 현장에서 FR에게 물어보기 어려운 이유는 무엇인가?",
        "신입 승무원이 '기준'을 확인할 수 있는 경로가 있는가?",
      ],
    },
    {
      label: "상황 2",
      text: `다음 비행에서 AL은 다른 선임 FR2와 함께 탔다.
FR2는 컵라면을 고객 앞에서 직접 조리해서 제공했다.

AL은 당황했다.
'지난번 FR한테 배운 것과 다른데 — 누가 맞는 거지?'`,
      questions: [
        "두 FR의 방식 차이가 생긴 이유는 무엇인가?",
        "AL은 이 상황에서 어떻게 행동해야 하는가?",
        "이 상황이 반복되면 편조 전체에 어떤 영향을 미치는가?",
      ],
    },
    {
      label: "상황 3",
      text: `AL이 용기를 내서 사무장에게 물었다.
"혹시 컵라면 제공 방식이 어떤 게 기준인지 여쭤봐도 될까요?
선임마다 다르게 하시는 것 같아서요."

사무장은 어떻게 반응해야 하는가?`,
      questions: [
        "사무장이 해야 할 첫 마디는?",
        "이 질문을 받은 것이 사무장에게 어떤 신호인가?",
        "이 상황을 브리핑으로 예방할 수 있었나? 어떻게?",
      ],
    },
  ],
  groupGuide: [
    "신입 AL 입장 / FR 선임 입장 / 사무장 입장을 나눠서 이야기해보세요",
    "'선배가 하는 대로 했다'는 것이 잘못인가요? — 근거와 함께 이야기해보세요",
    "우리 편조에서 비슷한 상황이 있었다면 솔직하게 나눠봐도 됩니다",
  ],
  sharePoints: [
    "그룹에서 AL의 행동에 대해 어떤 의견이 나왔나요?",
    "선임마다 다른 방식 — 이 문제의 책임은 누구에게 있다고 봤나요?",
    "사무장의 첫 마디, 그룹마다 어떻게 달랐나요?",
  ],
};

// ─────────────────────────────────────────────
// 색상 & 유틸
// ─────────────────────────────────────────────
const C = {
  orange: "#FF6600",
  orangeLight: "#FF8533",
  dark: "#1A1A1A",
  darkMid: "#2A2A2A",
  card: "#242424",
  gray: "#6B6B6B",
  grayLight: "#F2F2F2",
  white: "#FFFFFF",
  green: "#2E9E6B",
  greenDim: "#2E9E6B18",
};

function OBar({ style }) {
  return <div style={{ height: 4, background: `linear-gradient(90deg,${C.orange},${C.orangeLight})`, borderRadius: 2, width: 40, ...style }} />;
}

function Tag({ children, color = C.orange, bg, style }) {
  return (
    <span style={{
      display: "inline-block",
      background: bg || `${color}22`,
      color, border: `1px solid ${color}44`,
      borderRadius: 5, padding: "3px 10px",
      fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", ...style,
    }}>{children}</span>
  );
}

// ─────────────────────────────────────────────
// 타이머 훅
// ─────────────────────────────────────────────
function useTimer(totalSec) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setElapsed(e => Math.min(e + 1, totalSec)), 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [running, totalSec]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const reset = () => { setElapsed(0); setRunning(false); };

  return { elapsed, running, setRunning, fmt, reset, pct: elapsed / totalSec };
}

// ─────────────────────────────────────────────
// 슬라이드 컴포넌트들
// ─────────────────────────────────────────────

// 1. 타이틀
function TitleSlide() {
  return (
    <div style={{ width: "100%", height: "100%", background: C.dark, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", right: -80, top: -80, width: 480, height: 480, borderRadius: "50%", background: `radial-gradient(circle, ${C.orange}1A 0%, transparent 65%)` }} />
      <div style={{ position: "absolute", left: -60, bottom: -60, width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${C.orange}0D 0%, transparent 65%)` }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 72px", zIndex: 2 }}>
        <Tag style={{ marginBottom: 24, fontSize: 11, letterSpacing: "0.15em" }}>SERVICE TRAINING · CASE STUDY SESSION</Tag>
        <div style={{ fontSize: 52, fontWeight: 900, color: C.white, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 12 }}>
          {SESSION.title}
        </div>
        <div style={{ fontSize: 20, color: "#888", marginBottom: 40 }}>{SESSION.subtitle}</div>
        <OBar />
        <div style={{ marginTop: 40, fontSize: 12, color: "#555", display: "flex", gap: 24 }}>
          <span>⏱ {SESSION.meta}</span>
        </div>
      </div>

      <div style={{ height: 6, background: `linear-gradient(90deg,${C.orange},${C.orangeLight})` }} />
    </div>
  );
}

// 2. 오프닝 — 진행자 가이드
function OpeningSlide() {
  return (
    <div style={{ width: "100%", height: "100%", background: C.white, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "44px 64px 0" }}>
        <Tag>00:00 — 오프닝 · 5분</Tag>
        <div style={{ fontSize: 30, fontWeight: 800, color: C.dark, marginTop: 10, marginBottom: 4 }}>오늘은 교육이 아닙니다</div>
        <div style={{ fontSize: 14, color: C.gray, marginBottom: 4 }}>우리가 현장에서 어떻게 일하고 있는지, 함께 이야기해보는 시간입니다.</div>
        <OBar style={{ marginBottom: 28 }} />
      </div>

      <div style={{ flex: 1, padding: "0 64px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: C.dark, borderRadius: 14, padding: "24px 28px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.orange, marginBottom: 12, letterSpacing: "0.1em" }}>진행자 오프닝 멘트</div>
          {[
            "\"오늘 오전은 정답을 내는 시간이 아닙니다.\"",
            "\"우리가 현장에서 실제로 어떻게 판단하는지를 꺼내보는 시간이에요.\"",
            "\"잘한 것, 못한 것 구분 없이 솔직하게 이야기해주시면 됩니다.\"",
            "\"오후에 이 이야기가 다시 연결될 거예요 — 그때 느껴보세요.\"",
          ].map((m, i) => (
            <div key={i} style={{ fontSize: 13, color: "#CCC", lineHeight: 1.8, marginBottom: 4, paddingLeft: 12, borderLeft: `3px solid ${C.orange}33` }}>{m}</div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: C.grayLight, borderRadius: 14, padding: "20px 24px", flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.orange, marginBottom: 10, letterSpacing: "0.1em" }}>그룹 구성 가이드</div>
            {[
              { icon: "👥", text: "4~5인 소그룹 구성" },
              { icon: "🔀", text: "경력 혼합 권장 — 신입과 고경력이 같은 그룹" },
              { icon: "📝", text: "그룹별 간단히 메모 (결과 발표용)" },
              { icon: "🚫", text: "정답 찾기 금지 — 과정이 중요" },
            ].map((g, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>{g.icon}</span>
                <span style={{ fontSize: 13, color: C.dark }}>{g.text}</span>
              </div>
            ))}
          </div>

          <div style={{ background: `${C.orange}11`, border: `1.5px solid ${C.orange}44`, borderRadius: 12, padding: "14px 20px" }}>
            <div style={{ fontSize: 12, color: C.orange, fontWeight: 700, marginBottom: 4 }}>오늘 세션 구조</div>
            <div style={{ fontSize: 12, color: C.dark, lineHeight: 1.8 }}>케이스 A (20분) → 케이스 B (20분) → 마무리 (5분)</div>
          </div>
        </div>
      </div>
      <div style={{ height: 24 }} />
      <div style={{ height: 4, background: `linear-gradient(90deg,${C.orange},${C.orangeLight})` }} />
    </div>
  );
}

// 3. 케이스 슬라이드 (공용)
function CaseIntroSlide({ caseData }) {
  const isA = caseData.id === "A";
  return (
    <div style={{ width: "100%", height: "100%", background: isA ? C.white : C.dark, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "36px 64px 0" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
          <div style={{ background: C.orange, borderRadius: 6, padding: "4px 14px", fontSize: 12, fontWeight: 800, color: C.white }}>{caseData.badge}</div>
          <div style={{ fontSize: 12, color: isA ? C.gray : "#888" }}>{caseData.difficulty}</div>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: isA ? C.dark : C.white, marginBottom: 8 }}>{caseData.title}</div>
        <OBar style={{ marginBottom: 16 }} />

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {caseData.context.map((c, i) => (
            <span key={i} style={{ background: isA ? C.grayLight : "#2C2C2C", borderRadius: 6, padding: "4px 12px", fontSize: 12, color: isA ? C.dark : "#CCC", fontWeight: 500 }}>{c}</span>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: "0 64px" }}>
        <div style={{ background: isA ? C.dark : "#2C2C2C", borderRadius: 14, padding: "24px 28px", height: "100%", boxSizing: "border-box" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.orange, marginBottom: 12, letterSpacing: "0.1em" }}>SCENARIO</div>
          <div style={{ fontSize: 14, color: "#DDD", lineHeight: 2, whiteSpace: "pre-line" }}>{caseData.scenario}</div>
        </div>
      </div>
      <div style={{ height: 24 }} />
      <div style={{ height: 4, background: `linear-gradient(90deg,${C.orange},${C.orangeLight})` }} />
    </div>
  );
}

// 4. 소그룹 토의 슬라이드 (타이머 포함)
function GroupDiscussSlide({ caseData, timeMin = 15 }) {
  const totalSec = timeMin * 60;
  const { elapsed, running, setRunning, fmt, reset, pct } = useTimer(totalSec);
  const [activeScene, setActiveScene] = useState(0);
  const remaining = totalSec - elapsed;
  const isA = caseData.id === "A";

  const timerColor = remaining < 120 ? "#FF4444" : remaining < 300 ? "#FFA500" : C.orange;

  return (
    <div style={{ width: "100%", height: "100%", background: isA ? C.white : C.dark, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "28px 64px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
              <div style={{ background: C.orange, borderRadius: 6, padding: "3px 12px", fontSize: 11, fontWeight: 800, color: C.white }}>{caseData.badge}</div>
              <Tag color={C.green}>소그룹 토의 · {timeMin}분</Tag>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: isA ? C.dark : C.white }}>{caseData.title}</div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: timerColor, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
              {fmt(remaining)}
            </div>
            <div style={{ position: "relative", height: 6, width: 120, background: "#333", borderRadius: 3, margin: "6px auto" }}>
              <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${(1 - pct) * 100}%`, background: timerColor, borderRadius: 3, transition: "width 1s linear" }} />
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
              <button onClick={() => setRunning(r => !r)} style={{ background: running ? "#555" : C.orange, color: C.white, border: "none", borderRadius: 6, padding: "5px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                {running ? "⏸ 일시정지" : elapsed === 0 ? "▶ 시작" : "▶ 재개"}
              </button>
              <button onClick={reset} style={{ background: "#333", color: "#AAA", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}>↺</button>
            </div>
          </div>
        </div>
        <OBar style={{ marginTop: 10, marginBottom: 14 }} />
      </div>

      <div style={{ flex: 1, padding: "0 64px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {caseData.scenes.map((s, i) => (
              <button key={i} onClick={() => setActiveScene(i)} style={{
                flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 700,
                background: i === activeScene ? C.orange : isA ? C.grayLight : "#2C2C2C",
                color: i === activeScene ? C.white : isA ? C.dark : "#888",
                transition: "all 0.2s",
              }}>{s.label}</button>
            ))}
          </div>

          <div style={{ background: isA ? C.dark : "#1E1E1E", borderRadius: 12, padding: "16px 20px", flex: 1 }}>
            <div style={{ fontSize: 12, color: "#CCC", lineHeight: 1.9, whiteSpace: "pre-line" }}>{caseData.scenes[activeScene].text}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.orange, letterSpacing: "0.1em" }}>토의 질문</div>
          {caseData.scenes[activeScene].questions.map((q, i) => (
            <div key={i} style={{ background: isA ? C.grayLight : "#2C2C2C", borderRadius: 10, padding: "14px 18px", borderLeft: `4px solid ${C.orange}` }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: C.orange, marginRight: 8 }}>Q{i + 1}</span>
              <span style={{ fontSize: 13, color: isA ? C.dark : "#DDD", lineHeight: 1.6 }}>{q}</span>
            </div>
          ))}

          <div style={{ background: `${C.green}11`, border: `1.5px solid ${C.green}44`, borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.green, marginBottom: 6 }}>진행 가이드</div>
            {caseData.groupGuide.map((g, i) => (
              <div key={i} style={{ fontSize: 11, color: isA ? C.dark : "#CCC", marginBottom: 4, display: "flex", gap: 6 }}>
                <span style={{ color: C.green }}>›</span>{g}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ height: 16 }} />
      <div style={{ height: 4, background: `linear-gradient(90deg,${C.orange},${C.orangeLight})` }} />
    </div>
  );
}

// 5. 전체 공유 슬라이드
function ShareSlide({ caseData }) {
  const [checked, setChecked] = useState([]);
  const isA = caseData.id === "A";
  const toggle = (i) => setChecked(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);

  return (
    <div style={{ width: "100%", height: "100%", background: isA ? C.white : C.dark, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "40px 64px 0" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
          <div style={{ background: C.orange, borderRadius: 6, padding: "3px 12px", fontSize: 11, fontWeight: 800, color: C.white }}>{caseData.badge}</div>
          <Tag color="#FF8533">전체 공유 · 5분</Tag>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: isA ? C.dark : C.white, marginBottom: 4 }}>그룹 이야기를 나눠봅시다</div>
        <div style={{ fontSize: 13, color: C.gray, marginBottom: 4 }}>각 그룹에서 나온 이야기 중 인상적이었던 것을 공유해 주세요.</div>
        <OBar style={{ marginBottom: 28 }} />
      </div>

      <div style={{ flex: 1, padding: "0 64px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.orange, marginBottom: 12, letterSpacing: "0.1em" }}>진행자 공유 포인트</div>
          {caseData.sharePoints.map((p, i) => (
            <div key={i} onClick={() => toggle(i)} style={{
              background: checked.includes(i) ? `${C.orange}18` : isA ? C.grayLight : "#2C2C2C",
              border: `2px solid ${checked.includes(i) ? C.orange : "transparent"}`,
              borderRadius: 12, padding: "16px 20px", marginBottom: 10, cursor: "pointer", transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${checked.includes(i) ? C.orange : "#555"}`, background: checked.includes(i) ? C.orange : "transparent", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {checked.includes(i) && <span style={{ color: C.white, fontSize: 12, fontWeight: 800 }}>✓</span>}
                </div>
                <span style={{ fontSize: 13, color: isA ? C.dark : "#DDD", lineHeight: 1.6 }}>{p}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: isA ? C.dark : "#1E1E1E", borderRadius: 14, padding: "24px 28px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.orange, marginBottom: 14, letterSpacing: "0.1em" }}>진행자 노트</div>
          {isA ? (
            <div style={{ fontSize: 13, color: "#CCC", lineHeight: 2 }}>
              <div style={{ marginBottom: 10 }}>· 그룹마다 사무장 지시가 달랐다면 <span style={{ color: C.orange }}>왜 달랐는지</span>에 집중하세요.</div>
              <div style={{ marginBottom: 10 }}>· 상황 2(옆자리 승객 요청)는 <span style={{ color: C.orange }}>예측 가능했던 상황</span>임을 자연스럽게 유도.</div>
              <div style={{ marginBottom: 10 }}>· 브리핑의 역할로 자연스럽게 연결되면 좋습니다.</div>
              <div style={{ background: `${C.orange}18`, borderRadius: 8, padding: "10px 14px", marginTop: 14, fontSize: 12, color: "#CCC" }}>
                ⚠ 정답 발표 금지 — "이래야 합니다"보다 "왜 그렇게 생각했나요?"로 이끌기
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "#CCC", lineHeight: 2 }}>
              <div style={{ marginBottom: 10 }}>· 그룹마다 책임 소재 분석이 다를 수 있어요 — 다 맞습니다.</div>
              <div style={{ marginBottom: 10 }}>· <span style={{ color: C.orange }}>신입 AL에 대한 비판</span>이 나온다면 "AL이 어떻게 알 수 있었을까요?"로 전환.</div>
              <div style={{ marginBottom: 10 }}>· 사무장의 첫 마디가 그룹마다 다르다면 <span style={{ color: C.orange }}>그 차이를 비교</span>하는 게 핵심.</div>
              <div style={{ background: `${C.orange}18`, borderRadius: 8, padding: "10px 14px", marginTop: 14, fontSize: 12, color: "#CCC" }}>
                💡 오후 연결 힌트: "기준이 다른 이유가 뭘까요?" — 이 질문으로 마무리하면 좋습니다.
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ height: 20 }} />
      <div style={{ height: 4, background: `linear-gradient(90deg,${C.orange},${C.orangeLight})` }} />
    </div>
  );
}

// 6. 브릿지 클로징
function BridgeSlide() {
  return (
    <div style={{ width: "100%", height: "100%", background: C.dark, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", right: -40, bottom: -40, width: 360, height: 360, borderRadius: "50%", background: `radial-gradient(circle, ${C.orange}15 0%, transparent 65%)` }} />

      <div style={{ padding: "44px 64px 0", zIndex: 2 }}>
        <Tag style={{ marginBottom: 16 }}>45:00 — 브릿지 클로징 · 5분</Tag>
        <div style={{ fontSize: 30, fontWeight: 800, color: C.white, marginBottom: 4 }}>마무리하며 — 하나만 기억해주세요</div>
        <OBar style={{ marginBottom: 28 }} />
      </div>

      <div style={{ flex: 1, padding: "0 64px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, zIndex: 2 }}>
        <div style={{ background: "#2A2A2A", borderRadius: 16, padding: "28px 28px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.orange, marginBottom: 16, letterSpacing: "0.1em" }}>오늘 우리가 한 것</div>
          {[
            { icon: "💬", text: "현장에서 실제로 어떻게 판단하는지 꺼내봤어요" },
            { icon: "🔀", text: "같은 상황에서 생각이 다를 수 있다는 걸 확인했어요" },
            { icon: "❓", text: "왜 다른지 — 그 이유까지 건드렸어요" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 13, color: "#CCC", lineHeight: 1.6 }}>{item.text}</span>
            </div>
          ))}
        </div>

        <div style={{ background: `${C.orange}15`, border: `2px solid ${C.orange}44`, borderRadius: 16, padding: "28px 28px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.orange, marginBottom: 16, letterSpacing: "0.1em" }}>오후 교육 연결 멘트</div>
          <div style={{ fontSize: 14, color: "#CCC", lineHeight: 2, marginBottom: 20, fontStyle: "italic" }}>
            "오후에 오늘 우리가 이야기한 것들이<br/>다른 언어로 다시 나올 거예요.<br/>그때 — '아, 이게 그거였구나' 하는 순간이 있을 겁니다."
          </div>
          <div style={{ background: "#1A1A1A", borderRadius: 8, padding: "12px 16px" }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>진행자 주의</div>
            <div style={{ fontSize: 12, color: "#AAA", lineHeight: 1.7 }}>WAI, WAD라는 단어를 오전에 먼저 꺼내지 마세요.<br/>오후 교육의 개념 전달 효과가 살아납니다.</div>
          </div>
        </div>
      </div>

      <div style={{ margin: "16px 64px", textAlign: "center", zIndex: 2 }}>
        <div style={{ fontSize: 15, color: "#666", fontStyle: "italic" }}>
          "우리가 어떻게 일하는지 아는 것 — 그게 더 잘 일하는 첫 번째 조건입니다."
        </div>
      </div>

      <div style={{ height: 6, background: `linear-gradient(90deg,${C.orange},${C.orangeLight})` }} />
    </div>
  );
}

// ─────────────────────────────────────────────
// 슬라이드 목록
// ─────────────────────────────────────────────
const SLIDES = [
  { id: "title",       label: "타이틀",              time: "—",     component: <TitleSlide /> },
  { id: "opening",     label: "오프닝",              time: "00:00", component: <OpeningSlide /> },
  { id: "caseA-intro", label: "케이스 A — 시나리오", time: "05:00", component: <CaseIntroSlide caseData={CASE_A} /> },
  { id: "caseA-discuss", label: "케이스 A — 소그룹 토의", time: "05:00", component: <GroupDiscussSlide caseData={CASE_A} timeMin={15} /> },
  { id: "caseA-share", label: "케이스 A — 전체 공유", time: "20:00", component: <ShareSlide caseData={CASE_A} /> },
  { id: "caseB-intro", label: "케이스 B — 시나리오", time: "25:00", component: <CaseIntroSlide caseData={CASE_B} /> },
  { id: "caseB-discuss", label: "케이스 B — 소그룹 토의", time: "25:00", component: <GroupDiscussSlide caseData={CASE_B} timeMin={15} /> },
  { id: "caseB-share", label: "케이스 B — 전체 공유", time: "40:00", component: <ShareSlide caseData={CASE_B} /> },
  { id: "bridge",      label: "브릿지 클로징",       time: "45:00", component: <BridgeSlide /> },
];

// ─────────────────────────────────────────────
// 메인 앱
// ─────────────────────────────────────────────
export default function App() {
  const [cur, setCur] = useState(0);
  const total = SLIDES.length;
  const slide = SLIDES[cur];

  const go = (d) => setCur(p => Math.max(0, Math.min(total - 1, p + d)));

  return (
    <div style={{ minHeight: "100vh", background: "#0D0D0D", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 16px", fontFamily: "'Apple SD Gothic Neo','Noto Sans KR',sans-serif" }}>

      <div style={{ width: "100%", maxWidth: 920, aspectRatio: "16/9", borderRadius: 16, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.8)", position: "relative" }}>
        {slide.component}
      </div>

      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => go(-1)} disabled={cur === 0} style={{
          background: cur === 0 ? "#222" : C.orange, color: C.white,
          border: "none", borderRadius: 8, padding: "9px 22px", fontSize: 13, fontWeight: 700,
          cursor: cur === 0 ? "default" : "pointer", opacity: cur === 0 ? 0.3 : 1,
        }}>← 이전</button>

        <div style={{ textAlign: "center", minWidth: 160 }}>
          <div style={{ fontSize: 12, color: "#888" }}>{slide.label}</div>
          {slide.time !== "—" && <div style={{ fontSize: 11, color: C.orange, marginTop: 2 }}>⏱ {slide.time}</div>}
          <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{cur + 1} / {total}</div>
        </div>

        <button onClick={() => go(1)} disabled={cur === total - 1} style={{
          background: cur === total - 1 ? "#222" : C.orange, color: C.white,
          border: "none", borderRadius: 8, padding: "9px 22px", fontSize: 13, fontWeight: 700,
          cursor: cur === total - 1 ? "default" : "pointer", opacity: cur === total - 1 ? 0.3 : 1,
        }}>다음 →</button>
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 6, alignItems: "center" }}>
        {SLIDES.map((s, i) => (
          <button key={i} onClick={() => setCur(i)} title={s.label} style={{
            width: i === cur ? 32 : 10, height: 10, borderRadius: 5,
            background: i === cur ? C.orange : "#333",
            border: "none", cursor: "pointer", transition: "all 0.25s", padding: 0,
          }} />
        ))}
      </div>

      <div style={{ marginTop: 20, width: "100%", maxWidth: 920 }}>
        <div style={{ fontSize: 11, color: "#555", marginBottom: 8, letterSpacing: "0.1em" }}>SESSION TIMELINE</div>
        <div style={{ display: "flex", gap: 3, height: 36 }}>
          {TIMELINE.map((t, i) => (
            <div key={i} style={{
              flex: t.dur, background: t.color, borderRadius: 6,
              display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
              opacity: 0.85,
            }}>
              <div style={{ fontSize: 9, color: C.white, fontWeight: 700, lineHeight: 1.3, textAlign: "center", whiteSpace: "pre-line", padding: "0 4px" }}>{t.label}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", marginTop: 1 }}>{t.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
