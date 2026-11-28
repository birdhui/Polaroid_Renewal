import { useEffect, useRef } from 'react';
import logoWordmark from '@/assets/shared/images/logo-polaroid-wordmark.svg';
import { SHOWCASE_CAMERAS } from '../../data/compareShowcaseCameras.js';
import styles from './CompareHero.module.css';

/*
 * Figma 시안(3551:2021)의 카메라 20대가 두 개의 고리를 따라 모두 왼쪽(반시계방향)으로 천천히 돈다.
 *  - 안쪽 고리(시안의 파란 선) 10대는 조금 빠르게, 바깥쪽 고리(빨간 선) 10대는 조금 느리게 따로 돈다.
 *  - 카메라는 시안에서 기울어진 각도(tilt)를 그대로 유지한 채 자리만 고리를 따라 옮겨 간다(카메라 자체는 돌지 않는다).
 *  - 고리를 도는 양은 각도가 아니라 "고리를 따라 간 거리"로 센다. 타원은 각도가 같아도 구간마다 실제 거리가 달라서,
 *    각도로 세면 카메라 사이 간격이 돌수록 벌어지고 뭉쳐 시안 배치가 무너진다. 거리로 세면 간격이 그대로 유지된다.
 *  - 처음엔 시안 자리 그대로 가만히 있다가 서서히 돈다. 문구·버튼·로고는 가만히 있다.
 * 고리의 크기·속도는 시안에 수치가 없어서 파란 선·빨간 선 그림을 보고 정한 임시값이다.
 */
const RINGS = {
  // 중심(cx, cy)과 가로·세로 반지름(a, b)은 시안 화면 한가운데(원점) 기준 px, speed 는 초당 도(왼쪽으로 돈다)
  inner: { cx: -15, cy: 17, a: 700, b: 546, speed: 14 },
  outer: { cx: 17, cy: 42, a: 991, b: 685, speed: 9 },
};
const SPIN_RAMP = 1800; // 가만히 있다가 이 속도가 될 때까지 걸리는 시간(ms)

const DESIGN_CENTER = { x: 976.5, y: 540 }; // 시안 화면(1953 x 1080)의 한가운데

// [카메라 id, 시안에서 이미지가 놓인 가운데 x, y, 이미지 너비, 높이, 기울기(도), 고리]
const SHOWCASE_SPOTS = [
  ['goTeal', 469.0, 127.0, 138, 138, -42.85, 'inner'],
  ['nowCoral', 1725.0, 641.0, 126, 126, 101.11, 'inner'],
  ['nowPlusBlack', 1440.0, 152.0, 128, 128, 36.54, 'inner'],
  ['nowPinkA', -1.0, 511.5, 122, 133, -93.32, 'outer'],
  ['nowBlack', 280.5, 355.5, 125, 125, -50.13, 'inner'],
  ['nowYellowB', 1818.4, 1005.4, 125, 125, 137.39, 'outer'],
  ['modA', 1909.0, 256.1, 112, 121, 53.09, 'outer'],
  ['modB', 400.0, 898.0, 122, 122, -138.78, 'inner'],
  ['nowCream', 1647.0, 354.0, 122, 122, 65.4, 'inner'],
  ['nowCreamB', 1563.5, 896.0, 119, 126, 143.36, 'inner'],
  ['nowTealB', 141.7, 1051.7, 130, 130, -139.02, 'outer'],
  ['i2', 91.3, 243.3, 130, 130, -60.02, 'outer'],
  ['flipOrange', 31.5, 797.5, 125, 125, -113.89, 'outer'],
  ['nowArctic', 250.0, 46.0, 124, 124, -37.1, 'outer'],
  ['flipBlack', 1966.5, 532.5, 106, 106, 95.14, 'outer'],
  ['goWhiteB', 1937.5, 784.5, 151, 151, 108.44, 'outer'],
  ['nowPlusCoralA', 1735.6, 45.6, 124, 124, 29.82, 'outer'],
  ['nowPlusCoralB', 220.0, 668.5, 120, 127, -110.29, 'inner'],
  ['goPurple', 615.7, 1067.7, 139, 139, -174.67, 'inner'],
  ['nowPlusBlue', 1326.9, 1091.9, 130, 130, 176.48, 'inner'],
];

const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const ARC_STEPS = 720; // 고리 한 바퀴를 이만큼으로 잘라 거리를 잰다 (0.5도 간격)

/** 고리 타원을 0.5도씩 돌며 "시작점에서 거기까지의 거리"를 미리 재 둔다. 거리 ↔ 각도를 서로 바꾸는 데 쓴다 */
function buildRingPath(a, b) {
  const cum = new Float64Array(ARC_STEPS + 1);
  let prevX = a;
  let prevY = 0;
  for (let i = 1; i <= ARC_STEPS; i += 1) {
    const rad = (i / ARC_STEPS) * Math.PI * 2;
    const x = a * Math.cos(rad);
    const y = b * Math.sin(rad);
    cum[i] = cum[i - 1] + Math.hypot(x - prevX, y - prevY);
    prevX = x;
    prevY = y;
  }
  return { cum, total: cum[ARC_STEPS] };
}

/** 각도(도) → 시작점에서 거기까지 고리를 따라 간 거리 */
function arcAt(path, degrees) {
  const wrapped = ((degrees % 360) + 360) % 360;
  const pos = (wrapped / 360) * ARC_STEPS;
  const i = Math.floor(pos);
  return path.cum[i] + (path.cum[i + 1] - path.cum[i]) * (pos - i);
}

/** 거리 → 각도(도). 거리를 일정하게 늘리면 화면에서 일정한 빠르기로 움직인다 */
function paramAt(path, length) {
  const wrapped = ((length % path.total) + path.total) % path.total;
  let lo = 0;
  let hi = ARC_STEPS;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (path.cum[mid] <= wrapped) lo = mid;
    else hi = mid;
  }
  const span = path.cum[hi] - path.cum[lo];
  return ((lo + (span > 0 ? (wrapped - path.cum[lo]) / span : 0)) / ARC_STEPS) * 360;
}

const RING_PATHS = {
  inner: buildRingPath(RINGS.inner.a, RINGS.inner.b),
  outer: buildRingPath(RINGS.outer.a, RINGS.outer.b),
};

/**
 * 카메라마다 자리를 화면 한가운데 기준으로 바꾸고, 자기 고리 위에서 어느 각도(t0)에 있는지, 고리 중심에서 얼마나 떨어졌는지(rx, ry)를 미리 계산한다.
 * 고리를 한 바퀴 도는 길은 "고리 타원에 카메라가 떨어진 정도를 곱한 타원"이라, 같은 고리의 카메라끼리 간격이 유지된다.
 */
const CAMERAS = SHOWCASE_SPOTS.map(([id, spotX, spotY, width, height, tilt, ring], index) => {
  const source = SHOWCASE_CAMERAS.find((camera) => camera.id === id);
  const x = spotX - DESIGN_CENTER.x;
  const y = spotY - DESIGN_CENTER.y;
  const { cx, cy, a, b } = RINGS[ring];
  const nx = (x - cx) / a;
  const ny = (y - cy) / b;
  const reach = Math.hypot(nx, ny);
  const t0 = (Math.atan2(ny, nx) * 180) / Math.PI;
  return {
    id,
    src: source.src,
    ring,
    x,
    y,
    width,
    height,
    tilt,
    depth: 0.7 + hash(index + 1300) * 0.6,
    rx: a * reach,
    ry: b * reach,
    t0,
    s0: arcAt(RING_PATHS[ring], t0), // 시작 자리까지 고리를 따라 간 거리
    cx,
    cy,
  };
});

/**
 * Compare 히어로 — 가운데에 안내 문구와 "찾아보기" 버튼, 위에 로고가 있고, 카메라가 한 덩어리로 천천히 돈다.
 * 카메라는 장식이라 스크린리더에서는 숨기고, 문구는 전부 텍스트로 올린다.
 * "찾아보기"를 누르면 ComparePage 가 (onStart) 히어로를 사라지게 하고 그 자리에 채팅 화면을 띄운다. 스크롤로 이동하지 않는다.
 */
export default function CompareHero({ onStart, leaving = false }) {
  const reduceMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const heroRef = useRef(null);
  const camerasRef = useRef([]);

  // 고리를 따라 간 거리를 프레임마다 늘리고, 그 거리에 해당하는 각도(--t)를 카메라마다 넣는다. 히어로가 화면에 보일 때만 돈다.
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || reduceMotion.current) return undefined;
    let frame = 0;
    let last = 0;
    let ramp = 0;
    const moved = { inner: 0, outer: 0 }; // 고리를 따라 지금까지 간 거리
    const tick = (now) => {
      const dt = last ? Math.min(64, now - last) : 0;
      last = now;
      ramp = Math.min(1, ramp + dt / SPIN_RAMP);
      Object.keys(moved).forEach((name) => {
        // speed(초당 도)는 그대로 두고 거리로 환산한다 — 한 바퀴 도는 데 걸리는 시간은 전과 같다
        const path = RING_PATHS[name];
        const perMs = (path.total * RINGS[name].speed) / 360000;
        moved[name] = (moved[name] + perMs * ramp * dt) % path.total;
      });
      CAMERAS.forEach((camera, index) => {
        const node = camerasRef.current[index];
        if (!node) return;
        // 왼쪽(반시계방향)으로 도니까 간 거리를 뺀다
        const t = paramAt(RING_PATHS[camera.ring], camera.s0 - moved[camera.ring]);
        node.style.setProperty('--t', t.toFixed(3));
      });
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (frame) return;
      last = 0;
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    observer.observe(hero);
    return () => {
      observer.disconnect();
      stop();
    };
  }, []);

  return (
    <header ref={heroRef} className={styles.hero} data-leaving={leaving}>
      <div className={styles.stage} aria-hidden="true">
        <div className={styles.spin}>
          {CAMERAS.map((camera, index) => (
            <img
              key={camera.id}
              ref={(node) => {
                camerasRef.current[index] = node;
              }}
              className={styles.camera}
              data-ring={camera.ring}
              src={camera.src}
              alt=""
              draggable="false"
              style={{
                '--x': camera.x.toFixed(1),
                '--y': camera.y.toFixed(1),
                '--w': camera.width,
                '--h': camera.height,
                '--tilt': camera.tilt,
                '--depth': camera.depth.toFixed(2),
                '--rx': camera.rx.toFixed(1),
                '--ry': camera.ry.toFixed(1),
                '--t0': camera.t0.toFixed(2),
                '--t': camera.t0.toFixed(2), // 돌기 전에는 시안 자리 그대로
              }}
            />
          ))}
        </div>
      </div>
      <span className={styles.logo} role="img" aria-label="Polaroid" style={{ '--logo': `url("${logoWordmark}")` }} />
      <div className={styles.copy}>
        <h1 className={styles.title}>
          Which Polaroid camera is
          <br />
          right for you?
        </h1>
        <button type="button" className={styles.cta} onClick={onStart} disabled={leaving}>
          찾아보기
        </button>
      </div>
    </header>
  );
}
