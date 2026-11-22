import { useEffect, useState } from 'react';
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
 * 장식이라 스크린리더에서는 숨긴다.
 */
export default function CompareHeroCameras() {
  const [loaded, setLoaded] = useState(0);
  const ready = loaded >= HERO_CAMERAS.length;

  // 이미지가 모두 준비된 뒤에 모션을 시작한다 (빈 화면에서 모션이 지나가는 것을 막는다)
  const markLoaded = () => setLoaded((count) => count + 1);
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(HERO_CAMERAS.length), READY_FALLBACK);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`${styles.stage} ${ready ? styles.ready : ''}`}
      style={{ aspectRatio: `${HERO_STAGE.width} / ${HERO_STAGE.height}` }}
      aria-hidden="true"
    >
      {HERO_CAMERAS.map((camera) => {
        const from = getGatherFrom(camera);
        return (
          <img
            key={camera.id}
            className={styles.camera}
            src={camera.src}
            alt=""
            draggable={false}
            decoding="async"
            fetchPriority="high"
            onLoad={markLoaded}
            onError={markLoaded}
            style={{
              left: `${(camera.x / HERO_STAGE.width) * 100}%`,
              top: `${(camera.y / HERO_STAGE.height) * 100}%`,
              width: `${(camera.w / HERO_STAGE.width) * 100}%`,
              '--from-x': `${from.x.toFixed(2)}%`,
              '--from-y': `${from.y.toFixed(2)}%`,
              '--from-scale': from.scale,
            }}
          />
        );
      })}
    </div>
  );
}
