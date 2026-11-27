import { useEffect, useMemo, useRef, useState } from 'react';
import { SHOWCASE_CAMERAS, SHOWCASE_STAGE } from '../../data/compareShowcaseCameras.js';
import styles from './CompareHero.module.css';

/*
 * 카메라 등장 모션의 시간표(ms). 시안(Figma 3398:1641)에는 시간 값이 없어서 참고 사이트(Vitra 의자 고르기)의 느낌을 보고 정한 임시 값이다.
 *  1) grid    카메라 28대가 격자로 나열되며 하나씩 나타난다
 *  2) scatter 12대만 가장자리에 남고 나머지는 바깥으로 흩어진다
 *  3) final   22대가 빠르게 제자리로 모이고, 가운데에 문구가 나타난다 (가운데 6대는 돌아오지 않는다)
 */
const SCATTER_AT = 2000; // grid 가 시작하고 이만큼 뒤에 흩어진다
const FINAL_AT = 3000; // grid 가 시작하고 이만큼 뒤에 모인다
const OUT_DISTANCE = 1100; // 흩어져 나갈 때 화면 중심에서 바깥으로 밀려나는 거리(시안 px)

/*
 * 모션이 끝난 뒤의 움직임 (Framer "Motion Parallax Pro" 를 참고한 임시 값 — 시안에서 확정된 수치가 아니다)
 *  - 마우스가 가는 쪽으로 카메라가 따라 움직이고, 카메라마다 깊이(DEPTHS)가 달라 움직이는 양이 다르다.
 *  - 마우스가 없는 터치 화면과 모션 감소 설정에서는 움직이지 않는다.
 */
const PARALLAX_AFTER = 900; // 모이는 모션(850ms)이 끝난 뒤부터 마우스를 따라간다
const PARALLAX_REACH = 48; // 시안 1920 기준 최대 이동량(px). 화면 폭에 비례해 줄고 늘어난다
const PARALLAX_EASE = 0.09; // 클수록 마우스를 빨리 따라온다
const DEPTHS = [0.7, 1.05, 0.85, 1.15, 0.65, 0.95, 1.25, 1.1, 0.75, 1.2, 0.8, 1, 0.7, 0.9]; // 카메라 순서대로 돌려 쓴다

const CENTER = { x: SHOWCASE_STAGE.width / 2, y: SHOWCASE_STAGE.height / 2 };

/** 카메라마다 자리·이동량·모션 지연을 미리 계산한다. 이미지 안쪽 여백이 같아서 가로·세로 중 큰 쪽의 정사각형으로 둔다 */
const CAMERAS = SHOWCASE_CAMERAS.map((camera, index) => {
  const box = (rect) => {
    const size = Math.max(rect.w, rect.h);
    return { x: rect.x + (rect.w - size) / 2, y: rect.y + (rect.h - size) / 2, size };
  };
  const grid = box(camera);
  const gridCenter = { x: grid.x + grid.size / 2, y: grid.y + grid.size / 2 };
  let role = camera.kept ? 'swing' : 'gone'; // swing: 나갔다가 돌아옴 · gone: 나가고 안 돌아옴
  let edge = { x: 0, y: 0 };
  if (camera.scatter) {
    role = 'edge'; // 가장자리에 남는 카메라
    const scatter = box(camera.scatter);
    edge = { x: scatter.x + scatter.size / 2 - gridCenter.x, y: scatter.y + scatter.size / 2 - gridCenter.y };
  }
  const dx = gridCenter.x - CENTER.x;
  const dy = gridCenter.y - CENTER.y;
  const length = Math.hypot(dx, dy) || 1;
  return {
    id: camera.id,
    src: camera.src,
    depth: DEPTHS[index % DEPTHS.length],
    role,
    grid,
    edge,
    out: { x: (dx / length) * OUT_DISTANCE, y: (dy / length) * OUT_DISTANCE },
    pop: ((index * 0.6180339887) % 1) * 0.5, // 나열될 때 하나씩 나타나는 순서(초)
    stagger: ((index * 0.3819660113) % 1) * 0.2, // 흩어지고 모일 때 조금씩 어긋나는 정도(초)
  };
});

/**
 * Compare 히어로 — 카메라가 격자로 나열됐다가 흩어지고 다시 모이며 가운데에 안내 문구와 "찾아보기" 버튼이 나온다. (Figma 3398:1641)
 * animate 가 true 면 play 가 true 가 되는 순간(진입 화면이 사라지기 시작할 때)부터 모션을 한 번 재생하고, false 면 마지막 모습으로 바로 보여 준다.
 * 카메라는 장식이라 스크린리더에서는 숨기고, 문구는 전부 텍스트로 올린다.
 * "찾아보기"를 누르면 ComparePage 가 (onStart) 히어로를 사라지게 하고 그 자리에 채팅 화면을 띄운다. 스크롤로 이동하지 않는다.
 */
export default function CompareHero({ onStart, leaving = false, animate = false, play = true, onPlayed }) {
  const reduceMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [stage, setStage] = useState(animate && !reduceMotion.current ? 'wait' : 'final'); // wait | grid | scatter | final
  const playedRef = useRef(onPlayed);

  useEffect(() => {
    playedRef.current = onPlayed;
  }, [onPlayed]);

  const timers = useRef([]);

  // 모션을 시작한다. 단계가 바뀔 때마다 타이머가 지워지지 않도록, 타이머는 ref 에 두고 화면이 사라질 때만 지운다.
  useEffect(() => {
    if (stage !== 'wait' || !play) return;
    playedRef.current?.();
    setStage('grid');
    timers.current = [setTimeout(() => setStage('scatter'), SCATTER_AT), setTimeout(() => setStage('final'), FINAL_AT)];
  }, [stage, play]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const ready = stage === 'final';
  const heroRef = useRef(null);
  const stageRef = useRef(null);

  // 마우스 패럴랙스 — 마우스 위치를 CSS 변수(--mx, --my)로 넘기고, 카메라마다 깊이를 곱해 움직인다(CSS 의 translate)
  useEffect(() => {
    const hero = heroRef.current;
    const area = stageRef.current;
    if (!ready || !hero || !area) return undefined;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!canHover || reduceMotion.current) return undefined;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let frame = 0;
    let listening = false;

    const tick = () => {
      currentX += (targetX - currentX) * PARALLAX_EASE;
      currentY += (targetY - currentY) * PARALLAX_EASE;
      area.style.setProperty('--mx', `${currentX.toFixed(2)}px`);
      area.style.setProperty('--my', `${currentY.toFixed(2)}px`);
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
      targetX = nx * reach;
      targetY = ny * reach;
      wake();
    };
    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      wake();
    };
    const start = () => {
      listening = true;
      window.addEventListener('pointermove', onMove, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);
    };
    const timer = setTimeout(start, PARALLAX_AFTER);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      if (listening) {
        window.removeEventListener('pointermove', onMove);
        document.documentElement.removeEventListener('pointerleave', onLeave);
      }
    };
  }, [ready]);

  return (
    <header ref={heroRef} className={styles.hero} data-leaving={leaving}>
      <div ref={stageRef} className={styles.stage} data-stage={stage} aria-hidden="true">
        {CAMERAS.map((camera) => (
          <img
            key={camera.id}
            className={styles.camera}
            data-role={camera.role}
            src={camera.src}
            alt=""
            draggable="false"
            style={{
              '--x': camera.grid.x,
              '--y': camera.grid.y,
              '--size': camera.grid.size,
              '--depth': camera.depth,
              '--ex': camera.edge.x,
              '--ey': camera.edge.y,
              '--ox': camera.out.x.toFixed(1),
              '--oy': camera.out.y.toFixed(1),
              '--pop': `${camera.pop.toFixed(2)}s`,
              '--stagger': `${camera.stagger.toFixed(2)}s`,
            }}
          />
        ))}
      </div>
      <div className={styles.copy} data-ready={ready}>
        <p className={styles.eyebrow}>Find &amp; Compare</p>
        <h1 className={styles.title}>Which Polaroid camera is right for you?</h1>
        <p className={styles.subtitle}>
          나에게 맞는 카메라를 찾고,
          <br />
          가격과 기능까지 비교해 보세요.
        </p>
        <button type="button" className={styles.cta} onClick={onStart} disabled={leaving || !ready}>
          찾아보기
        </button>
      </div>
    </header>
  );
}
