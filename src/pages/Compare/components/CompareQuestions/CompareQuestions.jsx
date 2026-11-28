import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FINDER_CAMERAS,
  getComposition,
  getGridState,
  getTrio,
} from '@/pages/Compare/data/compareFinderCameras.js';
import RulerCard from './RulerCard.jsx';
import styles from './CompareQuestions.module.css';

/*
 * 카메라 모션 — Vitra 의자 고르기 화면을 영상으로 보고 맞춘 값이다. (시안에 모션 수치가 없어서 임시값이다)
 * 선택이 바뀌면 ① 카메라들이 아주 빠르게 가운데로 모이고 ② 새 자리로 퍼지며 감속해서 자리 잡는다. 돌지 않는다.
 * 어울리는 카메라 3대는 큰 자리로 퍼진다.
 */
const GATHER_DURATION = 170; // ① 가운데로 모이는 시간(ms) — 빠르다
const SPREAD_DURATION = 720; // ② 새 자리로 퍼지는 시간(ms) — 처음엔 빠르고 끝으로 갈수록 느려진다
const STAGGER = 110; // 카메라마다 퍼지기 시작하는 시간이 어긋나는 최대 시간(ms)
const GATHER_SCALE = 0.5; // 가운데로 모였을 때의 크기 비율
const SPREAD_FROM_SCALE = 0.45; // 가운데에서 퍼지기 시작할 때의 크기 비율
const CLUSTER_RADIUS = [50, 170]; // 모이는 지점이 가운데에서 흩어지는 거리(시안 px) — 한 점이 아니라 뭉치로 모인다
const ENTRY_DELAY = 500; // 질문 화면이 열리고 첫 모션이 시작하기까지
const SETTLE_DELAY = 160; // 눈금을 움직이다 멈춘 뒤 카메라가 반응하기까지 (드래그 중 계속 움직이는 것을 막는다)
const COUNTER_HOLD = 1100; // 질문 번호(1 / 3)를 보여 주는 시간(ms) — 시안에 시간이 없는 임시값
const CENTER = { x: 960, y: 500 }; // 카메라가 모이는 중심 (1920 x 1080 화면의 가운데 위쪽)

const easeIn = (t) => t * t * t;
const easeOut = (t) => 1 - (1 - t) ** 4;
const lerp = (a, b, t) => a + (b - a) * t;

/** 카메라마다 정해 두는 모이는 지점 (가운데 둘레의 뭉치 안) */
const clusterPoint = (order) => {
  const angle = order * 2.399963; // 황금각: 고르게 흩어진다
  const radius = lerp(CLUSTER_RADIUS[0], CLUSTER_RADIUS[1], (order * 0.6180339887) % 1);
  return { cx: CENTER.x + Math.cos(angle) * radius, cy: CENTER.y + Math.sin(angle) * radius };
};

/** 지금 자리(from) → 가운데 뭉치 → 새 자리(to). time 은 이 카메라의 모션이 시작된 뒤 흐른 시간(ms) */
function move(from, to, cluster, time) {
  if (time < GATHER_DURATION) {
    const e = easeIn(Math.max(0, time) / GATHER_DURATION);
    return {
      cx: lerp(from.cx, cluster.cx, e),
      cy: lerp(from.cy, cluster.cy, e),
      size: lerp(from.size, from.size * GATHER_SCALE, e),
      op: from.op,
      z: to.z,
    };
  }
  const e = easeOut(Math.min(1, (time - GATHER_DURATION) / SPREAD_DURATION));
  return {
    cx: lerp(cluster.cx, to.cx, e),
    cy: lerp(cluster.cy, to.cy, e),
    size: lerp(to.size * SPREAD_FROM_SCALE, to.size, e),
    op: lerp(from.op * GATHER_SCALE, to.op, Math.min(1, e * 2)), // 퍼지는 초반에 빠르게 나타난다
    z: to.z,
  };
}

/**
 * Compare 질문 화면 (Figma 3510:654) — 카메라가 배경에 깔리고 아래에 눈금 카드가 있다.
 * 눈금을 좌우로 끌면 가운데 검은 선 위의 문구가 선택지로 바뀌고, 그 선택에 어울리는 카메라 3대가 가운데에 크게 모인다. (카메라는 가운데로 확 모였다가 새 자리로 퍼진다)
 * 단, 첫 질문에 답하기 전까지는 카메라가 격자로 그대로 멈춰 있고, 첫 질문에 답한 뒤부터 3대 추천 모양으로 바뀐다.
 * 질문이 열릴 때마다(맨 처음 질문 제외 — 첫 질문은 번호 없이 눈금 카드가 아래에서 올라온다) 먼저 눈금 카드 자리에 질문 번호 "1 / 3" 이 잠깐 나온다 (Figma 3537:838). 그동안 카메라는 그 질문에 어울리는 배치로 모여 있고, 번호가 사라지면 눈금 카드가 나타난다.
 * 질문은 compareSteps.js 의 STEP 1~3 을 한 장씩 보여 준다. ">" 로 선택을 확정하고 다음 질문(마지막이면 결과)으로, "<" 로 이전 질문으로 간다.
 */
export default function CompareQuestions({ steps, answers, stepIndex, locked = false, onChoose, onBack }) {
  const step = steps[stepIndex];
  const answeredIndex = Math.max(0, step.options.findIndex((option) => option.id === answers[step.id]));
  // 눈금을 움직이는 동안의 선택지. 질문이 바뀌면 이전에 답한 선택지(없으면 첫 번째)에서 다시 시작한다.
  const [preview, setPreview] = useState({ stepId: step.id, index: answeredIndex });
  const index = preview.stepId === step.id ? preview.index : answeredIndex;
  const [touchedStep, setTouchedStep] = useState(null); // 눈금을 움직여 본 질문
  const setIndex = (next) => {
    setPreview({ stepId: step.id, index: next });
    setTouchedStep(step.id);
  };

  // 눈금이 멈춘 뒤에야 카메라가 반응한다
  const [settled, setSettled] = useState({ stepId: step.id, index });
  useEffect(() => {
    const timer = setTimeout(() => setSettled({ stepId: step.id, index }), SETTLE_DELAY);
    return () => clearTimeout(timer);
  }, [step.id, index]);

  // 질문이 열리면 질문 번호를 잠깐 보여 준다. 번호를 보여 준 질문의 id 를 기억해 두고, 다른 질문이 열리면 다시 보여 준다.
  // 카메라는 번호가 보이는 동안에도 이 질문의 첫 선택지에 어울리는 배치로 한 번만 움직인다. (번호 때문에 다시 모였다 퍼지지 않는다)
  // 맨 처음 질문은 번호 없이 바로 질문부터 보여 주고, 눈금 카드가 아래에서 올라온다.
  const firstStepId = useRef(step.id);
  const [counted, setCounted] = useState(step.id);
  const rise = useRef(true); // 첫 질문의 카드가 올라오는 모션 — 다음 질문으로 간 뒤에는 쓰지 않는다
  useEffect(() => {
    if (stepIndex > 0) rise.current = false;
  }, [stepIndex]);
  const counting = counted !== step.id;
  useEffect(() => {
    const timer = setTimeout(() => setCounted(step.id), COUNTER_HOLD);
    return () => clearTimeout(timer);
  }, [step.id]);

  const option = step.options[Math.min(settled.stepId === step.id ? settled.index : index, step.options.length - 1)];
  // 카메라는 첫 질문에 답하기 전까지는 격자로 그대로 멈춰 있고(trio 가 null), 첫 질문에 답한 뒤부터 어울리는 3대를 추천하는 모양으로 바뀐다.
  // - 첫 질문: 아직 답하지 않았으면 눈금을 움직여도 카메라는 가만히 있다. (되돌아와서 이미 답한 상태면 지금 가리키는 선택지를 따라간다)
  // - 둘째 질문부터: 처음엔 앞에서 답한 선택에 어울리는 3대를 보여 주고, 눈금을 움직이면 가리키는 선택지에 맞춰 바뀐다.
  const ruleOf = (stepId, picked) => getTrio(stepId, picked.ruleId ?? picked.id);
  const trio = useMemo(() => {
    if (stepIndex === 0) return answers[step.id] ? ruleOf(step.id, option) : null;
    if (touchedStep === step.id) return ruleOf(step.id, option);
    for (let k = stepIndex - 1; k >= 0; k -= 1) {
      const earlier = steps[k].options.find((candidate) => candidate.id === answers[steps[k].id]);
      if (earlier) return ruleOf(steps[k].id, earlier);
    }
    return ruleOf(step.id, option);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, step.id, option.ruleId, option.id, touchedStep, answers]);
  const trioKey = trio ? trio.join('|') : 'grid';

  // ---- 카메라 모션 ----
  const cameraRefs = useRef({});
  const current = useRef(getGridState()); // 지금 화면에 그려진 각 카메라의 상태
  const frame = useRef(0);
  const started = useRef(false);

  const paint = (id, state) => {
    const el = cameraRefs.current[id];
    if (!el) return;
    el.style.setProperty('--cx', state.cx.toFixed(1));
    el.style.setProperty('--cy', state.cy.toFixed(1));
    el.style.setProperty('--size', state.size.toFixed(1));
    el.style.setProperty('--op', state.op.toFixed(3));
    el.style.zIndex = String(state.z);
  };

  useEffect(() => {
    const targets = trio ? getComposition(trio) : getGridState();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    cancelAnimationFrame(frame.current);
    if (reduce) {
      FINDER_CAMERAS.forEach((camera) => {
        current.current[camera.id] = targets[camera.id];
        paint(camera.id, targets[camera.id]);
      });
      started.current = true;
      return undefined;
    }
    const from = Object.fromEntries(FINDER_CAMERAS.map((camera) => [camera.id, { ...current.current[camera.id] }]));
    const delay = started.current ? 0 : ENTRY_DELAY;
    const t0 = performance.now() + delay;
    const clusters = FINDER_CAMERAS.map((camera, order) => clusterPoint(order));
    started.current = true;
    const tick = (now) => {
      let running = false;
      FINDER_CAMERAS.forEach((camera, order) => {
        const wait = ((order * 0.6180339887) % 1) * STAGGER;
        const time = now - t0;
        const own = time - (time > GATHER_DURATION ? wait : 0); // 모이는 건 다 같이, 퍼지는 건 조금씩 어긋나게
        if (own < GATHER_DURATION + SPREAD_DURATION) running = true;
        const state =
          time <= 0 ? from[camera.id] : own >= GATHER_DURATION + SPREAD_DURATION ? targets[camera.id] : move(from[camera.id], targets[camera.id], clusters[order], own);
        current.current[camera.id] = state;
        paint(camera.id, state);
      });
      if (running) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
    // trio 가 바뀔 때만 다시 돈다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trioKey]);

  const grid = useMemo(() => getGridState(), []);

  return (
    <section className={styles.questions} aria-label="카메라 찾기 질문">
      <div className={styles.scene} aria-hidden="true">
        <div className={styles.stage}>
          {FINDER_CAMERAS.map((camera) => (
            <img
              key={camera.id}
              ref={(el) => {
                cameraRefs.current[camera.id] = el;
              }}
              className={styles.camera}
              src={camera.src}
              alt=""
              draggable="false"
              style={{
                '--cx': grid[camera.id].cx,
                '--cy': grid[camera.id].cy,
                '--size': grid[camera.id].size,
                '--op': grid[camera.id].op,
              }}
            />
          ))}
        </div>
      </div>
      {counting ? (
        <div className={`${styles.card} ${styles.counterCard}`} key={`count-${step.id}`} role="status" aria-label={`질문 ${stepIndex + 1} / ${steps.length}`}>
          <div className={styles.counterGroup} aria-hidden="true">
            <span className={styles.counterNow}>{stepIndex + 1}</span>
            <span className={styles.counterSlashBox}>
              <span className={styles.counterSlash}>/</span>
            </span>
            <span className={styles.counterTotal}>{steps.length}</span>
          </div>
        </div>
      ) : (
      <RulerCard
        key={step.id}
        title={step.question}
        options={step.options}
        index={index}
        onIndexChange={setIndex}
        canGoBack={stepIndex > 0}
        locked={locked}
        onBack={onBack}
        onConfirm={() => onChoose(step.id, step.options[index].id)}
        isLast={stepIndex === steps.length - 1}
        rise={rise.current && step.id === firstStepId.current}
      />
      )}
    </section>
  );
}
