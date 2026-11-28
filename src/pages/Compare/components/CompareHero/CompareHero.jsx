import { useEffect, useRef } from 'react';
import logoWordmark from '@/assets/shared/images/logo-polaroid-wordmark.svg';
import { SHOWCASE_CAMERAS } from '../../data/compareShowcaseCameras.js';
import styles from './CompareHero.module.css';

/*
 * Figma 시안(3551:2021)의 카메라 20대가 두 개의 고리를 따라 모두 왼쪽(반시계방향)으로 천천히 돈다.
 *  - 안쪽 고리(시안의 파란 선) 10대는 조금 빠르게, 바깥쪽 고리(빨간 선) 10대는 조금 느리게 따로 돈다.
 *  - 카메라는 시안에서 기울어진 각도(tilt)를 그대로 유지한 채 자리만 고리를 따라 옮겨 간다(카메라 자체는 돌지 않는다).
 *  - 고리는 시안의 카메라 자리를 차례로 이어 만든 "고정된 길"이고, 카메라는 그 길 위에 고르게 서서 같은 빠르기로 흘러간다.
 *    앞 카메라가 있던 자리를 뒤 카메라가 그대로 이어받으므로, 어느 시점에 봐도 화면에 보이는 배치 모양이 같다.
 *    (타원을 각자 도는 방식이면 카메라마다 길이 달라 돌수록 모양이 무너진다)
 *  - 처음엔 시안 자리 그대로 가만히 있다가 서서히 돈다. 문구·버튼·로고는 가만히 있다.
 * 고리의 중심·속도는 시안에 수치가 없어서 파란 선·빨간 선 그림을 보고 정한 임시값이다.
 */
const RINGS = {
  // 중심(cx, cy)은 시안 화면 한가운데(원점) 기준 px — 카메라를 고리 순서대로 줄 세울 때만 쓴다.
  // speed 는 초당 도(왼쪽으로 돈다). 360 / speed 초에 길을 한 바퀴 돈다.
  inner: { cx: -15, cy: 17, speed: 14 },
  outer: { cx: 17, cy: 42, speed: 9 },
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

const SEG_SAMPLES = 24; // 자리와 자리 사이를 이만큼으로 잘라 길을 만든다

/**
 * 네 점을 지나는 부드러운 곡선(중심 가중 Catmull-Rom). 자리 사이 간격이 들쭉날쭉해도 길이 부풀지 않는다.
 * t 가 0 이면 p1, 1 이면 p2 를 정확히 지난다. 그래서 카메라가 시안 자리에 정확히 놓인다.
 */
function splineAt(p0, p1, p2, p3, t) {
  const knot = (ti, a, b) => ti + Math.sqrt(Math.hypot(b.x - a.x, b.y - a.y)) || ti + 1;
  const t0 = 0;
  const t1 = knot(t0, p0, p1);
  const t2 = knot(t1, p1, p2);
  const t3 = knot(t2, p2, p3);
  const at = t1 + (t2 - t1) * t;
  const mix = (a, b, ta, tb) => {
    const span = tb - ta || 1;
    const w = (tb - at) / span;
    return { x: a.x * w + b.x * (1 - w), y: a.y * w + b.y * (1 - w) };
  };
  const a1 = mix(p0, p1, t0, t1);
  const a2 = mix(p1, p2, t1, t2);
  const a3 = mix(p2, p3, t2, t3);
  return mix(mix(a1, a2, t0, t2), mix(a2, a3, t1, t3), t1, t2);
}

/**
 * 시안 자리들을 고리 순서대로 이어 닫힌 길을 만들고, 길을 따라 잰 거리표를 함께 둔다.
 * nodeArc[i] 는 i 번째 자리가 길 위에서 어디쯤인지(거리)다.
 */
function buildRingPath(spots) {
  const n = spots.length;
  const points = [{ x: spots[0].x, y: spots[0].y }];
  const cum = [0];
  const nodeArc = [0];
  for (let i = 0; i < n; i += 1) {
    const p0 = spots[(i - 1 + n) % n];
    const p1 = spots[i];
    const p2 = spots[(i + 1) % n];
    const p3 = spots[(i + 2) % n];
    for (let k = 1; k <= SEG_SAMPLES; k += 1) {
      const point = splineAt(p0, p1, p2, p3, k / SEG_SAMPLES);
      const prev = points[points.length - 1];
      points.push(point);
      cum.push(cum[cum.length - 1] + Math.hypot(point.x - prev.x, point.y - prev.y));
    }
    if (i < n - 1) nodeArc.push(cum[cum.length - 1]);
  }
  return { points, cum, nodeArc, total: cum[cum.length - 1] };
}

/** 길을 따라 length 만큼 간 지점의 좌표. 거리로 재니까 화면에서 일정한 빠르기로 흐른다 */
function pointAt(path, length) {
  const wrapped = ((length % path.total) + path.total) % path.total;
  let lo = 0;
  let hi = path.cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (path.cum[mid] <= wrapped) lo = mid;
    else hi = mid;
  }
  const span = path.cum[hi] - path.cum[lo];
  const f = span > 0 ? (wrapped - path.cum[lo]) / span : 0;
  const a = path.points[lo];
  const b = path.points[hi];
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}

/** 시안 자리를 화면 한가운데 기준으로 바꾼 기본 정보 */
const SPOTS = SHOWCASE_SPOTS.map(([id, spotX, spotY, width, height, tilt, ring], index) => ({
  id,
  src: SHOWCASE_CAMERAS.find((camera) => camera.id === id).src,
  ring,
  x: spotX - DESIGN_CENTER.x,
  y: spotY - DESIGN_CENTER.y,
  width,
  height,
  tilt,
  depth: 0.7 + hash(index + 1300) * 0.6,
}));

/**
 * 고리마다 카메라를 돌아가는 순서(고리 중심에서 본 각도)로 줄 세우고, 그 자리들을 이어 길을 만든다.
 * 길은 한 번 만들고 고정이다. 카메라는 자기 자리(s0)에서 출발해 모두 같은 거리만큼 길 위를 흘러간다.
 */
const RING_PATHS = {};
Object.keys(RINGS).forEach((ring) => {
  const { cx, cy } = RINGS[ring];
  const ordered = SPOTS.filter((spot) => spot.ring === ring).sort(
    (a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx),
  );
  const path = buildRingPath(ordered);
  RING_PATHS[ring] = path;
  // 길 위에 고르게 세운다. 시안 자리는 간격이 250px 와 833px 처럼 들쭉날쭉해서,
  // 그대로 두면 뭉친 덩어리와 빈 구멍이 같이 돌아 구멍이 눈에 띄는 쪽으로 온다.
  // 고르게 세우면 어느 시점에 봐도 같은 모양이라 돌아도 배치가 무너지지 않는다.
  ordered.forEach((spot, index) => {
    spot.s0 = (index / ordered.length) * path.total;
  });
});

const CAMERAS = SPOTS;

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
        const at = pointAt(RING_PATHS[camera.ring], camera.s0 - moved[camera.ring]);
        node.style.setProperty('--ox', (at.x - camera.x).toFixed(2));
        node.style.setProperty('--oy', (at.y - camera.y).toFixed(2));
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
                '--ox': 0, // 돌기 전에는 시안 자리 그대로
                '--oy': 0,
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
