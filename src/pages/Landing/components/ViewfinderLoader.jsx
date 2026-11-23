import { useEffect, useRef, useState } from 'react';
import styles from './ViewfinderLoader.module.css';

/**
 * Loading — 카메라 뷰파인더 (담당: 곽세희)
 * 기준 시안: Figma "All (최신작업)" › Main Page › loading_page (1920 × 1080) · 레퍼런스: KINORIA
 *
 * 1. 로딩: 뷰파인더 창 안의 영상이 실제 로딩률에 맞춰 흐릿함 → 선명함 (초점)
 * 2. 진입: 초점이 맞으면 뷰파인더가 화면 밖으로 확장되며 사라지고, 영상이 화면 전체를 채운다
 * 진입이 끝나면 onComplete 를 부른다. 다음 장면 연결은 Landing 이 정한다.
 */
const ASSETS = {
  bezel: '/assets/landing/viewfinder-bezel.jpg',
  mask: '/assets/landing/viewfinder-mask.svg',
  video: '/assets/landing/hero.mp4',
  poster: '/assets/landing/hero-poster.jpg',
};
const MIN_LOADING_MS = 2600; // 초점이 맞춰지는 연출을 보여주기 위한 최소 시간
const HOLD_MS = 350; // 초점이 맞은 뒤 잠깐 멈춤
const ENTER_MS = 1700; // 뷰파인더가 확장되며 사라지는 시간
const SCALE_TICKS = 13;
const WEIGHTS = { bezel: 0.25, video: 0.6, fonts: 0.15 };

// 베젤 아트(1920 × 1081) 안의 창 위치
const BEZEL = { w: 1920, h: 1081, win: { x: 552, y: 167, w: 814, h: 761, r: 74 } };

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeInOutQuart = (t) => (t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2);

export default function ViewfinderLoader({ onComplete }) {
  const rootRef = useRef(null);
  const frameRef = useRef(null);
  const shotRef = useRef(null);
  const bezelRef = useRef(null);
  const videoRef = useRef(null);
  const pctRef = useRef(null);
  const scaleRef = useRef(null);
  const [ready, setReady] = useState(false); // 베젤 이미지가 준비되면 검은 화면을 걷어냄
  const [phase, setPhase] = useState('loading'); // loading → focused → entered
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const root = rootRef.current;
    const shot = shotRef.current;
    const video = videoRef.current;
    const bezel = bezelRef.current;
    const ticks = [...scaleRef.current.children];
    const parts = { bezel: 0, video: 0, fonts: 0 };
    const setPart = (k, v) => { parts[k] = Math.max(parts[k], Math.min(1, v)); };
    const target = () => Object.keys(parts).reduce((s, k) => s + parts[k] * WEIGHTS[k], 0);

    const onBezel = () => { setPart('bezel', 1); setReady(true); };
    if (bezel.complete && bezel.naturalWidth) onBezel();
    else {
      bezel.addEventListener('load', onBezel, { once: true });
      bezel.addEventListener('error', onBezel, { once: true });
    }

    const onVideoDone = () => setPart('video', 1);
    const onVideoProgress = () => {
      try {
        const b = video.buffered;
        if (b.length && video.duration) setPart('video', b.end(b.length - 1) / video.duration);
      } catch { /* noop */ }
    };
    if (video.readyState >= 3) onVideoDone();
    video.addEventListener('canplaythrough', onVideoDone, { once: true });
    video.addEventListener('error', onVideoDone, { once: true });
    video.addEventListener('progress', onVideoProgress);
    video.play?.().catch(() => {});
    const timeout = setTimeout(onVideoDone, 9000); // 느린 영상이 페이지를 막지 않도록

    (document.fonts?.ready ?? Promise.resolve()).then(() => setPart('fonts', 1));

    // 화면 좌표 계산 — CSS 의 --frame-w 와 같은 규칙
    const geometry = () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const fw = vw / vh < 1 ? vw * (BEZEL.w / BEZEL.win.w) * 0.94 : Math.max(vw, (vh * BEZEL.w) / BEZEL.h);
      const fh = (fw * BEZEL.h) / BEZEL.w;
      const k = fw / BEZEL.w;
      const fx = (vw - fw) / 2, fy = (vh - fh) / 2;
      const w = BEZEL.win;
      return { vw, vh, rect: [fx + w.x * k, fy + w.y * k, w.w * k, w.h * k], r: w.r * k };
    };
    const placeShot = ([x, y, w, h], r) => {
      shot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      shot.style.width = `${w}px`;
      shot.style.height = `${h}px`;
      shot.style.borderRadius = `${r}px`;
    };

    const start = performance.now();
    let shown = 0;
    let last = start;
    let raf = 0;
    let focusedAt = 0;
    let stage = 'loading';

    const frame = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const g = geometry();

      if (stage === 'loading') {
        const timeCap = Math.min(1, (now - start) / MIN_LOADING_MS);
        const goal = Math.min(target(), timeCap);
        shown += (goal - shown) * (1 - Math.exp(-dt * 4.5));
        if (goal >= 0.999 && shown > 0.995) shown = 1;
        root.style.setProperty('--progress', shown.toFixed(4));
        pctRef.current.textContent = `${Math.round(shown * 100)}%`;
        const needle = shown * (SCALE_TICKS - 1);
        ticks.forEach((t, i) => { t.dataset.on = Math.abs(i - needle) < 1.6 ? 'true' : 'false'; });
        placeShot(g.rect, g.r);
        if (shown >= 1) {
          stage = 'focused';
          focusedAt = now;
          setPhase('focused');
        }
      }

      if (stage === 'focused') {
        const k = clamp((now - focusedAt - HOLD_MS) / ENTER_MS);
        const e = easeInOutQuart(k);
        // 뷰파인더(베젤)는 창 중심을 기준으로 커지고, 영상은 커지는 창을 따라가다 화면에 꼭 맞게 안착
        const s = 1 + 2.6 * Math.pow(e, 1.35);
        const [x, y, w, h] = g.rect;
        const cx = x + w / 2, cy = y + h / 2;
        const hole = [cx - (w * s) / 2, cy - (h * s) / 2, w * s, h * s];
        const full = [0, 0, g.vw, g.vh];
        placeShot(hole.map((v, i) => lerp(v, full[i], e)), lerp(g.r * s, 0, e));
        root.style.setProperty('--frame-s', s.toFixed(4));
        root.style.setProperty('--bezel-o', (1 - smooth(0.35, 0.92, k)).toFixed(3));
        root.style.setProperty('--hud-o', (1 - smooth(0, 0.22, k)).toFixed(3));
        if (k >= 1) {
          stage = 'entered';
          placeShot(full, 0);
          setPhase('entered');
          onCompleteRef.current?.();
        }
      }

      if (stage === 'entered') {
        placeShot([0, 0, g.vw, g.vh], 0); // 화면 크기가 바뀌어도 꽉 차게
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
      bezel.removeEventListener('load', onBezel);
      video.removeEventListener('canplaythrough', onVideoDone);
      video.removeEventListener('progress', onVideoProgress);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={styles.loader}
      data-ready={ready}
      data-phase={phase}
      role="status"
      aria-live="polite"
      aria-label={phase === 'loading' ? 'Loading' : 'Loaded'}
    >
      {/* 뷰파인더 창 안의 영상 — 진입 후에는 화면 전체 */}
      <div ref={shotRef} className={styles.shot}>
        <video
          ref={videoRef}
          className={styles.video}
          src={ASSETS.video}
          poster={ASSETS.poster}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      <div ref={frameRef} className={styles.frame}>
        {/* 창을 뚫은 베젤 */}
        <img
          ref={bezelRef}
          className={styles.bezel}
          style={{ '--mask': `url(${ASSETS.mask})` }}
          src={ASSETS.bezel}
          alt=""
          width="1920"
          height="1081"
          fetchPriority="high"
        />

        {/* HUD */}
        <div className={styles.hud} lang="en">
          <p className={styles.brand}>
            POLAROID <span className={styles.rainbow} aria-hidden="true" />
          </p>
          <p className={styles.state}>{phase === 'loading' ? 'LOADING...' : 'FOCUSED'}</p>
          <div className={styles.corners} aria-hidden="true">
            <i /><i /><i /><i />
          </div>
          <div className={styles.focus} aria-hidden="true" />
          <div ref={scaleRef} className={styles.scale} aria-hidden="true">
            {Array.from({ length: SCALE_TICKS }, (_, i) => <i key={i} />)}
          </div>
          <p className={styles.read}>
            <span>f 2.0</span>
            <span ref={pctRef} className={styles.pct}>0%</span>
            <span>1/60</span>
          </p>
        </div>
      </div>
      <div className={styles.black} />
    </div>
  );
}
