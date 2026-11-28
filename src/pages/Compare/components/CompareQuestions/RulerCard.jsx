import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import styles from './CompareQuestions.module.css';

/* 눈금 카드 치수(Figma 3510:654, 시안 px) */
const CARD_WIDTH = 693;
const STEP_SPACING = 128; // 선택지 사이 간격 (큰 눈금 사이)
const MINOR_PER_STEP = 9; // 큰 눈금 사이를 나누는 칸 수
const EDGE_STEPS = 2; // 첫·마지막 선택지 바깥으로 눈금을 이어 그리는 간격 수
const DRAG_THRESHOLD = 4; // 이만큼(px) 이상 움직여야 드래그로 본다

/* 눈금 움직임 (Vitra 타임라인 눈금 참고) — 임시값, 느낌 보면서 조절 */
const FOLLOW_DRAG_MS = 70; // 끄는 동안 손가락을 따라오는 지연(작을수록 딱 붙는다)
const FOLLOW_SNAP_MS = 130; // 놓았을 때 가까운 선택지로 미끄러져 멈추는 시간 상수
const SPEED_FULL = 2; // 이 속도(선택지/초)면 눈금이 가장 높게 솟는다
const ENERGY_RELEASE_MS = 240; // 멈춘 뒤 솟은 눈금이 가라앉는 시간 상수
const LIFT_RANGE = 0.5; // 검은 선 뒤쪽으로 눈금이 솟는 범위(선택지 단위, 눈금 약 5개)
const LABEL_RANGE = 0.6; // 문구가 커지기 시작하는 거리(선택지 단위)

function Chevron({ direction }) {
  return (
    <svg className={styles.chevron} viewBox="0 0 12 22" focusable="false" aria-hidden="true">
      <path d={direction === 'left' ? 'M10 1.5 1.5 11 10 20.5' : 'M2 1.5 10.5 11 2 20.5'} />
    </svg>
  );
}

/**
 * 눈금 카드 — 좌우 화살표 + 질문 제목 + 끌어서 고르는 눈금.
 * 눈금(큰 눈금 = 선택지)을 좌우로 끌면 가운데 검은 선에 가장 가까운 선택지가 골라지고, 놓으면 그 자리에 딱 맞게 멈춘다.
 * 선택은 ">" 로 확정한다. 키보드는 눈금에 포커스를 두고 ← → 로 고른다.
 */
export default function RulerCard({ title, options, index, onIndexChange, canGoBack, locked, onBack, onConfirm, isLast, rise = false }) {
  const rulerRef = useRef(null);
  const drag = useRef(null);
  const trackRef = useRef(null);
  const ticks = useRef(new Map()); // 작은 눈금 { el, at }
  const labels = useRef(new Map()); // 선택지 문구 { el, at }
  const motion = useRef({ target: index, current: index, energy: 0, direction: 1, frame: 0, time: 0, dragging: false });
  const [dragging, setDragging] = useState(false);
  const last = options.length - 1;

  /* 프레임마다: 눈금판을 손가락 쪽으로 부드럽게 끌어오고, 움직이는 속도만큼 검은 선 뒤쪽 눈금을 솟게 하고, 가까운 문구를 키운다 */
  const render = useCallback(() => {
    const m = motion.current;
    trackRef.current?.style.setProperty('--pos', m.current.toFixed(4));
    ticks.current.forEach(({ el, at }) => {
      const behind = (m.current - at) * m.direction; // 눈금이 검은 선을 지나 간 쪽이 양수
      const lift = m.energy > 0.004 && behind > 0 && behind < LIFT_RANGE ? m.energy * (1 - behind / LIFT_RANGE) ** 1.4 : 0;
      el.style.setProperty('--lift', lift.toFixed(3));
    });
    labels.current.forEach(({ el, at }) => {
      const t = Math.max(0, 1 - Math.abs(at - m.current) / LABEL_RANGE);
      el.style.setProperty('--near', (t * t * (3 - 2 * t)).toFixed(3));
    });
  }, []);

  const step = useCallback(
    (now) => {
      const m = motion.current;
      const dt = Math.min(64, now - (m.time || now));
      m.time = now;
      const before = m.current;
      const follow = m.dragging ? FOLLOW_DRAG_MS : FOLLOW_SNAP_MS;
      m.current += (m.target - m.current) * (1 - Math.exp(-dt / follow));
      if (Math.abs(m.target - m.current) < 0.0005) m.current = m.target;
      const speed = dt > 0 ? Math.abs(m.current - before) / (dt / 1000) : 0;
      const want = Math.min(1, speed / SPEED_FULL);
      m.energy = want > m.energy ? want : m.energy * Math.exp(-dt / ENERGY_RELEASE_MS);
      if (speed > 0.05) m.direction = Math.sign(m.current - before) || m.direction;
      render();
      const resting = m.current === m.target && m.energy <= 0.004;
      if (resting) {
        m.energy = 0;
        m.frame = 0;
        m.time = 0;
        render();
      } else {
        m.frame = requestAnimationFrame(step);
      }
    },
    [render],
  );

  const kick = useCallback(() => {
    const m = motion.current;
    if (!m.frame) m.frame = requestAnimationFrame(step);
  }, [step]);

  useLayoutEffect(() => {
    render();
  }, [render]);
  useEffect(() => () => cancelAnimationFrame(motion.current.frame), []);
  useEffect(() => {
    if (!motion.current.dragging && motion.current.target !== index) {
      motion.current.target = index;
      kick();
    }
  }, [index, kick]);

  const unit = () => (rulerRef.current ? rulerRef.current.getBoundingClientRect().width / CARD_WIDTH : 1);
  const choose = (next) => {
    const clamped = Math.min(last, Math.max(0, next));
    motion.current.target = clamped;
    kick();
    if (clamped !== index) onIndexChange(clamped);
  };

  const onPointerDown = (event) => {
    if (locked || event.button > 0) return;
    drag.current = { startX: event.clientX, startPosition: motion.current.target, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event) => {
    const state = drag.current;
    if (!state) return;
    const dx = event.clientX - state.startX;
    if (!state.moved && Math.abs(dx) < DRAG_THRESHOLD) return;
    state.moved = true;
    setDragging(true);
    motion.current.dragging = true;
    const next = Math.min(last + 0.35, Math.max(-0.35, state.startPosition - dx / (STEP_SPACING * unit())));
    motion.current.target = next;
    kick();
    const nearest = Math.round(Math.min(last, Math.max(0, next)));
    if (nearest !== index) onIndexChange(nearest);
  };
  const onPointerUp = () => {
    const state = drag.current;
    drag.current = null;
    if (!state) return;
    setDragging(false);
    motion.current.dragging = false;
    if (state.moved) {
      motion.current.target = Math.round(Math.min(last, Math.max(0, motion.current.target))); // 놓으면 가까운 선택지에 딱 맞게 멈춘다
      kick();
    }
  };
  const onKeyDown = (event) => {
    if (locked) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') choose(index - 1);
    else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') choose(index + 1);
    else if (event.key === 'Home') choose(0);
    else if (event.key === 'End') choose(last);
    else return;
    event.preventDefault();
  };

  const minorTicks = [];
  for (let step = -EDGE_STEPS * MINOR_PER_STEP; step <= (last + EDGE_STEPS) * MINOR_PER_STEP; step += 1) {
    if (step % MINOR_PER_STEP !== 0) minorTicks.push(step / MINOR_PER_STEP);
  }
  const majorTicks = [];
  for (let step = -EDGE_STEPS; step <= last + EDGE_STEPS; step += 1) majorTicks.push(step);

  return (
    <div className={`${styles.card} ${rise ? styles.cardRise : ''}`} data-locked={locked}>
      <button type="button" className={styles.arrow} data-side="left" onClick={onBack} disabled={!canGoBack || locked} aria-label="이전 질문">
        <Chevron direction="left" />
      </button>
      <h2 className={styles.title} key={title}>
        {title}
      </h2>
      <button
        type="button"
        className={styles.arrow}
        data-side="right"
        onClick={onConfirm}
        disabled={locked}
        aria-label={isLast ? '선택 완료하고 결과 보기' : '선택하고 다음 질문'}
      >
        <Chevron direction="right" />
      </button>

      <div
        ref={rulerRef}
        className={styles.ruler}
        data-dragging={dragging}
        role="slider"
        tabIndex={0}
        aria-label={title}
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={index}
        aria-valuetext={options[index].rulerLabel ?? options[index].label}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <div ref={trackRef} className={styles.track} style={{ '--pos': index }}>
          {minorTicks.map((value) => (
            <span
              key={`m${value}`}
              ref={(el) => (el ? ticks.current.set(value, { el, at: value }) : ticks.current.delete(value))}
              className={styles.minor}
              style={{ '--at': value }}
            />
          ))}
          {majorTicks.map((value) => (
            <span key={`M${value}`} className={styles.major} style={{ '--at': value }} />
          ))}
          {options.map((option, optionIndex) => (
            <button
              key={option.id}
              ref={(el) => (el ? labels.current.set(optionIndex, { el, at: optionIndex }) : labels.current.delete(optionIndex))}
              type="button"
              tabIndex={-1}
              className={styles.label}
              style={{ '--at': optionIndex }}
              data-distance={Math.min(2, Math.abs(optionIndex - index))}
              onClick={() => !locked && choose(optionIndex)}
            >
              {option.rulerLabel ?? option.label}
            </button>
          ))}
        </div>
        <span className={styles.needle} aria-hidden="true" />
      </div>
    </div>
  );
}
