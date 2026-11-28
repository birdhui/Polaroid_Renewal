import { useEffect, useId, useRef, useState } from 'react';
import cameraLine from '@/assets/compare/intro/camera-line.webp';
import { INTRO_LINE_PATHS, INTRO_LINE_SIZE } from '@/pages/Compare/data/compareIntroPaths.js';
import styles from './CompareIntro.module.css';

/**
 * 모션 타이밍(ms) — 임시값이다(시안에 시간 값이 없다). 아래 숫자만 바꾸면 전체 속도가 바뀐다.
 *
 * 흐름: 어두운 화면 → 카메라 선이 그려지기 시작(START) → 큰 윤곽부터 차례로 그려짐(DRAW)
 *       → 마스크로 못 덮은 잔선(렌즈 글씨 등)이 번져 나타남(FILL) → 잠깐 머무름(HOLD)
 *       → 셔터 직전 숨 고르기(READY) → 찰칵! 순식간에 하얗게 번쩍하고 카메라가 툭 눌림(FLASH)
 *       → 빛이 빠르게 가시다 서서히 남으며 다음 화면이 드러남(EXIT, 이 뒤에 onDone)
 */
const TIMING = {
  start: 250, // 화면이 나오고 첫 선이 그려지기까지
  draw: 2900, // 선이 모두 그려지는 데 걸리는 시간(가장 늦게 시작하는 선이 끝나는 시점)
  fill: 700, // 마스크로 덮지 못한 잔선이 번져 나타나는 시간 (draw 끝 직전부터)
  hold: 550, // 다 그려진 뒤 셔터가 눌리기 전까지 머무는 시간 (이 끝 ready 만큼은 셔터를 누르기 직전의 숨 고르기)
  ready: 300, // 셔터 직전: 카메라가 살짝 커지며 선이 밝아진다
  flash: 160, // 하얗게 번쩍인 채 머무는 시간 — 번쩍임 자체는 순식간(CSS 의 .flash 전환 50ms)에 하얗게 덮는다
  exit: 1100, // 하얀 빛이 순식간에 가시다 서서히 남으며 다음 화면이 드러나는 시간 (CSS 의 .intro 전환 시간과 맞춘다)
};

/**
 * 선이 그려지는 방식. 레퍼런스처럼 카메라 전체가 처음에는 천천히 그려지다가 갈수록 빨라진다.
 * - 전체 진행도를 시간^ACCEL 로 키워서(ease-in) 모든 선이 같은 흐름으로 가속한다.
 * - 큰 윤곽선이 먼저 시작하고, 짧은 잔선과 앞면 안쪽 선은 나중에 시작해서 같은 때에 끝난다.
 */
// 카메라 앞면의 플래시·렌즈·뷰파인더·버튼 영역(이미지 픽셀). 이 안에 통째로 들어가는 선은 겉 윤곽을 다 그린 뒤에 그린다.
const FACE = { x1: 112, x2: 418, y1: 88, y2: 232 };
const isInsideFace = (path) => {
  const nums = path.d.match(/-?\d+\.?\d*/g).map(Number);
  for (let i = 0; i < nums.length; i += 2) {
    if (nums[i] < FACE.x1 || nums[i] > FACE.x2 || nums[i + 1] < FACE.y1 || nums[i + 1] > FACE.y2) return false;
  }
  return true;
};
const ACCEL = 1.8; // 클수록 처음이 더 느리고 끝이 더 빠르다 (전체 진행도 = 시간^ACCEL)
const MAX_LENGTH = Math.max(...INTRO_LINE_PATHS.map((path) => path.length), 1);
const IS_FACE = INTRO_LINE_PATHS.map(isInsideFace);
// 1) 겉 윤곽선: 레퍼런스처럼 거의 한꺼번에 시작해서 각자 쭉 뻗어 나간다. 시작 순서는 섞여 있어 한쪽부터 그려지지 않는다. 값은 전체 진행도(0~1)다.
const OUTER_SPREAD = 0.3; // 겉선이 시작하는 구간(0 ~ 이 값)
const OUTER_RANGE = (path, index) => {
  const mix = (index * 0.6180339887) % 1; // 0~1 로 고르게 흩어지는 값
  const start = mix * OUTER_SPREAD;
  return { start, end: Math.min(1, start + 0.35 + 0.2 * Math.sqrt(path.length / MAX_LENGTH)) };
};
// 2) 앞면(렌즈·뷰파인더·플래시 등): 겉선이 어느 정도 그려진 뒤, 선을 하나씩 이어서 그린다(긴 선부터).
const FACE_FROM = 0.32; // 앞면 첫 선이 시작하는 진행도
const FACE_TO = 0.85; // 앞면 마지막 선이 시작하는 진행도
const PEN_OVERLAP = 3; // 한 선이 그려지는 동안 대략 몇 개의 선이 함께 그려지는지
const faceOrder = INTRO_LINE_PATHS.map((path, index) => index)
  .filter((index) => IS_FACE[index])
  .sort((a, b) => INTRO_LINE_PATHS[b].length - INTRO_LINE_PATHS[a].length);
const faceTotal = faceOrder.reduce((sum, index) => sum + INTRO_LINE_PATHS[index].length, 0) || 1;
const LINE_RANGE = INTRO_LINE_PATHS.map((path, index) => (IS_FACE[index] ? null : OUTER_RANGE(path, index)));
let walked = 0;
faceOrder.forEach((index) => {
  const length = INTRO_LINE_PATHS[index].length;
  const start = FACE_FROM + (walked / faceTotal) * (FACE_TO - FACE_FROM);
  LINE_RANGE[index] = { start, end: Math.min(1, start + (PEN_OVERLAP * length) / faceTotal * (FACE_TO - FACE_FROM) + 0.04) };
  walked += length;
});

/**
 * 히어로의 "찾아보기"를 누르면 히어로 위로 덮이는 드로잉 화면 (Figma 3526:802, 흐름은 3542:2020).
 * 카메라 선 그림이 완성된 채로 나오지 않고, 선이 그려지면서 나타난다.
 * 선 그림(이미지)을 그대로 쓰되, 선을 따라 만든 경로를 마스크로 써서 그려진 만큼만 보이게 한다.
 * 사라지기 시작할 때 onExit, 다 끝나면 onDone 을 한 번씩 부른다. 화면을 누르면 건너뛴다. 모션 감소 설정에서는 바로 끝낸다.
 */
export default function CompareIntro({ onDone, onExit }) {
  const maskId = useId().replace(/:/g, '');
  const doneRef = useRef(onDone);
  const exitRef = useRef(onExit);
  const [phase, setPhase] = useState('draw'); // draw | ready(셔터 직전) | flash(번쩍임) | exit(드러나는 중)
  const timers = useRef([]);
  const strokeRefs = useRef([]);

  useEffect(() => {
    doneRef.current = onDone;
    exitRef.current = onExit;
  }, [onDone, onExit]);

  // 찰칵: 하얗게 번쩍인 뒤(flash) 그 하얀 화면이 옅어지며 다음 화면이 드러난다(exit). delay 뒤에 시작한다.
  const shutter = (delay) => [
    setTimeout(() => setPhase('flash'), delay),
    setTimeout(() => {
      setPhase('exit');
      exitRef.current?.();
    }, delay + TIMING.flash),
    setTimeout(() => doneRef.current?.(), delay + TIMING.flash + TIMING.exit),
  ];

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      doneRef.current?.();
      return undefined;
    }
    // 전체 진행도가 시간에 따라 점점 빨라지도록(ease-in) 직접 그려 준다. 선 하나하나도 같은 흐름을 탄다.
    let frame = 0;
    const startedAt = performance.now() + TIMING.start;
    const tick = (now) => {
      const u = Math.min(1, Math.max(0, (now - startedAt) / TIMING.draw));
      const progress = u ** ACCEL;
      strokeRefs.current.forEach((el, i) => {
        if (!el) return;
        const { start, end } = LINE_RANGE[i];
        const own = Math.min(1, Math.max(0, (progress - start) / Math.max(end - start, 0.0001)));
        el.style.strokeDashoffset = String(1 - own);
      });
      if (u < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const total = TIMING.start + TIMING.draw + TIMING.hold;
    timers.current = [setTimeout(() => setPhase('ready'), total - TIMING.ready), ...shutter(total)];
    return () => {
      cancelAnimationFrame(frame);
      timers.current.forEach(clearTimeout);
    };
  }, []);

  const skip = () => {
    if (phase !== 'draw' && phase !== 'ready') return;
    timers.current.forEach(clearTimeout);
    timers.current = shutter(0);
  };

  const drawEnd = (TIMING.start + TIMING.draw) / 1000;

  return (
    <div
      className={styles.intro}
      data-phase={phase}
      onClick={skip}
      style={{ '--fill': `${TIMING.fill}ms`, '--fill-delay': `${drawEnd - 0.5}s` }}
      aria-hidden="true"
    >
      <div className={styles.camera}>
        <div className={styles.cameraTilt}>
          <svg
            className={styles.drawing}
            viewBox={`0 0 ${INTRO_LINE_SIZE.width} ${INTRO_LINE_SIZE.height}`}
            focusable="false"
          >
            <defs>
              <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={INTRO_LINE_SIZE.width} height={INTRO_LINE_SIZE.height}>
                {INTRO_LINE_PATHS.map((path, index) => (
                  <path
                    key={index}
                    className={styles.stroke}
                    d={path.d}
                    pathLength="1"
                    ref={(el) => {
                      strokeRefs.current[index] = el;
                    }}
                  />
                ))}
              </mask>
            </defs>
            {/* 그려진 만큼만 보이는 선 그림 */}
            <image href={cameraLine} width={INTRO_LINE_SIZE.width} height={INTRO_LINE_SIZE.height} mask={`url(#${maskId})`} />
            {/* 마지막에 전체가 번져 나타나 빠진 잔선을 채운다 */}
            <image className={styles.fill} href={cameraLine} width={INTRO_LINE_SIZE.width} height={INTRO_LINE_SIZE.height} />
          </svg>
        </div>
      </div>
      {/* 셔터가 찍히는 순간의 하얀 번쩍임 */}
      <div className={styles.flash} />
    </div>
  );
}
