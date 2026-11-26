import { useEffect, useRef, useState } from 'react';
import styles from './FeatureShowcase.module.css';

/**
 * 04~06 Feature — Figma "Cameras - NOW_v2" Frame 135~137 디자인.
 * 세 프레임은 하나의 화면이고, 화면이 고정(sticky)된 채 스크롤에 맞춰 영상 필름 띠가 가로로 흐른다.
 *  - 가운데: 569×569 코너 브래킷 안에 524×524 영상(활성 기능)
 *  - 양옆: 341×341 타일(투명도 30%) — 다음/이전 기능이 필름 띠처럼 늘어서 있다
 *  - 스크롤하면 띠가 밀리면서 다음 기능의 타일이 가운데로 커져 들어오고, 문구는 아래에서 위로 교체된다
 * 스크롤 값은 관성 보간을 거쳐 반영되고, 각 기능 위치 근처에서는 잠시 머문다(멈추면 가장 가까운 기능에 맞춘다).
 */

// 필름 띠 슬롯(Figma 좌표, px). s = 가운데에서 떨어진 칸 수. 오른쪽(+)이 이전 기능, 왼쪽(−)이 다음 기능이다.
// Figma: F1 은 왼쪽에 타일 둘, F2 는 양옆 하나씩, F3 는 오른쪽에 타일 둘.
const SLOTS = [
  { s: -3, x: -467, y: 483, size: 341, o: 0 },
  { s: -2, x: -88, y: 483, size: 341, o: 0.3 },
  { s: -1, x: 291, y: 483, size: 341, o: 0.3 },
  { s: 0, x: 698, y: 278, size: 524, o: 1 },
  { s: 1, x: 1287, y: 483, size: 341, o: 0.3 },
  { s: 2, x: 1671, y: 483, size: 341, o: 0.3 },
  { s: 3, x: 2055, y: 483, size: 341, o: 0 },
];

const clamp01 = (v) => Math.min(Math.max(v, 0), 1);

// 슬롯 사이는 선형 보간
function slotAt(s) {
  const last = SLOTS.length - 1;
  if (s <= SLOTS[0].s) return SLOTS[0];
  if (s >= SLOTS[last].s) return SLOTS[last];
  const i = Math.floor(s - SLOTS[0].s);
  const a = SLOTS[i];
  const b = SLOTS[i + 1];
  const t = s - a.s;
  const mix = (p, q) => p + (q - p) * t;
  return { x: mix(a.x, b.x), y: mix(a.y, b.y), size: mix(a.size, b.size), o: mix(a.o, b.o) };
}

// 문구 투명도: 활성일 때 1, 절반쯤 넘어가면 0. 제목 → 부제 순으로 살짝 시차를 둔다
const alpha = (d, k) => clamp01(1 - Math.abs(d) * k);

export default function FeatureShowcase({ heading, features }) {
  const trackRef = useRef(null);
  const [pos, setPos] = useState(0); // 0 ~ count-1 : 스크롤에 따라 연속으로 변하는 위치
  const count = features.length;
  const index = Math.round(pos);
  const active = features[index];

  // 영상은 해당 기능이 활성이 될 때마다 처음(0초)부터 재생하고, 비활성이 되면(이동이 끝난 뒤) 멈춘다.
  const videoRefs = useRef(new Map());
  useEffect(() => {
    const timers = [];
    videoRefs.current.forEach((video, id) => {
      if (id === active.id) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        timers.push(setTimeout(() => video.pause(), 600));
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

    // 스크롤이 멈추면 가장 가까운 기능 위치로 스크롤을 맞춘다 → 영상이 가운데 브래킷에 딱 들어간다
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

  return (
    <div ref={trackRef} className={styles.track} style={{ '--count': count }}>
      <div className={styles.sticky}>
        <section className={styles.section} aria-label={heading}>
          {/* 상단 가운데 "Funtion 0N" 라벨 */}
          {features.map((feature, i) => (
            <p
              key={feature.id}
              className={styles.label}
              style={{ opacity: alpha(i - pos, 2.2) }}
              aria-hidden={i !== index}
            >
              {feature.label}
            </p>
          ))}

          {/* 필름 띠: 영상은 겹쳐 두고 슬롯 위치·크기·투명도만 스크롤에 따라 바뀐다 */}
          {features.map((feature, i) => {
            const slot = slotAt(pos - i); // 다음 기능(i > pos)은 왼쪽(−), 지난 기능은 오른쪽(+)
            return (
              <video
                key={feature.id}
                ref={(node) => {
                  if (node) videoRefs.current.set(feature.id, node);
                  else videoRefs.current.delete(feature.id);
                }}
                className={styles.media}
                style={{
                  left: `calc(${slot.x.toFixed(2)} * var(--u))`,
                  top: `calc(${slot.y.toFixed(2)} * var(--u))`,
                  width: `calc(${slot.size.toFixed(2)} * var(--u))`,
                  height: `calc(${slot.size.toFixed(2)} * var(--u))`,
                  opacity: slot.o.toFixed(3),
                  zIndex: 10 - Math.round(Math.abs(pos - i)),
                }}
                src={feature.video}
                poster={feature.image}
                preload="auto"
                autoPlay
                loop
                muted
                playsInline
                aria-hidden="true"
              />
            );
          })}

          {/* Figma Feature Frame: 569×569 코너 브래킷, 선 1.5 (#fff) */}
          <svg className={styles.frame} viewBox="0 0 571 571" fill="none" aria-hidden="true">
            <path
              d="M127.772 0.75H0.75V137.747M433.814 0.75H569.75V137.747M0.75 417.624V569.75L127.772 569.75M569.75 417.624V569.75L433.814 569.75"
              stroke="#fff"
              strokeWidth="1.5"
            />
          </svg>

          {/* 영상 왼쪽, 오른쪽 정렬 문구: 제목(Outfit SemiBold 45) · 부제(Pretendard Light 15) */}
          {features.map((feature, i) => {
            const d = i - pos;
            const current = i === index;
            return (
              <div key={feature.id} className={styles.copy} aria-hidden={!current}>
                <h3
                  className={styles.title}
                  style={{
                    opacity: alpha(d, 2.2),
                    transform: `translateY(calc(${(-d * 30).toFixed(2)} * var(--u)))`,
                  }}
                >
                  {feature.titleLines.map((line, k) => (
                    <span key={k}>{line}</span>
                  ))}
                </h3>
                <p
                  className={styles.subtitle}
                  style={{
                    opacity: alpha(d, 2.6),
                    transform: `translateY(calc(${(-d * 18).toFixed(2)} * var(--u)))`,
                  }}
                >
                  {feature.subtitle}
                </p>
              </div>
            );
          })}

          {/* 하단 가운데 안내 */}
          <p className={styles.hint}>SCROLL TO CONTINUE</p>
        </section>
      </div>
    </div>
  );
}
