import { useEffect, useRef, useState } from 'react';
import CornerBrackets from './CornerBrackets.jsx';
import styles from './FeatureShowcase.module.css';

/**
 * Figma 주석("04, 05, 06 레이어는 하나의 화면")대로 기능 3종을 하나의 화면으로 구현한다.
 * 디자인은 Figma 그대로이고, 스크롤하면 화면이 고정(sticky)된 채 기능이 01→02→03으로 바뀐다(kinoria.studio 방식).
 * 흐린 문장을 누르면 그 기능 위치로 스크롤된다.
 */
export default function FeatureShowcase({ heading, features, background }) {
  const trackRef = useRef(null);
  const [pos, setPos] = useState(0); // 0 ~ count-1 : 스크롤에 따라 연속으로 변하는 위치
  const count = features.length;
  const index = Math.round(pos);
  const active = features[index];

  const targetRef = useRef(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let current = 0;
    let last = 0;

    // 스크롤 위치 → 목표 위치(0 ~ count-1)
    const readTarget = () => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(Math.max(-rect.top / scrollable, 0), 1) : 0;
      targetRef.current = Math.min(Math.max(progress * count - 0.5, 0), count - 1);
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
      readTarget();
      const goal = targetRef.current;
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

    readTarget();
    current = targetRef.current;
    setPos(settle(current));
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('resize', wake);
    return () => {
      window.removeEventListener('scroll', wake);
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

  const lerp = (from, to, t) => from + (to - from) * t;
  const clamp01 = (value) => Math.min(Math.max(value, 0), 1);

  // 프레임(04·05·06)별 레이아웃을 스크롤 위치에 맞춰 이어 붙인다
  const lowerIndex = Math.min(Math.floor(pos), count - 2);
  const t = pos - lowerIndex;
  const from = features[lowerIndex].layout;
  const to = features[lowerIndex + 1].layout;
  const L = Object.fromEntries(Object.keys(from).map((key) => [key, lerp(from[key], to[key], t)]));
  const slot1 = L.mainY + L.pitch1;
  const slot2 = slot1 + L.pitch2;

  // KINORIA 방식: 하나의 긴 목록이 스크롤에 맞춰 위로 올라간다.
  // 지나간 문구는 계속 위로 올라가며 점점 투명해지고, 아래에 올라올 문구가 없으면 아무것도 그리지 않는다.
  const motionOf = (i) => {
    const d = i - pos;
    let y;
    if (d < 0) y = L.mainY + d * L.pitch1;
    else if (d <= 1) y = L.mainY + d * L.pitch1;
    else y = slot1 + (d - 1) * L.pitch2;
    let alpha;
    if (d < 0) alpha = clamp01(1 + d * 1.5);
    else if (d <= 1) alpha = lerp(1, L.below1, d);
    else alpha = lerp(L.below1, L.below2, clamp01(d - 1));
    return { y, alpha };
  };
  const lineAlpha = (steps) => clamp01(count - 1 - steps - pos);

  return (
    <div ref={trackRef} className={styles.track} style={{ '--count': count }}>
      <div className={styles.sticky}>
        <img className={styles.background} src={background} alt="" />
        <section
          className={styles.section}
          style={{ '--lx': L.x, '--ltag': L.tagY, '--lw': L.lineW, '--fy': active.frameTop }}
          aria-label={heading}
        >
          {/* 이미지는 모두 겹쳐 두고 투명도만 바꿔서 서로 자연스럽게 교차(크로스페이드)한다 */}
          {features.map((feature) => (
            <img
              key={feature.id}
              className={`${styles.image} ${feature.id === active.id ? styles.on : ''}`}
              style={{ '--iy': feature.imageTop, '--is': feature.imageSize }}
              src={feature.image}
              alt={feature.id === active.id ? feature.headline : ''}
            />
          ))}
          <CornerBrackets className={styles.frame} />

          <span className={styles.tagPill} aria-hidden="true" />
          <p className={styles.tagCode}>{active.tag}</p>
          <p className={styles.tagLabel}>{active.tagLabel}</p>

          <span
            className={styles.rule}
            style={{ '--y': slot1 - L.gap, opacity: lineAlpha(0) }}
            aria-hidden="true"
          />
          <span
            className={styles.rule}
            style={{ '--y': slot2 - L.gap, opacity: lineAlpha(1) }}
            aria-hidden="true"
          />

          {/* 문구 3개: 스크롤 위치에 따라 연속으로 이동한다 */}
          {features.map((feature, i) => {
            const { y, alpha } = motionOf(i);
            return (
              <button
                key={feature.id}
                type="button"
                className={`${styles.headline} ${i === index ? styles.current : ''}`}
                style={{ '--y': y, '--fs': L.fs, color: `rgba(21, 21, 21, ${alpha})`, pointerEvents: alpha < 0.05 ? 'none' : undefined }}
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
