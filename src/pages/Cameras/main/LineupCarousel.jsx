import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
 * 움직임 구조 (끊김·순간이동 방지)
 * - 위치는 하나의 연속값 pos(가운데에 온 카메라 번호, 소수 포함)로만 관리한다.
 *   넘기기·끌기·자동 넘기기 모두 pos 를 바꾸고, requestAnimationFrame 이 매 프레임 pos 를 목표값으로 부드럽게 따라가게 한다.
 *   그래서 넘어가는 도중에 다시 잡아도 지금 보이는 자리에서 그대로 이어진다.
 * - 카메라는 transform 으로만 옮기고, 흐림은 미리 흐리게 그려 둔 복사본의 투명도만 바꿔 표현한다(매 프레임 흐림을 다시 그리지 않는다).
 *
 * 시안 좌표: 무대(프레임 영역) 위쪽 = y 446, 가운데 x = 948, 옆 자리 간격 913.9, 세로 중심 y = 738.
 */
const CENTER_X = 948;
const SLOT_GAP = 913.9;
/** 무대 축소 비율 — LineupCarousel.module.css 의 .stage --s 와 같은 값 */
const STAGE_SCALE = 0.8;
const AUTOPLAY_MS = 3000;
const DRAG_START_PX = 6;
/** 목표 자리로 따라가는 시간 상수(ms) — 작을수록 빠르다. 약 3배 시간이면 거의 도착 */
const EASE_MS = 150;

export default function LineupCarousel({ lineup, reducedMotion }) {
  const { items } = lineup;
  const n = items.length;
  const [active, setActive] = useState(lineup.initial);
  const [dragging, setDragging] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const camRefs = useRef([]);
  const motion = useRef({ pos: lineup.initial, target: lineup.initial, raf: 0, last: 0 });
  const drag = useRef(null);
  const suppressClick = useRef(false);

  const mod = (v) => ((v % n) + n) % n;
  /** pos 기준 아이템 i 의 자리(-n/2 이상 n/2 미만): 0 가운데 · -1 왼쪽 · 1 오른쪽 */
  const offsetOf = (i, pos) => {
    let r = mod(i - pos);
    if (r >= n / 2) r -= n;
    return r;
  };

  /* ---------- 화면에 그리기 ---------- */
  const render = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const scale = stage.clientWidth / 1920;
    const { pos } = motion.current;
    items.forEach((_, i) => {
      const el = camRefs.current[i];
      if (!el) return;
      const r = offsetOf(i, pos);
      const x = (CENTER_X + r * SLOT_GAP * STAGE_SCALE) * scale;
      el.style.transform = `translate3d(${x}px, 0, 0) translate(-50%, -50%)`;
      el.style.setProperty('--blur-mix', Math.min(1, Math.abs(r)).toFixed(3));
      el.style.zIndex = String(10 - Math.round(Math.abs(r) * 2));
      // 화면 밖(2칸 넘게 떨어진 자리)은 그리지 않는다 — 반대편 끝으로 옮겨 가는 순간도 보이지 않는다
      el.style.visibility = Math.abs(r) > 2.2 ? 'hidden' : 'visible';
    });
    const center = mod(Math.round(pos));
    setActive((a) => (a === center ? a : center));
  };

  const tick = (now) => {
    const m = motion.current;
    const dt = m.last ? Math.min(64, now - m.last) : 16;
    m.last = now;
    if (!drag.current?.moving) {
      m.pos = m.target + (m.pos - m.target) * Math.exp(-dt / EASE_MS);
      if (Math.abs(m.pos - m.target) < 0.0005) m.pos = m.target;
    }
    render();
    if (m.pos !== m.target || drag.current?.moving) {
      m.raf = requestAnimationFrame(tick);
    } else {
      m.raf = 0;
      m.last = 0;
    }
  };

  const kick = () => {
    const m = motion.current;
    if (reducedMotion && !drag.current?.moving) m.pos = m.target;
    if (!m.raf) m.raf = requestAnimationFrame(tick);
  };

  /** 지금 목표에서 dir 칸 이동 */
  const go = (dir) => {
    const m = motion.current;
    m.target = Math.round(m.target) + dir;
    kick();
  };

  // 처음 배치 + 화면 폭이 바뀌면 다시 배치
  useLayoutEffect(() => {
    render();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => render()) : null;
    if (ro && stageRef.current) ro.observe(stageRef.current);
    const m = motion.current;
    return () => {
      ro?.disconnect();
      cancelAnimationFrame(m.raf);
      m.raf = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = (i) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    const r = Math.round(offsetOf(i, motion.current.target));
    if (r === -1 || r === 1) go(r);
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

  /* ---------- 잡고 끌기 (마우스 · 터치 · 펜) ---------- */
  /** 옆 자리까지의 화면 거리(px) */
  const slotPx = () => ((stageRef.current?.clientWidth ?? 1920) / 1920) * SLOT_GAP * STAGE_SCALE;

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag.current = { id: e.pointerId, x: e.clientX, startPos: 0, moving: false, samples: [] };
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (!d.moving) {
      if (Math.abs(e.clientX - d.x) < DRAG_START_PX) return;
      // 실제로 끌기 시작했을 때만 포인터를 잡는다 (그냥 누르기는 양옆 카메라 클릭으로 처리)
      d.moving = true;
      d.x = e.clientX;
      // 넘어가는 중이었다면 지금 보이는 위치에서 바로 잡는다
      d.startPos = motion.current.pos;
      stageRef.current?.setPointerCapture?.(e.pointerId);
      setDragging(true);
      kick();
    }
    motion.current.pos = d.startPos - (e.clientX - d.x) / slotPx();
    const now = performance.now();
    d.samples.push([now, e.clientX]);
    while (d.samples.length > 2 && now - d.samples[0][0] > 100) d.samples.shift();
  };

  const endDrag = (e) => {
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
    const v = t1 > t0 ? (x1 - x0) / (t1 - t0) : 0; // px/ms
    const m = motion.current;
    // 놓는 순간의 속도만큼 조금 더 나아간 곳에서 가장 가까운 자리로 (지금 자리에서 최대 한 칸)
    const base = Math.round(m.pos);
    const projected = Math.round(m.pos - (v * 180) / slotPx());
    m.target = Math.max(base - 1, Math.min(base + 1, projected));
    // 조금만 끌었어도 빠르게 튕겼다면 그 방향으로 한 칸
    if (m.target === Math.round(d.startPos) && Math.abs(v) > 0.45) m.target += v < 0 ? 1 : -1;
    setDragging(false);
    kick();
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
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <img className={styles.frame} src={frameSvg} alt="" width="902" height="676" draggable={false} />
        {items.map((item, i) => {
          const r = Math.round(offsetOf(i, active));
          const isCenter = r === 0;
          const isSide = r === -1 || r === 1;
          return (
            <button
              key={item.id}
              ref={(el) => {
                camRefs.current[i] = el;
              }}
              type="button"
              className={`${styles.camera} ${item.shadow ? styles.shadow : ''}`}
              style={{ '--w': item.size[0], '--h': item.size[1] }}
              onClick={() => select(i)}
              tabIndex={isSide ? 0 : -1}
              aria-hidden={!isSide}
              aria-label={`${r < 0 ? '이전' : '다음'} 카메라: ${item.name}`}
            >
              {/* 선명한 그림 + 미리 흐리게 그린 그림을 겹쳐 두고, 가운데에서 멀어질수록 흐린 쪽이 보인다 */}
              <span className={styles.layer}>
                <img src={item.src} alt={isCenter ? item.alt : ''} draggable={false} />
              </span>
              <span className={`${styles.layer} ${styles.blurred}`} aria-hidden="true">
                <img src={item.src} alt="" draggable={false} />
              </span>
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
