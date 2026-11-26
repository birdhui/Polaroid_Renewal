import { useEffect, useRef, useState } from 'react';
import styles from './FeatureShowcase.module.css';

/**
 * Feature — Figma "Cameras - NOW_v3"(2854:2377) 04~07 프레임.
 * 화면 하나가 고정(sticky)되고, 스크롤에 따라 4개 장면(소개 → 01 → 02 → 03)이 이어진다.
 *  - 카메라 이미지 두 장(3/4 각도 · 정면 클로즈업)은 장면마다 위치·크기가 바뀌며 프레임 사이를 옮겨 다닌다
 *  - 01·03: 왼쪽 683×658 영상 + 오른쪽 제목·부제·설명 / 02: 왼쪽 글 + 오른쪽 큰 카메라
 * 스크롤 값은 관성 보간을 거쳐 반영되고, 각 장면 위치에서는 잠시 머문다(멈추면 가장 가까운 장면에 맞춘다).
 * 카메라 이미지는 src/assets/cameras/now/v3-camera-3q.png · v3-camera-front.png 로 둔다(없으면 그 자리는 비어 있다).
 */

const images = import.meta.glob('../../../../assets/cameras/now/v3-camera-*.png', { eager: true, import: 'default' });
const camera3q = Object.entries(images).find(([key]) => key.includes('v3-camera-3q'))?.[1];
const cameraFront = Object.entries(images).find(([key]) => key.includes('v3-camera-front'))?.[1];

// 장면별 이미지 상태(Figma 좌표, px). crop 은 상자 안에서 이미지가 차지하는 비율(%)이고, flip 은 좌우 반전(0/1)이다.
// 3/4 각도 카메라: 소개(왼쪽) → 01(오른쪽 아래, 반전) → 02(오른쪽 위, 크게) → 03(위로 빠짐)
const CAMERA_3Q = [
  { x: 73, y: 157, w: 807, h: 770, l: -11.03, t: -12.73, iw: 119.33, ih: 125.06, flip: 0, o: 1 },
  { x: 1073, y: 861, w: 1473, h: 1334, l: 0, t: -16.49, iw: 105.5, ih: 116.49, flip: 1, o: 1 },
  { x: 992, y: -439, w: 1554, h: 1554, l: 0, t: 0, iw: 100, ih: 100, flip: 1, o: 1 },
  { x: 992, y: -1900, w: 1554, h: 1554, l: 0, t: 0, iw: 100, ih: 100, flip: 1, o: 0 },
];
// 정면 클로즈업: 소개(오른쪽 아래에 걸쳐 보임) → 01 에서 위로 올라가 사라진다
const CAMERA_FRONT = [
  { x: 1162, y: 117, size: 1515, o: 1 },
  { x: 1162, y: -983, size: 1515, o: 0 },
  { x: 1162, y: -983, size: 1515, o: 0 },
  { x: 1162, y: -983, size: 1515, o: 0 },
];
const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

// 장면 값(pos: 0~3 연속)에 맞춰 키 사이를 보간
function keyAt(list, pos) {
  const i = Math.min(Math.floor(pos), list.length - 2);
  const t = smooth(clamp01(pos - i));
  const a = list[i];
  const b = list[i + 1];
  const out = {};
  Object.keys(a).forEach((k) => {
    out[k] = lerp(a[k], b[k], t);
  });
  return out;
}

// 문구 투명도: 활성일 때 1, 절반쯤 넘어가면 0
const alpha = (d, k) => clamp01(1 - Math.abs(d) * k);

export default function FeatureShowcase({ heading, features, intro }) {
  const trackRef = useRef(null);
  const count = features.length + 1; // 소개 + 기능들
  const [pos, setPos] = useState(0); // 0 ~ count-1
  const index = Math.round(pos);
  const activeFeature = index > 0 ? features[index - 1] : null;

  // 영상은 해당 기능이 활성이 될 때마다 처음부터 재생하고, 비활성이 되면(이동이 끝난 뒤) 멈춘다.
  const videoRefs = useRef(new Map());
  useEffect(() => {
    const timers = [];
    videoRefs.current.forEach((video, id) => {
      if (activeFeature && id === activeFeature.id) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        timers.push(setTimeout(() => video.pause(), 600));
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [activeFeature]);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let current = 0;
    let last = 0;

    const readTarget = () => {
      const track = trackRef.current;
      if (!track) return 0;
      const rect = track.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(Math.max(-rect.top / scrollable, 0), 1) : 0;
      return Math.min(Math.max(progress * count - 0.5, 0), count - 1);
    };

    // 각 장면 위치(정수) 근처에서는 정확히 그 위치에 머물고, 그 사이에서만 부드럽게 이동한다
    const settle = (value) => {
      const base = Math.floor(value);
      const f = Math.min(Math.max((value - base - 0.12) / 0.76, 0), 1);
      return base + f * f * (3 - 2 * f);
    };

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

  const px = (v) => `calc(${v.toFixed(2)} * var(--u))`;
  const k3 = keyAt(CAMERA_3Q, pos);
  const kf = keyAt(CAMERA_FRONT, pos);
  const introAlpha = alpha(pos, 2.2);

  return (
    <div ref={trackRef} className={styles.track} style={{ '--count': count }}>
      <div className={styles.sticky}>
        <section className={styles.section} aria-label={heading}>
          {/* 소개: 뒤쪽 큰 글자 + 제목·부제 */}
          <div className={styles.wordmark} style={{ opacity: introAlpha.toFixed(3) }} aria-hidden="true">
            {intro.wordmark.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
          <div
            className={styles.introCopy}
            style={{ opacity: introAlpha.toFixed(3), transform: `translateY(${px(-pos * 30)})` }}
            aria-hidden={index !== 0}
          >
            <h3 className={styles.introTitle}>
              {intro.title.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h3>
            <p className={styles.introSubtitle}>
              {intro.subtitle.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </p>
            <p className={styles.introDescription}>{intro.description}</p>
          </div>

          {/* 01·03 왼쪽 영상(683×658) */}
          {features.map((feature, i) =>
            feature.layout === 'media' ? (
              <div key={feature.id} className={styles.mediaBox} style={{ opacity: alpha(i + 1 - pos, 2.2).toFixed(3) }}>
                {feature.photo ? (
                  <img className={styles.video} src={feature.photo} alt="" />
                ) : (
                  <video
                    ref={(node) => {
                      if (node) videoRefs.current.set(feature.id, node);
                      else videoRefs.current.delete(feature.id);
                    }}
                    className={styles.video}
                    src={feature.video}
                    poster={feature.image}
                    preload="auto"
                    autoPlay
                    loop
                    muted
                    playsInline
                    aria-hidden="true"
                  />
                )}
              </div>
            ) : null,
          )}

          {/* 카메라 이미지 두 장 — 장면마다 위치·크기가 바뀐다 */}
          {cameraFront && (
            <img
              className={styles.cameraFront}
              src={cameraFront}
              alt=""
              style={{ left: px(kf.x), top: px(kf.y), width: px(kf.size), height: px(kf.size), opacity: kf.o.toFixed(3) }}
            />
          )}
          {camera3q && (
            <div
              className={styles.camera3q}
              style={{
                left: px(k3.x),
                top: px(k3.y),
                width: px(k3.w),
                height: px(k3.h),
                opacity: k3.o.toFixed(3),
                transform: `rotateY(${(k3.flip * 180).toFixed(2)}deg)`,
              }}
            >
              <img
                src={camera3q}
                alt=""
                style={{
                  left: `${k3.l.toFixed(2)}%`,
                  top: `${k3.t.toFixed(2)}%`,
                  width: `${k3.iw.toFixed(2)}%`,
                  height: `${k3.ih.toFixed(2)}%`,
                }}
              />
            </div>
          )}

          {/* 기능 글·라벨·선 */}
          {features.map((feature, i) => {
            const d = i + 1 - pos;
            const current = i + 1 === index;
            const side = feature.layout === 'camera' ? styles.left : styles.right;
            return (
              <div key={feature.id} className={`${styles.copy} ${side}`} aria-hidden={!current}>
                <div className={styles.text}>
                  <h3
                    className={styles.title}
                    style={{ opacity: alpha(d, 2.2).toFixed(3), transform: `translateY(${px(-d * 30)})` }}
                  >
                    {feature.titleLines.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </h3>
                  <p
                    className={styles.subtitle}
                    style={{ opacity: alpha(d, 2.6).toFixed(3), transform: `translateY(${px(-d * 20)})` }}
                  >
                    {feature.subtitle}
                  </p>
                  <p
                    className={styles.description}
                    style={{ opacity: alpha(d, 2.8).toFixed(3), transform: `translateY(${px(-d * 14)})` }}
                  >
                    {feature.descriptionLines.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </p>
                </div>
                <p className={styles.label} style={{ opacity: alpha(d, 2.2).toFixed(3) }}>
                  {feature.label}
                </p>
                <span className={styles.rule} style={{ opacity: alpha(d, 2.2).toFixed(3) }} />
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
