import { useEffect, useRef, useState } from 'react';
import frameSvg from '@/assets/cameras/main/viewfinder-frame.svg';
import arrowSvg from '@/assets/cameras/main/arrow-circle.svg';
import styles from './LineupCarousel.module.css';

/**
 * 2. 카메라 라인업 — 뷰파인더 프레임 가운데 카메라 + 양옆 흐린 카메라 (시안 높이 1764)
 * - 6개 모델(Now · Now+ · Flip · Mod · I-2 · Go)이 차례로 가운데에 온다.
 * - 3초마다 오른쪽 카메라가 가운데로 들어오며 오른쪽 → 왼쪽으로 넘어간다.
 *   (끌고 있는 동안, 키보드로 조작하는 동안, 화면 밖에 있을 때, 동작 줄이기 설정이면 멈춘다)
 * - 카메라를 마우스·손가락으로 잡고 좌우로 끌어서 넘길 수 있다. 양옆 카메라를 누르거나 ←/→ 키로도 넘긴다.
 * - 아래 모델 이름과 '제품 보러가기'(→ 아래 해당 모델 섹션 #model-{id})가 가운데 카메라에 맞춰 바뀐다.
 *
 * 시안 좌표: 무대(프레임 영역) 위쪽 = y 446. 보이는 세 자리의 가로 중심 x = 38.6 / 948 / 1866.4, 세로 중심 y = 738.
 * 나머지 카메라는 양쪽 화면 밖(-870.8 / 2784.8)에서 기다리다가 차례가 되면 미끄러져 들어온다.
 */
const SLOT_X = { '-2': -870.8, '-1': 38.6, 0: 948, 1: 1866.4, 2: 2784.8 };
const AUTOPLAY_MS = 3000;
const DRAG_START_PX = 6;

export default function LineupCarousel({ lineup, reducedMotion }) {
  const { items } = lineup;
  const n = items.length;
  const [{ active, prev }, setState] = useState({ active: lineup.initial, prev: lineup.initial });
  const [dragging, setDragging] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const drag = useRef(null);
  const suppressClick = useRef(false);

  /** 아이템 i 의 자리: 0 가운데 · -1 왼쪽 · 1 오른쪽 · 그 밖은 화면 밖 (-n/2 초과 ~ n/2 이하) */
  const slotOf = (i, a) => {
    let r = (((i - a) % n) + n) % n;
    if (r > n / 2) r -= n;
    return r;
  };
  const slotX = (r) => SLOT_X[Math.max(-2, Math.min(2, r))];

  const go = (dir) => setState((s) => ({ active: (s.active + dir + n) % n, prev: s.active }));
  const select = (i) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    const s = slotOf(i, active);
    if (s === -1 || s === 1) go(s);
  };

  // 섹션이 화면에 보일 때만 자동으로 넘긴다
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // 3초마다 다음 카메라로 (넘어갈 때마다 다시 3초를 센다)
  const paused = reducedMotion || !visible || focused || dragging;
  useEffect(() => {
    if (paused) return undefined;
    const t = setTimeout(() => go(1), AUTOPLAY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, paused]);

  /* ---------- 잡고 끌기 (마우스 · 터치 · 펜) ----------
   * - 위치는 화면 다시 그리기 직전(requestAnimationFrame)에 한 번만 반영해 끊김 없이 손을 따라온다.
   * - 한 칸(옆 자리까지의 거리)을 넘어서 끌면 고무줄처럼 저항이 생긴다.
   * - 놓을 때 충분히 끌었거나, 짧아도 빠르게 튕기면 그 방향으로 넘어간다.
   */
  const raf = useRef(0);
  const flushDrag = () => {
    raf.current = 0;
    const d = drag.current;
    stageRef.current?.style.setProperty('--drag', `${d ? d.offset : 0}px`);
  };
  const scheduleDrag = () => {
    if (!raf.current) raf.current = requestAnimationFrame(flushDrag);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  /** 옆 자리까지의 화면 거리(px) */
  const slotDistance = () => {
    const w = stageRef.current?.getBoundingClientRect().width ?? 1920;
    return ((SLOT_X[1] - SLOT_X[0]) * w) / 1920;
  };

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag.current = { id: e.pointerId, x: e.clientX, dx: 0, offset: 0, moving: false, samples: [] };
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    d.dx = e.clientX - d.x;
    if (!d.moving) {
      if (Math.abs(d.dx) < DRAG_START_PX) return;
      // 실제로 끌기 시작했을 때만 포인터를 잡는다 (그냥 누르기는 양옆 카메라 클릭으로 처리)
      d.moving = true;
      d.x = e.clientX; // 시작 문턱(6px)만큼 튀지 않도록 여기서부터 잰다
      d.dx = 0;
      stageRef.current?.setPointerCapture?.(e.pointerId);
      setDragging(true);
    }
    const S = slotDistance();
    const abs = Math.abs(d.dx);
    d.offset = Math.sign(d.dx) * (abs <= S ? abs : S + (abs - S) * 0.25);
    // 최근 100ms 의 움직임으로 놓는 순간의 속도를 잰다
    const now = performance.now();
    d.samples.push([now, e.clientX]);
    while (d.samples.length > 2 && now - d.samples[0][0] > 100) d.samples.shift();
    scheduleDrag();
  };

  const endDrag = (e, cancelled = false) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.moving) return;
    // 끌기가 끝난 직후 생기는 클릭은 무시한다
    suppressClick.current = true;
    setTimeout(() => {
      suppressClick.current = false;
    }, 0);
    const [t0, x0] = d.samples[0] ?? [0, 0];
    const [t1, x1] = d.samples[d.samples.length - 1] ?? [0, 0];
    const velocity = t1 > t0 ? (x1 - x0) / (t1 - t0) : 0; // px/ms
    const S = slotDistance();
    const far = Math.abs(d.offset) > S * 0.18;
    const flick = Math.abs(velocity) > 0.45 && Math.sign(velocity) === Math.sign(d.offset);
    // 끈 위치에서 새 자리로 이어서 움직이도록 오프셋 해제와 넘기기를 같은 프레임에 한다
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    stageRef.current?.style.setProperty('--drag', '0px');
    setDragging(false);
    if (!cancelled && (far || flick)) go(d.offset < 0 ? 1 : -1);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    }
  };

  const current = items[active];

  const toModel = (e) => {
    const target = document.getElementById(`model-${current.id}`);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <section ref={sectionRef} className={styles.section} aria-labelledby="cameras-lineup-title">
      <h2 id="cameras-lineup-title" className={styles.title}>
        {lineup.title[0]}
        <br />
        {lineup.title[1]}
      </h2>

      <div
        ref={stageRef}
        className={`${styles.stage} ${dragging ? styles.dragging : ''}`}
        role="group"
        aria-roledescription="carousel"
        aria-label="카메라 라인업. 좌우 방향키로 카메라를 바꿀 수 있어요."
        tabIndex={0}
        onKeyDown={onKeyDown}
        onFocus={(e) => {
          // 키보드로 들어왔을 때만 멈춘다 (마우스로 누른 포커스는 무시)
          if (e.target.matches?.(':focus-visible')) setFocused(true);
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endDrag(e)}
        onPointerCancel={(e) => endDrag(e, true)}
      >
        <img className={styles.frame} src={frameSvg} alt="" width="902" height="676" draggable={false} />
        {items.map((item, i) => {
          const slot = slotOf(i, active);
          // 화면 밖 한쪽 끝에서 반대쪽 끝으로 옮겨 가는 카메라는 움직임 없이 바로 옮긴다
          const wraps = Math.abs(slotOf(i, prev) - slot) > 1;
          const isCenter = slot === 0;
          const isSide = slot === -1 || slot === 1;
          const style = { '--cx': slotX(slot), '--w': item.size[0], '--h': item.size[1] };
          const cls = [
            styles.camera,
            isCenter ? styles.center : styles.side,
            item.shadow ? styles.shadow : '',
            wraps ? styles.wrap : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={item.id}
              type="button"
              className={cls}
              style={style}
              onClick={() => select(i)}
              tabIndex={isSide ? 0 : -1}
              aria-hidden={!isSide}
              aria-label={`${slot < 0 ? '이전' : '다음'} 카메라: ${item.name}`}
            >
              <img src={item.src} alt={isCenter ? item.alt : ''} draggable={false} />
            </button>
          );
        })}
      </div>

      <div className={styles.caption}>
        <p className={styles.name} aria-live="polite">
          <span key={current.id} className={styles.nameText}>
            {current.name}
          </span>
        </p>
        <a className={styles.link} href={`#model-${current.id}`} onClick={toModel}>
          <span>{lineup.linkLabel}</span>
          <img src={arrowSvg} alt="" width="57" height="57" />
        </a>
      </div>
    </section>
  );
}
