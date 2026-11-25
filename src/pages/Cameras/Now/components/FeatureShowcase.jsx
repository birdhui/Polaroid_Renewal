import { useEffect, useRef, useState } from 'react';
import styles from './FeatureShowcase.module.css';

/**
 * 04~06 Feature — Figma Frame 134~136 디자인. 세 프레임은 하나의 화면이고,
 * 화면이 고정(sticky)된 채 스크롤에 맞춰 다이얼 눈금이 돌아가고 문구·영상이 바뀐다.
 * 스크롤 값은 관성 보간을 거쳐 반영되고, 각 기능 위치 근처에서는 잠시 머문다.
 */

// 다이얼 눈금(Figma Frame 134: 눈금 36개를 원통에 감은 모양)
const DIAL = {
  cx: 80, // 중앙 눈금 왼쪽 x
  cy: 540, // 중앙 눈금 y
  radius: 229, // 원통 반지름(px)
  step: 3.15, // 눈금 사이 각도(도)
  maxAngle: 66, // 이 각도보다 먼 눈금은 그리지 않는다
  perFeature: 5, // 기능이 하나 바뀔 때 돌아가는 눈금 수(큰 눈금 간격)
};

const clamp01 = (v) => Math.min(Math.max(v, 0), 1);

// 기능 i 의 문구 블록 투명도: 활성일 때 1, 절반쯤 넘어가면 0
const blockAlpha = (d) => clamp01(1 - Math.abs(d) * 2.2);

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

  // 다이얼: 스크롤 위치(pos)만큼 눈금이 돌아간다
  const rotation = pos * DIAL.perFeature;
  const ticks = [];
  const from = Math.floor(rotation - 24);
  const to = Math.ceil(rotation + 24);
  for (let n = from; n <= to; n += 1) {
    const angle = (n - rotation) * DIAL.step;
    if (Math.abs(angle) > DIAL.maxAngle) continue;
    const rad = (angle * Math.PI) / 180;
    const c = Math.cos(rad);
    const major = ((n % 5) + 5) % 5 === 0;
    ticks.push(
      <i
        key={n}
        className={styles.tick}
        style={{
          left: `calc(${(DIAL.cx + 39 * (1 - c)).toFixed(2)} * var(--u))`,
          top: `calc(${(DIAL.cy + DIAL.radius * Math.sin(rad)).toFixed(2)} * var(--u))`,
          width: `calc(${((major ? 20 : 7) * c).toFixed(2)} * var(--u))`,
          opacity: (c * (major ? 0.8 : 0.45)).toFixed(3),
        }}
      />,
    );
  }

  return (
    <div ref={trackRef} className={styles.track} style={{ '--count': count }}>
      <div className={styles.sticky}>
        <section className={styles.section} aria-label={heading}>
          {/* 왼쪽 다이얼 눈금 + 라벨(Funtion 0N) */}
          <div className={styles.dial} aria-hidden="true">
            {ticks}
          </div>
          {features.map((feature, i) => (
            <p key={feature.id} className={styles.label} style={{ opacity: blockAlpha(i - pos) }} aria-hidden={i !== index}>
              {feature.label}
            </p>
          ))}

          {/* 가운데 문구 블록: 제목 · 선 · 부제 · 설명 (Figma Frame 137) */}
          {features.map((feature, i) => {
            const d = i - pos;
            const titleH = feature.titleLines.length * 72;
            return (
              <div
                key={feature.id}
                className={styles.block}
                style={{
                  opacity: blockAlpha(d),
                  transform: `translateY(calc(${(-d * 28).toFixed(2)} * var(--u)))`,
                  pointerEvents: i === index ? undefined : 'none',
                }}
                aria-hidden={i !== index}
              >
                <h3 className={styles.title}>
                  {feature.titleLines.map((line, k) => (
                    <span key={k}>{line}</span>
                  ))}
                </h3>
                <span className={styles.rule} style={{ '--y': titleH + 40 }} />
                <p className={styles.subtitle} style={{ '--y': titleH + 80 }}>
                  {feature.subtitle}
                </p>
                <p className={styles.description} style={{ '--y': titleH + 160 }}>
                  {feature.description}
                </p>
              </div>
            );
          })}

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
              <img key={feature.id} className={className} src={feature.image} alt="" />
            );
          })}
          {/* Figma Feature Frame: 569×569, 선 1.5 (#151515) */}
          <svg className={styles.frame} viewBox="0 0 571 571" fill="none" aria-hidden="true">
            <path
              d="M127.772 0.75H0.75V137.747M433.814 0.75H569.75V137.747M0.75 417.624V569.75L127.772 569.75M569.75 417.624V569.75L433.814 569.75"
              stroke="#151515"
              strokeWidth="1.5"
            />
          </svg>
        </section>
      </div>
    </div>
  );
}
