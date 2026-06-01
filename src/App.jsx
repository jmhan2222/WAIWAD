import { useState, useEffect, useRef, useCallback } from 'react';

const OG = '#FF6600';
const APP_BG = '#0D0D0D';
const DARK = '#111111';

// ── Timer ──────────────────────────────────────────────────────────────────
function Timer({ totalSeconds, label }) {
  const [rem, setRem] = useState(totalSeconds);
  const [on, setOn] = useState(false);
  const iv = useRef(null);
  const ac = useRef(null);

  const beep = useCallback(() => {
    try {
      if (!ac.current) ac.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = ac.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880; osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(); osc.stop(ctx.currentTime + 0.08);
    } catch (_) {}
  }, []);

  const speak = useCallback(() => {
    try {
      const u = new SpeechSynthesisUtterance('타임 오버');
      u.lang = 'ko-KR'; u.rate = 0.9; u.pitch = 1.1;
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (on) {
      iv.current = setInterval(() => {
        setRem(p => {
          if (p <= 1) { clearInterval(iv.current); setOn(false); speak(); return 0; }
          const n = p - 1;
          if (n <= 10) beep();
          return n;
        });
      }, 1000);
    }
    return () => clearInterval(iv.current);
  }, [on, beep, speak]);

  const reset = () => { clearInterval(iv.current); setOn(false); setRem(totalSeconds); };
  const color = rem <= 10 ? '#FF3333' : rem <= 60 ? '#FF8800' : OG;
  const mm = String(Math.floor(rem / 60)).padStart(2, '0');
  const ss = String(rem % 60).padStart(2, '0');

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 6, background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 12, padding: '10px 14px', flexShrink: 0 }}>
      {label && <div style={{ fontSize: 10, color: '#666', letterSpacing: 1.5, textTransform: 'uppercase' }}>{label}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace', letterSpacing: 2 }}>{mm}:{ss}</span>
        <button onClick={() => setOn(v => !v)} style={{ background: on ? '#2a2a2a' : OG, border: 'none', borderRadius: 6, padding: '5px 13px', color: '#fff', cursor: 'pointer', fontSize: 16 }}>{on ? '⏸' : '▶'}</button>
        <button onClick={reset} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: '5px 11px', color: '#888', cursor: 'pointer', fontSize: 16 }}>↺</button>
      </div>
      <div style={{ height: 5, background: '#1e1e1e', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(rem / totalSeconds) * 100}%`, background: color, transition: 'width 1s linear, background 0.5s' }} />
      </div>
    </div>
  );
}

// ── Reveal ─────────────────────────────────────────────────────────────────
function Reveal({ btn = '✏️ 문제점을 찾아보셨나요?', variant = 'red', children }) {
  const [open, setOpen] = useState(false);
  const s = variant === 'orange'
    ? { bg: '#2A1200', border: '#FF8533', color: '#FFA559' }
    : { bg: '#2A0A0A', border: '#D63B3B', color: '#FF6B6B' };
  return (
    <div style={{ marginTop: 12 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', background: open ? '#2a2a2a' : OG, color: '#fff', border: 'none', borderRadius: 8, padding: '10px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
        {open ? '▲ 닫기' : btn}
      </button>
      <div style={{ overflow: 'hidden', maxHeight: open ? 4000 : 0, opacity: open ? 1 : 0, transition: 'max-height 0.5s ease, opacity 0.5s ease' }}>
        <div style={{ marginTop: 10, padding: '16px 20px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, color: s.color, fontSize: 13, lineHeight: 1.8 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Micro Components ───────────────────────────────────────────────────────
const Chip = ({ c }) => <span style={{ display: 'inline-block', background: '#1a1a1a', border: '1px solid #333', borderRadius: 20, padding: '2px 10px', fontSize: 11, color: '#aaa', margin: '2px 3px' }}>{c}</span>;
const LChip = ({ c }) => <span style={{ display: 'inline-block', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: 20, padding: '2px 10px', fontSize: 11, color: '#555', margin: '2px 3px' }}>{c}</span>;
const Badge = ({ t }) => <div style={{ display: 'inline-block', background: `${OG}20`, border: `1px solid ${OG}60`, color: OG, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, marginBottom: 8 }}>{t}</div>;
const Hl = ({ children }) => <span style={{ color: OG }}>{children}</span>;
const Sp = ({ n = 8 }) => <div style={{ height: n }} />;

function QCard({ qs, orange, dark }) {
  const bg = dark ? '#0a0a0a' : orange ? 'transparent' : '#f8f8f8';
  const border = orange ? OG : dark ? '#222' : '#e4e4e4';
  const color = dark ? '#bbb' : '#444';
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '10px 14px', marginTop: 8 }}>
      {qs.map((q, i) => <div key={i} style={{ color, fontSize: 12, lineHeight: 1.85, padding: '1.5px 0' }}>{q}</div>)}
    </div>
  );
}

function SBox({ dark, children }) {
  return (
    <div style={{ background: dark ? '#0a0a0a' : '#f5f5f5', border: `1px solid ${dark ? '#222' : '#e0e0e0'}`, borderRadius: 10, padding: '12px 16px', fontSize: 12.5, lineHeight: 1.9, color: dark ? '#bbb' : '#333', marginTop: 8 }}>
      {children}
    </div>
  );
}

function BBlock({ children }) {
  return <div style={{ borderLeft: `4px solid ${OG}`, paddingLeft: 20, margin: '10px 0' }}>{children}</div>;
}

function W({ light, center, children }) {
  return (
    <div style={{ width: '100%', height: '100%', background: light ? '#fff' : DARK, color: light ? '#111' : '#fff', padding: '26px 38px', boxSizing: 'border-box', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: center ? 'center' : 'flex-start', justifyContent: center ? 'center' : 'flex-start' }}>
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDES
// ══════════════════════════════════════════════════════════════════════════

function S01() {
  return (
    <W center>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: OG, fontWeight: 700, marginBottom: 28, textTransform: 'uppercase' }}>Service Training · Case Study Session</div>
        <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.1, marginBottom: 16, background: `linear-gradient(135deg, #fff 50%, ${OG})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>규정과 판단 사이</div>
        <div style={{ fontSize: 18, color: '#888', marginBottom: 40 }}>우리는 현장에서 어떻게 결정하는가?</div>
        <div style={{ fontSize: 11, color: '#444', letterSpacing: 2, textTransform: 'uppercase' }}>Cabin Crew Service Case Study</div>
      </div>
    </W>
  );
}

function S02() {
  return (
    <W center>
      <div style={{ textAlign: 'center', padding: '0 40px' }}>
        <div style={{ fontSize: 26, fontWeight: 600, color: '#ddd', lineHeight: 1.9 }}>
          "일상 생활에서 다양한 이유로<br />정해진 절차대로 행동하지 못했던<br />경험이 있으신가요?"
        </div>
      </div>
    </W>
  );
}

function S03() {
  return (
    <W center>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#ccc', lineHeight: 1.6, marginBottom: 28 }}>
          약속 시간, 운전 중 신호, 대중교통 줄 서기
        </div>
        <div style={{ display: 'inline-block', background: `${OG}15`, border: `1px solid ${OG}44`, borderRadius: 10, padding: '16px 28px' }}>
          <div style={{ fontSize: 18, color: OG, fontWeight: 600, lineHeight: 1.7 }}>
            "원래대로" 하지 못한 경험은 누구에게나 있을 수 있습니다.
          </div>
        </div>
      </div>
    </W>
  );
}

function S04() {
  const reasons = [
    { icon: '⏰', text: '시간이 없어서' },
    { icon: '😴', text: '피곤해서' },
    { icon: '🤷', text: '"이번 한번쯤은" 괜찮겠다 싶어서' },
  ];
  return (
    <W center>
      <div style={{ textAlign: 'center', width: '100%' }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 36 }}>왜 그랬을까요?</div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          {reasons.map(r => (
            <div key={r.text} style={{ flex: 1, maxWidth: 200, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14, padding: '24px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{r.icon}</div>
              <div style={{ fontSize: 14, color: '#ddd', fontWeight: 600 }}>{r.text}</div>
            </div>
          ))}
        </div>
      </div>
    </W>
  );
}

function S05() {
  return (
    <W center>
      <div style={{ textAlign: 'center', padding: '0 20px' }}>
        <div style={{ fontSize: 22, color: '#ccc', marginBottom: 24, lineHeight: 1.8 }}>
          그렇다면,<br />
          <strong style={{ color: '#fff' }}>업무 상황에서 비슷한 경험이 있나요?</strong>
        </div>
        <div style={{ display: 'inline-block', background: `${OG}15`, border: `1px solid ${OG}50`, borderRadius: 10, padding: '14px 28px' }}>
          <span style={{ color: OG, fontSize: 18, fontWeight: 700 }}>= 기내에서, 우리는 어떻게 일하고 있을까.</span>
        </div>
      </div>
    </W>
  );
}

function S06() {
  const cards = [
    { icon: '👥', title: '인력', desc: '동료 승무원의 자리 비움 상황' },
    { icon: '🙋', title: '승객 응대', desc: '동시에 다수 승객의 서비스 요청 발생' },
    { icon: '⏱️', title: '타이밍', desc: '서비스 피크타임과 운항승무원 화장실 이용이 겹치는 상황' },
    { icon: '🔀', title: '우선 순위 혼란', desc: '심리적 부담으로 업무 순서의 혼란 발생' },
  ];
  return (
    <W>
      <div style={{ fontSize: 11, color: OG, letterSpacing: 2, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>Field Pressure</div>
      <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>현장에서의 압박 요소</div>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>업무를 수행하며 느끼는 물리적/심리적 부담감</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1 }}>
        {cards.map(c => (
          <div key={c.title} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{c.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{c.title}</div>
            <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>{c.desc}</div>
          </div>
        ))}
      </div>
    </W>
  );
}

function S07() {
  return (
    <W>
      <div style={{ fontSize: 14, color: '#ccc', marginBottom: 18, lineHeight: 1.6 }}>
        업무 상황에서 <strong style={{ color: '#fff' }}>조정이 가능한 부분</strong>인가? <strong style={{ color: '#fff' }}>불가능한 부분</strong>인가?
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1 }}>
        <div style={{ background: '#0a1a0a', border: '1px solid #1a3a1a', borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#4CAF50', marginBottom: 14 }}>조정 가능한 영역</div>
          {['상황/인력에 따른 서비스 순서 조정', '승무원 간 업무 분담', '기준 안에서의 재량적 허용'].map((t, i) =>
            <div key={i} style={{ fontSize: 12.5, color: '#9bc89b', lineHeight: 1.8, borderTop: i > 0 ? '1px solid #1a3a1a' : 'none', paddingTop: i > 0 ? 8 : 0, marginTop: i > 0 ? 8 : 0 }}>· {t}</div>
          )}
        </div>
        <div style={{ background: '#1a0a0a', border: '1px solid #3a1a1a', borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>❌</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#f44336', marginBottom: 14 }}>절대 조정 불가 영역</div>
          {['안전과 직결된 업무', '사람/상황에 따라 달라지면 안되는 매뉴얼 속 필수 준수 사항', '승객의 요청* (*규정 및 절차에 어긋나지 않는 요구)'].map((t, i) =>
            <div key={i} style={{ fontSize: 12.5, color: '#e89b9b', lineHeight: 1.8, borderTop: i > 0 ? '1px solid #3a1a1a' : 'none', paddingTop: i > 0 ? 8 : 0, marginTop: i > 0 ? 8 : 0 }}>· {t}</div>
          )}
        </div>
      </div>
    </W>
  );
}

function S08() {
  return (
    <W>
      <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 24 }}>규정과 <Hl>판단</Hl> 사이</div>
      <BBlock>
        <div style={{ fontSize: 14, color: '#ccc', lineHeight: 2.1 }}>
          매뉴얼은 분명히 존재하나, 현장은 늘 매뉴얼에 적힌대로만 수행되지 않습니다.<br />
          승객요청, 동료의 부재, 시간압박 등등 변수는 동시에 들어옵니다.<br /><br />
          그 순간, 우리는 무엇을 보고 무엇을 기준으로 <Hl>판단</Hl>할까요?
        </div>
      </BBlock>
    </W>
  );
}

function S09() {
  return (
    <W light>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#111', marginBottom: 6 }}>지금부터는 스스로 판단해 봅시다.</div>
      <div style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>우리가 현장에서 어떻게 일하고 있는지, 함께 이야기해보는 시간입니다.</div>
      <div style={{ background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 14, padding: '20px 24px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 12 }}>📋 활동 조 구성 안내</div>
        {[
          '01. 4~5인이 1개 조로 구성됩니다.',
          '02. 조별 대표로 1인이 QR코드로 접속합니다.',
          '03. 각각의 Case별로 질문에 답을 하고, 이야기를 나누어 주세요.',
          '04. 활동의 목적은 정답 찾기보다 우리 조라면 어떻게 했을지를 이야기해 주세요.',
        ].map((t, i) => <div key={i} style={{ fontSize: 13, color: '#444', lineHeight: 1.9, borderTop: i > 0 ? '1px solid #eee' : 'none', paddingTop: i > 0 ? 8 : 0, marginTop: i > 0 ? 8 : 0 }}>{t}</div>)}
      </div>
    </W>
  );
}

function S10() {
  return (
    <W center>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 10, letterSpacing: 4, color: OG, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' }}>Part 1</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginBottom: 14 }}>규정과 실제 근무 사이의 간극</div>
        <div style={{ width: 60, height: 3, background: OG, margin: '0 auto 20px' }} />
        <div style={{ fontSize: 15, color: '#888' }}>아래 상황, 우리 편조라면 어떻게 했을까요?</div>
      </div>
    </W>
  );
}

function S11() {
  return (
    <W light>
      <Badge t="CASE A — 기본" />
      <div style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 8 }}>난기류 상황인데, 지금 라면 드려도 될까요?</div>
      <div style={{ marginBottom: 6 }}>
        <LChip c="노선: 인천 → 도쿄 나리타 (2h 10min)" />
        <LChip c="탑승률 거의 만석 / 이륙 후 1시간 경과" />
        <LChip c="⚡ Seat Belt Sign On 상태" />
      </div>
      <SBox>
        <div>에어카페 Cart 서비스 중</div>
        <div>30C 승객의 신라면 주문에 뜨거운 물을 붓고 화상방지 Item을 꺼내던 찰나, Fasten Seat Belt Sign이 1회 점등되며, 난기류가 발생한다.</div>
        <Sp />
        <div><strong style={{ color: '#333' }}>승객(30C)</strong> <em>"저 에어카페 라면 주문한 것 좀 빨리 가져다 주세요. 배가 많이 고파서요."</em></div>
        <Sp />
        <div>기내는 난기류로 인해 다소 흔들리기 시작했고, 전방 승무원들도 착석 상태를 유지한 채 기내를 지켜보고 있다. 30C 승객은 짜증이 난 듯한 표정으로 After Galley를 주시하고 있다.</div>
      </SBox>
    </W>
  );
}

function S12() {
  return (
    <W light>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Badge t="CASE A 조별 토의" />
          <div style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>난기류 상황인데, 지금 라면 드려도 될까요?</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>CASE A — 조별 토의 · 7분</div>
        </div>
        <Timer totalSeconds={420} label="토의 시간" />
      </div>
      <QCard qs={[
        'Q1. 여러분이 생각하는 업무의 우선 순위는 무엇입니까?',
        'Q2. 만약 당신이 사무장이라면 어떻게 지시하겠습니까?',
        'Q3. 뜨거운 물을 부은 라면을 먼저 드리는 것은 허용 가능한 재량인가요, 조정 불가 영역인가요?',
        'Q4. 짜증 섞인 표정의 승객(30C)과 눈이 마주쳤을 때, 어떻게 손님을 안정시킬 건가요?',
        'Q5. 승객(30C)에게 라면을 제공할 때, 여러분의 첫 마디는 무엇인가요?',
      ]} />
      <QCard orange qs={[
        '💬 Q1. 다음 편에 같은 상황이 생기면 편조는 어떻게 움직여야 할까요?',
        '💬 Q2. 객실브리핑 시, 사전에 난기류 관련 서비스 운영 방식을 논의했다면 어떻게 달라졌을까요?',
      ]} />
    </W>
  );
}

function S13() {
  return (
    <W>
      <Badge t="CASE B — 심화" />
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>제 기내식 먼저 주시겠어요?</div>
      <div style={{ marginBottom: 6 }}>
        <Chip c="노선: 비엔티안 → 인천 (4h 50min)" />
        <Chip c="만석 / 사전 기내식 40ea" />
        <Chip c="에어카페 서비스 진행 중" />
      </div>
      <SBox dark>
        <div>에어카페 서비스 진행 중, 어린 아이를 동반한 3D의 승객이 조심스럽게 사무장을 찾는다.</div>
        <div><strong style={{ color: OG }}>승객(3D)</strong> <em>"저.. 혹시 예약한 기내식 좀 먼저 주시겠어요? 애가 계속 배고프다고 하고, 저희 시부모님도 아까 저녁 식사를 못하셔서요."</em></div>
        <Sp />
        <div>한편, 15A 승객이 손을 번쩍 들며 지나가던 FR 승무원을 부른다.</div>
        <div><strong style={{ color: OG }}>승객(15A)</strong> <em>"저 아까 맥주 한 캔 사먹었는데 (딸꾹), 똑같은 걸로 한 캔 더 주세요."</em></div>
        <div>승객의 얼굴은 붉어져 있으며, 딸꾹질이 멈추지 않는 등 취기가 상당히 느껴진다.</div>
      </SBox>
    </W>
  );
}

function S14() {
  return (
    <W>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>CASE B — 조별 토의 · 10분</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>제 기내식 먼저 주시겠어요?</div>
        </div>
        <Timer totalSeconds={600} label="토의 시간" />
      </div>
      <QCard dark qs={[
        'Q1. 여러분이 생각하는 업무의 우선 순위는 무엇입니까?',
        'Q2. 사전 기내식을 먼저 드리는 것은 허용 가능한 재량인가요, 조정 불가 영역인가요?',
        'Q3. 만약 사전 기내식을 우선 제공하는 모습을 보고, 다른 승객들이 제공 시점을 개별적으로 요청한다면 어떻게 대처하시겠어요?',
        'Q4. 만일, 승객(15A)이 맥주를 구입하지 못해서 화가 났다면 — FR 혼자 감당해야 할까요?',
        'Q5. 승객(15A)에게 주류 판매를 거절한다면, 여러분의 응대 멘트는 무엇인가요?',
      ]} />
      <QCard orange dark qs={[
        '💬 Q1. 승객(15A)이 하기 후 컴플레인을 넣겠다고 한다면 어떻게 대응하시겠어요?',
        '💬 Q2. 여러분이 생각하는 기내에서 해결 가능한 것과 불가능한 것의 경계는 무엇일까요?',
      ]} />
    </W>
  );
}

function S15() {
  return (
    <W light>
      <Badge t="CASE C — 종합" />
      <div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 8 }}>이 상황은 무엇이 먼저이고, 어디까지 해드릴 수 있을까요?</div>
      <div style={{ marginBottom: 6 }}>
        <LChip c="노선: 인천 → 싱가포르 (6h 10min)" />
        <LChip c="장거리 국제선 / 주간편" />
        <LChip c="🚪 Boarding 시점" />
      </div>
      <SBox>
        <div>Boarding 중, 객실사무장(이감귤)은 비즈니스 라이트 좌석 승객의 Welcome Greeting과 짐 정리에 분주하다.</div>
        <Sp />
        <div><strong style={{ color: '#333' }}>승객(1A)</strong> <em>"제 가방 그냥 바닥에 둬도 되죠? 안되면 가방 좀 위로 올려주세요"</em></div>
        <div><strong style={{ color: '#333' }}>승객(2D)</strong> <em>"저 배고파서 그런데, 신라면이랑 비빔밥 좀 먼저 살게요."</em></div>
        <div><strong style={{ color: '#333' }}>승객(3A)</strong> <em>"저 몸이 좀 안좋아서 그런데.. 기내에 약 있어요?"</em></div>
        <Sp />
        <div>이 때, 탑승권을 검사하던 FR 승무원이 손님이 탑승권을 잃어버렸다며, 다급하게 사무장을 찾는다.</div>
        <Sp />
        <div><strong style={{ color: '#333' }}>AR 승무원(강제코)</strong> <em>"사무장님, 24D 손님이 지난번에 비행기 탔을 때, 춥다고 하니 승무원이 담요를 빌려 주었다며, 이번에도 담요를 달라고 하시는데, 어떻게 할까요?"</em></div>
      </SBox>
    </W>
  );
}

function S16() {
  return (
    <W light>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>CASE C — 조별 토의 · 10분</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#111' }}>이 상황은 무엇이 먼저이고, 어디까지 해드릴 수 있을까요?</div>
        </div>
        <Timer totalSeconds={600} label="토의 시간" />
      </div>
      <QCard qs={[
        'Q1. 여러분이 생각하는 업무의 우선 순위는 무엇입니까?',
        'Q2. 만약 당신이 사무장이라면 어떻게 지시하겠습니까?',
        'Q3. 만일 승무원 간 업무를 분담했다면, 어떻게 나누었으며 기준은 무엇이었나요?',
        'Q4. 이 상황에서 객실사무장에게 보고하는 타이밍은 언제가 적절한가요?',
        'Q5. 승객(24D)에게 응급 담요를 드리는 것은 허용 가능한 재량인가요, 조정 불가 영역인가요?',
      ]} />
      <QCard orange qs={[
        "💬 Q1. 다수의 개별 요청 속에서 '잘 마무리된 서비스'로 만들려면 무엇이 필요할까요?",
        '💬 Q2. 편조원들과의 소통에서 효과적인 방법에는 어떤 것들이 있을까요?',
      ]} />
    </W>
  );
}

function S17() {
  const cases = [
    { label: 'Case A', q: '난기류 상황에서 승객을 응대하는 우선순위가 어떻게 달랐나요?' },
    { label: 'Case B', q: '각각의 상황에서 승객을 응대하는 첫 마디는 무엇이었나요?' },
    { label: 'Case C', q: '사무장의 지시가 조원들마다 상이했나요? 어떻게 달랐고, 왜 달랐는지 이야기해 주세요.' },
  ];
  return (
    <W light>
      <div style={{ fontSize: 11, color: OG, letterSpacing: 2, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>조별 발표 — 각 케이스 5분</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: '#111', marginBottom: 4 }}>다함께 이야기를 나눠봅시다.</div>
      <div style={{ fontSize: 13, color: '#777', marginBottom: 18 }}>각 조에서 나온 이야기 중 인상적이었던 것을 공유해 주세요.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {cases.map(c => (
          <div key={c.label} style={{ background: '#f8f8f8', border: '1px solid #e8e8e8', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1 }}>
            <div style={{ background: OG, color: '#fff', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>{c.label}</div>
            <div style={{ fontSize: 13, color: '#444', lineHeight: 1.7 }}>{c.q}</div>
          </div>
        ))}
      </div>
    </W>
  );
}

function S18() {
  return (
    <W>
      <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 24 }}>규정과 <Hl>판단</Hl> 사이</div>
      <BBlock>
        <div style={{ fontSize: 14, color: '#bbb', lineHeight: 2.1 }}>
          매뉴얼은 분명히 존재하나, 현장은 늘 매뉴얼에 적힌대로만 수행되지 않습니다.<br />
          하지만 지켜야 하는 매뉴얼을, 지켜야 할 시점에<br />
          시간이 없어서, 피곤해서, 편의를 위해서 등의 이유로 지키지 않으면
        </div>
        <Sp n={14} />
        <div style={{ fontSize: 16, color: OG, fontWeight: 700, lineHeight: 2 }}>
          손님은 온전한 서비스를 받을 수 없고,<br />
          내 동료는 혼란스러워 합니다.
        </div>
      </BBlock>
    </W>
  );
}

function S19() {
  return (
    <W>
      <div style={{ display: 'flex', gap: 28, alignItems: 'center', flex: 1 }}>
        <div style={{ flex: 1, background: '#1a1a1a', borderRadius: 16, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 8, alignSelf: 'stretch', justifyContent: 'center' }}>
          <div style={{ fontSize: 11, color: OG, letterSpacing: 1, fontWeight: 700 }}>INTERVIEW</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.5 }}>비행이 늘 긴장된다는<br />2년차 김제주 승무원</div>
          <div style={{ fontSize: 44, marginTop: 8 }}>✈️</div>
        </div>
        <div style={{ flex: 2 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: OG, marginBottom: 18 }}>WHY?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '12px 16px', fontSize: 14, color: '#ccc' }}>
              알고 있는 것과 현장이 다르게 흘러가서
            </div>
            <div style={{ background: `${OG}15`, border: `1px solid ${OG}50`, borderRadius: 10, padding: '12px 16px', fontSize: 14, color: OG, fontWeight: 600 }}>
              사람마다 다른 기준으로 비행을 해서
            </div>
          </div>
        </div>
      </div>
    </W>
  );
}

function S20() {
  const items = [
    'ICN-NRT', 'PAX 150명', '2시간 20분 소요 예정', '비즈니스 라이트 항공기',
    '사전기내식 13개로 1 Cart SVC', '에어카페 2 Cart SVC', '기내 면세 1 Cart SVC', '기상 악화로 회항 가능성 있음',
  ];
  return (
    <W>
      <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>오늘의 비행 브리핑</div>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 18 }}>김제주 승무원이 탑승한 편의 비행 개요</div>
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14, padding: '20px 24px', flex: 1 }}>
        <div style={{ fontSize: 11, color: OG, letterSpacing: 2, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' }}>브리핑 내용</div>
        {items.map((t, i) => (
          <div key={i} style={{ fontSize: 13, color: i === items.length - 1 ? '#ffaa55' : '#ccc', lineHeight: 1.9, borderTop: i > 0 ? '1px solid #222' : 'none', paddingTop: i > 0 ? 6 : 0, marginTop: i > 0 ? 6 : 0, fontWeight: i === items.length - 1 ? 600 : 400 }}>
            {i === items.length - 1 ? '⚠️ ' : '· '}{t}
          </div>
        ))}
      </div>
    </W>
  );
}

function S21() {
  return (
    <W center>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎬</div>
        <div style={{ fontSize: 30, fontWeight: 900, color: '#fff', marginBottom: 10 }}>영상 시청</div>
        <div style={{ fontSize: 15, color: '#999', marginBottom: 28 }}>김제주 승무원을 혼란스럽게 만든 이유를 함께 찾아봅시다.</div>
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '14px 24px', fontSize: 13, color: '#aaa' }}>
          영상을 시청한 후, 장면별로 무엇이 문제였는지 함께 이야기해보겠습니다.
        </div>
      </div>
    </W>
  );
}

function S22() {
  const scenes = [
    { icon: '🚪', label: 'SCENE 1', desc: '보딩 중 좌석 변경' },
    { icon: '🍱', label: 'SCENE 2', desc: '사전기내식 서비스' },
    { icon: '🛍️', label: 'SCENE 3', desc: '기내 면세 서비스' },
    { icon: '🚨', label: 'SCENE 4', desc: '비정상 상황 방송' },
  ];
  return (
    <W>
      <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>영상 속 장면을 떠올려보세요</div>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>ICN-NRT 비행에서 김제주 승무원이 목격한 장면들</div>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 18 }}>아래 장면 카드를 참고해 어떤 점이 문제였는지 직접 찾아보세요. 찾은 후 [정답 확인] 버튼을 눌러 함께 확인합니다.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1 }}>
        {scenes.map(s => (
          <div key={s.label} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 30 }}>{s.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: OG }}>{s.label}</div>
            <div style={{ fontSize: 14, color: '#ddd', fontWeight: 600 }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </W>
  );
}

function S23() {
  return (
    <W light>
      <div style={{ fontSize: 13, fontWeight: 700, color: OG, marginBottom: 6 }}>SCENE 1 🚪</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 10 }}>도어 클로즈 1분 전, 이 장면 — 무엇이 문제인가요?</div>
      <SBox>
        <div>도어 클로즈까지 1분이 채 남지 않았다. 운송직원은 이미 보이지 않는 상태.</div>
        <Sp />
        <div>사무장이 Aisle에서 승객에게 말하고 있다.</div>
        <div><strong style={{ color: '#333' }}>사무장</strong> <em>"이번만 해드리는 거예요~ 자리 바꾸셔도 됩니다!"</em></div>
      </SBox>
      <Reveal btn="✏️ 문제점을 찾아보셨나요?" variant="red">
        <div><strong>✅ 지켜야 할 규정 — 승객 탑승 중 좌석 관련 문의 발생시 처리 절차</strong></div>
        <Sp />
        <div>1) 승객 문의 시 상황 경청 및 요청 내용에 대한 확인</div>
        <div>2) 좌석 관련 문의는(일행 간 좌석 변경, 단순 변경, 좌석 환불 등)<br />&nbsp;&nbsp;&nbsp;<strong style={{ color: '#ff4444' }}>승무원 단독 판단으로 허용 또는 제한하지 않음</strong> ← 🔴 위반</div>
        <div>3) 즉시 사무장 및 운송직원과 공유하여 판단 진행함</div>
        <div>4) 운송직원 공유 후 처리 진행 시 결과 또는 진행 상황을 승객에게 재안내</div>
        <div>5) 응대 종료 전 추가 문의 여부 확인 및 상황 종료까지 응대 수행</div>
        <Sp />
        <div style={{ color: '#ffaa88' }}>→ 좌석 배정 및 이동은 항공기 탑재 및 처리 교범(GOM) 기준 적용 사항으로, 관련 규정에 대한 정확한 판단이 요구됨</div>
      </Reveal>
    </W>
  );
}

function S24() {
  return (
    <W>
      <div style={{ fontSize: 13, fontWeight: 700, color: OG, marginBottom: 6 }}>SCENE 2 🍱</div>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>이 서비스, 몇 가지나 문제가 있었나요?</div>
      <SBox dark>
        <div>① 카트 없이 개별 트레이로 진행</div>
        <div style={{ color: '#777', marginLeft: 14 }}>선임 "난기류도 없으니까 그냥 들고 나가자"</div>
        <div style={{ marginTop: 6 }}>② 한국어 방송만 끝나자마자 바로 시작</div>
        <div style={{ color: '#777', marginLeft: 14 }}>선임 "새벽이니까 얼른 끝내자"</div>
        <div style={{ marginTop: 6 }}>③ 선임 FR이 신입에게</div>
        <div style={{ color: '#777', marginLeft: 14 }}>선임 "2인 1조 안 해도 돼, 그냥 혼자 나가"</div>
        <div style={{ marginTop: 6 }}>④ 갤리 브리핑 없이 바로 시작</div>
        <Sp n={10} />
        <div style={{ color: OG }}>💭 김제주의 생각: "다들 이렇게 하는 건가? 내가 배운 것들이랑 너무 다른데..."</div>
      </SBox>
      <Reveal btn="✏️ 몇 가지 위반인지 찾아보셨나요?" variant="red">
        <div>✅ <strong>CSM 5.4.2.4 사전 기내식 준비 및 세팅</strong></div>
        <div>🔴 ① 카트 미사용 — 사전 기내식 예약 개수가 10개를 초과할 경우 반드시 Half Cart 또는 Full Cart를 이용하여 서비스를 진행해야 한다.<br /><span style={{ color: '#ffaa88' }}>&nbsp;&nbsp;&nbsp;(단, 난기류 발생 시 Individual 서비스 가능 — 이 편은 난기류 없었음)</span></div>
        <Sp />
        <div>✅ <strong>CSM 4.4 일반 서비스 운영</strong></div>
        <div>🔴 ② 외국어 방송 생략 — 모든 서비스는 기내 방송이 끝난 후 진행. 국제선의 경우 제2외국어 방송 종료 후. 새벽이라는 이유 불가.</div>
        <Sp />
        <div>✅ <strong>CSM 5.4.3.1 사전 기내식 서비스 절차</strong></div>
        <div>🔴 ③ 2인 1조 위반 — 사전 기내식 서비스는 Individual 및 Cart 서비스 구분 없이 2인 1조로 진행한다.</div>
        <Sp />
        <div>✅ <strong>CSM 5.4.2.5 갤리 브리핑</strong></div>
        <div>🔴 ④ 갤리 브리핑 미실시 — 사전 기내식 서비스 전 기내식 특이사항을 예방하기 위하여 GLY별로 구분하여 브리핑을 실시한다.</div>
      </Reveal>
    </W>
  );
}

function S25() {
  return (
    <W light>
      <div style={{ fontSize: 13, fontWeight: 700, color: OG, marginBottom: 6 }}>SCENE 3 🛍️</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 10 }}>기내 면세 서비스에서 빠진 것이 있었나요?</div>
      <SBox>
        <div>① DP가 부두티로 알고 있는데...</div>
        <div style={{ color: '#555', marginLeft: 14 }}>AL "사무장님, 저 OOO님이랑 같이 할게요" → 확인 없이 그냥 진행</div>
        <div style={{ marginTop: 6 }}>② 탑승권 확인 없이 결제 처리</div>
        <div style={{ color: '#555', marginLeft: 14 }}>AL "손님, 명의 카드 맞으시죠?" → 탑승권 확인 없이 바로 결제</div>
        <div style={{ marginTop: 6 }}>③ 100ml 액체류 구매 승객에게 환승 여부를 묻지 않고 판매 완료</div>
        <Sp />
        <div style={{ color: OG }}>💭 김제주의 생각: "다들 바빠서 그런 건지... 이렇게 해도 되는 건지 모르겠어."</div>
      </SBox>
      <Reveal btn="✏️ 빠진 절차를 찾아보셨나요?" variant="orange">
        <div>✅ <strong>CSM 5.3.3 기내 면세 서비스</strong></div>
        <div>🟠 ① 듀티 미확인 — 1 Cart 서비스 시 '기내 면세 정'은 PDA를 조작한다. 서비스 전 담당 듀티 확인은 기본 절차</div>
        <Sp />
        <div>✅ <strong>CSM 5.3.3.1 기내 면세 Cart 서비스 절차 / 26년 6월 기내 면세 운영안</strong></div>
        <div>🟠 ② 탑승권 미확인 — 신용카드 결제 시 본인 명의 확인을 위해 탑승권(PM) 확인 필수. 신용카드 결제 시 사용 가능/불가 카드 여부 육안으로 1차 확인 실시</div>
        <Sp />
        <div>✅ <strong>CSM 5.3.3.5 환승객 젤/액체류 면세품 구매 규정</strong></div>
        <div>🟠 ③ 액체류 환승 확인 누락 — 환승객이 100ml 이상의 젤/액체류 면세품을 구입한 경우 STEB 처리 필요. 사용 가능 국가: 일본(NRT/KIX/NGO만) 가능</div>
      </Reveal>
    </W>
  );
}

function S26() {
  return (
    <W>
      <div style={{ fontSize: 13, fontWeight: 700, color: OG, marginBottom: 6 }}>SCENE 4 🚨</div>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>회항 결정 — 방송을 AL에게 위임한 이 상황, 맞나요?</div>
      <SBox dark>
        <div>기장으로부터 회항 결정이 통보되었다.</div>
        <Sp />
        <div><strong style={{ color: OG }}>사무장</strong> <em>"방송 등급이 높으니까 네가 해줘."</em></div>
        <div><strong style={{ color: '#ccc' }}>AL</strong> <em>"...네?"</em></div>
        <Sp />
        <div>이후 15분이 지나도록 추가 방송 없음. 승객들이 술렁이기 시작했다.</div>
        <Sp />
        <div><strong style={{ color: OG }}>사무장</strong> <em>"기장님이 정보를 안 주시네. 정확한 정보로 해주세요."</em></div>
        <Sp />
        <div style={{ color: OG }}>💭 김제주의 생각: "방송 등급이 높으면 AL이 해야 하는 건가? 회항인데 방송이 이렇게 늦어도 되는 건가?"</div>
      </SBox>
      <Reveal btn="✏️ 위반 포인트를 찾아보셨나요?" variant="red">
        <div>✅ <strong>CAM 1.4.2 기내 방송 역할과 책임</strong></div>
        <div>🔴 ① 비정상 상황 방송 위임 오류 — 사무장은 비정상 상황 발생 시 운항승무원, 운송직원과 소통을 기반으로 상황에 맞는 기내 방송을 신속하게 실시한다.</div>
        <div style={{ color: '#ffaa88' }}>&nbsp;&nbsp;&nbsp;방송을 위임할 경우 — 사유 및 방송 문안을 정확히 안내하여 방송하도록 지시해야 함</div>
        <div style={{ color: '#ffaa88' }}>&nbsp;&nbsp;&nbsp;단순히 "방송 등급이 높다"는 이유로 위임 불가</div>
        <Sp />
        <div>✅ <strong>CAM 1.4.4 비정상 상황 방송 기준</strong></div>
        <div>🔴 ② 10분 방송 규정 위반 — 기장이 기내 방송을 최초 실시한 이후, 객실에서 매 10분 간격으로 추가방송을 실시한다.</div>
        <div style={{ color: '#ffaa88' }}>&nbsp;&nbsp;&nbsp;15분 경과 후에도 추가 방송 없음 — 명백한 위반</div>
        <div style={{ color: '#ffaa88' }}>&nbsp;&nbsp;&nbsp;"기장이 정보를 안 준다"는 지연의 이유가 될 수 없다</div>
      </Reveal>
    </W>
  );
}

function S27() {
  return (
    <W>
      <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 24 }}>규정과 <Hl>판단</Hl> 사이</div>
      <BBlock>
        <div style={{ fontSize: 14, color: '#bbb', lineHeight: 2.1 }}>
          <Hl>지켜야 하는 매뉴얼을, 지켜야 할 시점에</Hl><br />
          시간이 없어서, 피곤해서, 편의를 위해서 등의 이유로 지키지 않으면
        </div>
        <Sp n={14} />
        <div style={{ fontSize: 16, color: OG, fontWeight: 700, lineHeight: 2 }}>
          손님은 온전한 서비스를 받을 수 없고,<br />
          내 동료는 혼란스러워 합니다.
        </div>
        <Sp n={14} />
        <div style={{ fontSize: 14, color: '#bbb', lineHeight: 2 }}>
          규정과 다른 비행들이 모여 문화가 되지 않도록,<br />
          비행을 하는 사람에 따라 다른 규정이 적용되지 않도록
        </div>
      </BBlock>
    </W>
  );
}

function S28() {
  return (
    <W center>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.9 }}>
          "매뉴얼은 준수해 주시고,<br />
          매뉴얼 안에서 상황에 맞게<br />
          유연하게 대처해 주세요 🙏"
        </div>
        <div style={{ width: 80, height: 2, background: '#2a2a2a', margin: '28px auto' }} />
        <div style={{ fontSize: 14, color: '#666', lineHeight: 1.9 }}>
          오후 세션에서 오늘 이야기한 것들이 다른 언어로 다시 등장합니다.<br />
          그때 연결해보세요. 🔗
        </div>
      </div>
    </W>
  );
}

// ── Slide Registry ─────────────────────────────────────────────────────────
const SLIDES = [S01,S02,S03,S04,S05,S06,S07,S08,S09,S10,S11,S12,S13,S14,S15,S16,S17,S18,S19,S20,S21,S22,S23,S24,S25,S26,S27,S28];
const TOTAL = SLIDES.length;

const SEGMENTS = [
  { label: 'INTRO', start: 0, end: 8, color: '#FF6600' },
  { label: 'PART 1', start: 9, end: 16, color: '#DD4400' },
  { label: '브릿지 · 영상', start: 17, end: 20, color: '#773300' },
  { label: 'PART 3', start: 21, end: 25, color: '#FF8833' },
  { label: '클로징', start: 26, end: 27, color: '#FFAA55' },
];

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [cur, setCur] = useState(0);

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') setCur(c => Math.min(TOTAL - 1, c + 1));
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   setCur(c => Math.max(0, c - 1));
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const SlideComp = SLIDES[cur];
  const currentSeg = SEGMENTS.find(s => cur >= s.start && cur <= s.end);

  return (
    <div style={{ background: APP_BG, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box', fontFamily: "'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif" }}>

      {/* Slide */}
      <div style={{ width: '100%', maxWidth: 960, position: 'relative' }}>
        <div style={{ width: '100%', aspectRatio: '16/9', position: 'relative', borderRadius: 4, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
          <SlideComp key={cur} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, background: OG, zIndex: 10 }} />
        </div>
        <div style={{ position: 'absolute', top: 10, right: 14, background: 'rgba(0,0,0,0.65)', color: '#555', fontSize: 11, padding: '3px 8px', borderRadius: 4, zIndex: 20, letterSpacing: 1 }}>
          {cur + 1} / {TOTAL}
        </div>
        {currentSeg && (
          <div style={{ position: 'absolute', top: 10, left: 14, background: `${currentSeg.color}22`, border: `1px solid ${currentSeg.color}66`, color: currentSeg.color, fontSize: 10, padding: '3px 10px', borderRadius: 4, zIndex: 20, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
            {currentSeg.label}
          </div>
        )}
      </div>

      {/* Nav buttons + dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
        <button onClick={() => setCur(c => Math.max(0, c - 1))} disabled={cur === 0}
          style={{ background: cur === 0 ? '#1a1a1a' : '#2a2a2a', border: '1px solid #333', color: cur === 0 ? '#333' : '#ccc', borderRadius: 8, width: 36, height: 36, cursor: cur === 0 ? 'default' : 'pointer', fontSize: 14 }}>◀</button>

        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {SLIDES.map((_, i) => {
            const seg = SEGMENTS.find(s => i >= s.start && i <= s.end);
            const active = i === cur;
            return (
              <div key={i} onClick={() => setCur(i)} title={`슬라이드 ${i + 1}`}
                style={{ width: active ? 18 : 6, height: 6, borderRadius: 3, background: active ? (seg?.color || OG) : '#252525', cursor: 'pointer', transition: 'all 0.25s', border: active ? 'none' : '1px solid #333' }} />
            );
          })}
        </div>

        <button onClick={() => setCur(c => Math.min(TOTAL - 1, c + 1))} disabled={cur === TOTAL - 1}
          style={{ background: cur === TOTAL - 1 ? '#1a1a1a' : '#2a2a2a', border: '1px solid #333', color: cur === TOTAL - 1 ? '#333' : '#ccc', borderRadius: 8, width: 36, height: 36, cursor: cur === TOTAL - 1 ? 'default' : 'pointer', fontSize: 14 }}>▶</button>
      </div>

      {/* Timeline */}
      <div style={{ width: '100%', maxWidth: 960, marginTop: 10, display: 'flex', gap: 3 }}>
        {SEGMENTS.map(seg => {
          const count = seg.end - seg.start + 1;
          const isActive = cur >= seg.start && cur <= seg.end;
          const progress = isActive ? (cur - seg.start + 1) / count : (cur > seg.end ? 1 : 0);
          return (
            <div key={seg.label} style={{ flex: count, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: seg.color, opacity: cur > seg.end ? 0.9 : 0.2 }} />
                {isActive && <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${progress * 100}%`, background: seg.color, transition: 'width 0.3s' }} />}
              </div>
              <div style={{ fontSize: 9, color: isActive ? seg.color : '#333', fontWeight: isActive ? 700 : 400, letterSpacing: 0.5, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {seg.label}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
