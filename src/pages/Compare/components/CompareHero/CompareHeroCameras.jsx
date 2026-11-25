import { useEffect, useRef, useState } from 'react';
import { HERO_CAMERAS, HERO_STAGE } from '../../data/compareHeroCameras.js';
import styles from './CompareHeroCameras.module.css';

/*
 * 인트로 모션: 카메라들이 중심에서 바깥쪽으로 밀려나 약간 커진 상태에서 시작해 제자리로 모인다.
 * 아래 수치는 참고 사이트(polaroid.com 기어 가이드)의 인트로를 측정한 값이며, 우리 시안에서 확정된 값이 아니다.
 *  - 밀려나는 정도: 화면 중심에서 떨어진 거리의 20%
 *  - 시작 크기: 안쪽 1.10배, 바깥 열 1.15배
 */
const GATHER_OFFSET = 0.2;
const GATHER_SCALE_INNER = 1.1;
const GATHER_SCALE_OUTER = 1.15;
const OUTER_DISTANCE = 1000; // 중심에서 가로로 이만큼 이상 떨어진 카메라를 바깥 열로 본다 (이미지 px)
const READY_FALLBACK = 3000; // 이미지가 끝내 안 불러와져도 이 시간 뒤에는 모션을 시작한다

/*
 * 인트로 뒤의 움직임 (Framer "Motion Parallax Pro" 를 참고한 임시 값 — 시안에서 확정된 수치가 아니다)
 *  - 마우스를 따라 카메라가 반대 방향으로 움직이고, 카메라마다 깊이(DEPTHS)가 달라 움직이는 양이 다르다.
 *  - 가만히 있어도 천천히 위아래로 떠 있는다.
 */
const SETTLE_DELAY = 1500; // 인트로(지연 200 + 1200)가 끝난 뒤부터 움직임을 시작한다
const PARALLAX_REACH = 34; // 화면 가로 1920 기준 최대 이동량(px). 화면 폭에 비례해 줄고 늘어난다
const PARALLAX_EASE = 0.07; // 클수록 마우스를 빨리 따라온다
const DEPTHS = [0.7, 1.05, 0.85, 1.15, 0.65, 0.95, 1.25, 1.1, 0.75, 1.2, 0.8, 1, 0.7, 0.9]; // HERO_CAMERAS 순서

const CENTER_X = HERO_STAGE.width / 2;
const CENTER_Y = HERO_STAGE.height / 2;

/** 카메라 한 대의 모션 시작 상태(자기 크기 대비 %, 배율)를 계산한다 */
function getGatherFrom(camera) {
  const dx = camera.x + camera.w / 2 - CENTER_X;
  const dy = camera.y + camera.h / 2 - CENTER_Y;
  return {
    x: ((dx * GATHER_OFFSET) / camera.w) * 100,
    y: ((dy * GATHER_OFFSET) / camera.h) * 100,
    scale: Math.abs(dx) > OUTER_DISTANCE ? GATHER_SCALE_OUTER : GATHER_SCALE_INNER,
  };
}

/**
 * Compare 히어로 배경 — 카메라 14대가 기존 히어로 이미지와 같은 자리·크기로 놓여 있다.
 * 처음에 가운데로 모인 뒤에는 마우스를 따라 움직이고, 가만히 있어도 천천히 떠 있는다. 장식이라 스크린리더에서는 숨긴다.
 */
export default function CompareHeroCameras() {
  const stageRef = useRef(null);
  const [loaded, setLoaded] = useState(0);
  const [settled, setSettled] = useState(false);
  const ready = loaded >= HERO_CAMERAS.length;

  // 이미지가 모두 준비된 뒤에 모션을 시작한다 (빈 화면에서 모션이 지나가는 것을 막는다)
  const markLoaded = () => setLoaded((count) => count + 1);
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(HERO_CAMERAS.length), READY_FALLBACK);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return undefined;
    const timer = setTimeout(() => setSettled(true), SETTLE_DELAY);
    return () => clearTimeout(timer);
  }, [ready]);

  // 마우스 패럴랙스 — 마우스 위치를 CSS 변수(--mx, --my)로 넘기고, 카메라마다 깊이를 곱해 움직인다
  useEffect(() => {
    const stage = stageRef.current;
    const hero = stage?.parentElement;
    if (!settled || !hero) return undefined;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!canHover || reduced) return undefined;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let frame = 0;

    const tick = () => {
      currentX += (targetX - currentX) * PARALLAX_EASE;
      currentY += (targetY - currentY) * PARALLAX_EASE;
      stage.style.setProperty('--mx', `${currentX.toFixed(2)}px`);
      stage.style.setProperty('--my', `${currentY.toFixed(2)}px`);
      const moving = Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05;
      frame = moving ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onMove = (event) => {
      const rect = hero.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const nx = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
      const ny = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2));
      const reach = PARALLAX_REACH * Math.min(rect.width / 1920, 1);
      targetX = -nx * reach;
      targetY = -ny * reach;
      wake();
    };
    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      wake();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(frame);
    };
  }, [settled]);

  return (
    <div
        ref={stageRef}
        className={`${styles.stage} ${ready ? styles.ready : ''} ${settled ? styles.settled : ''}`}
        style={{ aspectRatio: `${HERO_STAGE.width} / ${HERO_STAGE.height}` }}
        aria-hidden="true"
      >
        {HERO_CAMERAS.map((camera, index) => {
          const from = getGatherFrom(camera);
          return (
            <div
              key={camera.id}
              className={styles.item}
              style={{
                left: `${(camera.x / HERO_STAGE.width) * 100}%`,
                top: `${(camera.y / HERO_STAGE.height) * 100}%`,
                width: `${(camera.w / HERO_STAGE.width) * 100}%`,
                '--depth': DEPTHS[index % DEPTHS.length],
                '--float-duration': `${6 + (index % 5) * 0.9}s`,
                '--float-delay': `${-(index * 0.83).toFixed(2)}s`,
              }}
            >
              <span className={styles.float}>
                <img
                  className={styles.camera}
                  src={camera.src}
                  alt=""
                  draggable={false}
                  decoding="async"
                  fetchPriority="high"
                  onLoad={markLoaded}
                  onError={markLoaded}
                  style={{
                    '--from-x': `${from.x.toFixed(2)}%`,
                    '--from-y': `${from.y.toFixed(2)}%`,
                    '--from-scale': from.scale,
                  }}
                />
              </span>
            </div>
          );
        })}
      </div>
  );
}
