import { useEffect, useRef, useState } from 'react';
import CornerBrackets from './CornerBrackets.jsx';
import styles from './FeatureShowcase.module.css';

/**
 * 04~06 Feature — Figma "04/05/06 Feature" 디자인 + KINORIA(kinoria.studio) 스크롤 효과.
 * 세 프레임은 하나의 화면이고(Figma 주석), 화면이 고정(sticky)된 채 스크롤에 맞춰
 * 이미지가 크로스페이드되고 문구 목록이 위로 올라간다.
 * 스크롤 값은 관성 보간을 거쳐 반영되고, 각 기능 위치 근처에서는 잠시 머문다.
 */

// Figma 04·05·06 공통 좌표(px, 1920 기준). d = 목록에서 활성 위치까지의 거리(0 = 활성)
const Y_AT = [
  [-2, 302], // Headline Stack 첫 줄
  [-1, 389],
  [0, 485], // 두 점선 사이의 활성 문구
  [1, 581],
];
const ALPHA_AT = [
  [-3, 0],
  [-2, 0.04],
  [-1, 0.2],
  [0, 1],
  [1, 0.2],
  [2, 0],
];

const lerp = (from, to, t) => from + (to - from) * t;

// 구간 선형 보간. 범위 밖은 첫/마지막 구간의 기울기로 이어간다(y) 또는 끝값을 유지한다(alpha)
const sample = (points, d, extrapolate) => {
  if (d <= points[0][0]) {
    if (!extrapolate) return points[0][1];
    const [[d0, v0], [d1, v1]] = points;
    return v0 + ((d - d0) * (v1 - v0)) / (d1 - d0);
  }
  const last = points.length - 1;
  if (d >= points[last][0]) {
    if (!extrapolate) return points[last][1];
    const [[d0, v0], [d1, v1]] = [points[last - 1], points[last]];
    return v1 + ((d - d1) * (v1 - v0)) / (d1 - d0);
  }
  for (let i = 0; i < last; i += 1) {
    const [d0, v0] = points[i];
    const [d1, v1] = points[i + 1];
    if (d <= d1) return lerp(v0, v1, (d - d0) / (d1 - d0));
  }
  return points[last][1];
};

export default function FeatureShowcase({ heading, features }) {
  const trackRef = useRef(null);
  const [pos, setPos] = useState(0); // 0 ~ count-1 : 스크롤에 따라 연속으로 변하는 위치
  const count = features.length;
  const index = Math.round(pos);
  const active = features[index];

  // 영상은 해당 기능이 활성이 될 때마다 처음(0초)부터 재생하고, 비활성이 되면(크로스페이드가 끝난 뒤) 멈춘다.
  const videoRefs = useRef(new Map());
  useEffect(() => {
    const timers = [];
    videoRefs.current.forEach((video, id) => {
      if (id === active.id) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        timers.push(setTimeout(() => video.pause(), 750));
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [active.id]);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let current = 0;
    let last = 0;

    // 스크롤 위치 → 목표 위치(0 ~ count-1)
    const readTarget = () => {
      const track = trackRef.current;
      if (!track) return 0;
      const rect = track.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(Math.max(-rect.top / scrollable, 0), 1) : 0;
      return Math.min(Math.max(progress * count - 0.5, 0), count - 1);
    };

    // 각 기능 위치(정수) 근처에서는 정확히 그 위치에 머물고, 그 사이에서만 부드럽게 이동한다
    const settle = (value) => {
      const base = Math.floor(value);
      const f = Math.min(Math.max((value - base - 0.12) / 0.76, 0), 1);
      return base + f * f * (3 - 2 * f);
    };

    // 매 프레임 목표를 향해 관성 있게 따라간다(프레임 속도와 무관한 감쇠)
    const tick = (now) => {
      const dt = Math.min((now - (last || now)) / 1000, 0.05);
      last = now;
      const goal = readTarget();
      current = reduceMotion ? goal : current + (goal - current) * (1 - Math.exp(-dt / 0.22));
      if (Math.abs(goal - current) < 0.0005) current = goal;
      setPos(settle(current));
      if (current !== goal) frame = requestAnimationFrame(tick);
      else {
        frame = 0;
        last = 0;
      }
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    // 스크롤이 멈추면 가장 가까운 기능 위치로 스크롤을 맞춘다 → 문구가 두 점선 사이에 딱 들어간다
    let idleTimer = 0;
    const snap = () => {
      const track = trackRef.current;
      if (!track) return;
      const goal = readTarget();
      const nearest = Math.round(goal);
      if (Math.abs(goal - nearest) < 0.02) return;
      const rect = track.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      if (scrollable <= 0) return;
      const top = rect.top + window.scrollY;
      window.scrollTo({
        top: top + ((nearest + 0.5) / count) * scrollable,
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
    };
    const onScroll = () => {
      wake();
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(snap, 150);
    };

    current = readTarget();
    setPos(settle(current));
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', wake);
    return () => {
      window.clearTimeout(idleTimer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', wake);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [count]);

  const goTo = (id) => {
    const track = trackRef.current;
    const target = features.findIndex((feature) => feature.id === id);
    if (!track || target < 0) return;
    const scrollable = track.offsetHeight - window.innerHeight;
    const top = track.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + ((target + 0.5) / count) * scrollable, behavior: 'smooth' });
  };

  return (
    <div ref={trackRef} className={styles.track} style={{ '--count': count }}>
      <div className={styles.sticky}>
        <section className={styles.section} aria-label={heading}>
          {/* 이미지는 겹쳐 두고 투명도만 바꿔서 서로 자연스럽게 교차(크로스페이드)한다 */}
          {features.map((feature) => {
            const on = feature.id === active.id;
            const className = `${styles.image} ${on ? styles.on : ''}`;
            return feature.video ? (
              <video
                key={feature.id}
                ref={(node) => {
                  if (node) videoRefs.current.set(feature.id, node);
                  else videoRefs.current.delete(feature.id);
                }}
                className={className}
                src={feature.video}
                poster={feature.image}
                autoPlay
                loop
                muted
                playsInline
                aria-hidden="true"
              />
            ) : (
              <img key={feature.id} className={className} src={feature.image} alt={on ? feature.headline : ''} />
            );
          })}
          <CornerBrackets className={styles.frame} />

          <div className={styles.tagPill} aria-hidden="true" />
          <p className={styles.tagCode}>{active.tag}</p>
          <p className={styles.tagLabel}>{active.tagLabel}</p>

          <span className={`${styles.rule} ${styles.ruleTop}`} aria-hidden="true" />
          <span className={`${styles.rule} ${styles.ruleBottom}`} aria-hidden="true" />

          {/* 문구 목록: 스크롤 위치에 따라 y·투명도가 연속으로 바뀐다 */}
          {features.map((feature, i) => {
            const d = i - pos;
            const y = sample(Y_AT, d, true);
            const alpha = sample(ALPHA_AT, d, false);
            return (
              <button
                key={feature.id}
                type="button"
                className={`${styles.headline} ${i === index ? styles.current : ''}`}
                style={{
                  '--y': y,
                  color: `rgba(255, 255, 255, ${alpha})`,
                  pointerEvents: alpha < 0.05 ? 'none' : undefined,
                }}
                aria-current={i === index}
                onClick={() => goTo(feature.id)}
              >
                {feature.headline}
              </button>
            );
          })}
        </section>
      </div>
    </div>
  );
}
