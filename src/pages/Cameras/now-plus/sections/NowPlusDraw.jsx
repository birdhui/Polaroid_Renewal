import { useEffect, useRef } from 'react';
import colorImage from '@/assets/cameras/now-plus/now-plus-draw-color.webp';
import LINEART from '../drawing/nowPlusLineart.js';
import styles from '../CameraNowPlusPage.module.css';

/**
 * 3-2. 드로잉 → 채색 (Now의 3D 내부 구조 자리를 대신하는 Now+ 연출)
 * polaroid.com Now+ 'Iconic Polaroid design.' 영상의 흐름을 스크롤로 옮겼다.
 *   ① 보조선(길게 뻗은 가로·세로선, 렌즈 원)이 먼저 그어지고
 *   ② 카메라 윤곽선이 긴 선부터 차례로 그려지고
 *   ③ 옅은 색이 깔린 뒤(채도 낮게 · 밝게)
 *   ④ 실제 색으로 채워지며 선이 사라진다. 마지막에 아래 설명이 나타난다.
 * 진행률은 섹션이 화면 아래에서 올라오기 시작할 때 0, 고정이 풀리기 직전에 1이다.
 * 그래서 화면에 들어오는 동안 보조선부터 조금씩 그려지고, 고정된 뒤 천천히 윤곽 → 채색이 이어진다.
 * 선 데이터는 사용자 제공 Now+ 코랄 정면 사진에서 뽑았다(drawing/nowPlusLineart.js).
 * 동작 줄이기 설정이면 마지막 장면(컬러 사진 + 설명)을 바로 보여 준다.
 */
const { w: W, h: H, pad, guides, circles, paths } = LINEART;
const VIEW = `${-pad[0]} ${-pad[1]} ${W + pad[0] * 2} ${H + pad[1] * 2}`;
const TEXT =
  'Gain extra creative firepower when you connect the Polaroid Now+ Generation 3 Instant Camera to the Polaroid App. Access aperture priority, remote controls, double-exposure, self-timer, manual mode and more. Combine this connectivity with an optimized two-lens autofocus system that takes sharper pictures in bright lighting and you’ve got a classic-look camera that’s full of modern tech. Available in four new colors, made with 40% recycled materials and compatible with iconic, full-sized Polaroid i-Type Film.';

export default function NowPlusDraw({ reducedMotion }) {
  const pinRef = useRef(null);
  const svgRef = useRef(null);
  const colorRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    const pin = pinRef.current;
    const svg = svgRef.current;
    const color = colorRef.current;
    const text = textRef.current;
    if (!pin || !svg || !color || !text) return undefined;
    const guideEls = [...svg.querySelectorAll('[data-guide]')];
    const lineEls = [...svg.querySelectorAll('[data-line]')];
    const lineGroup = svg.querySelector('[data-lines]');
    const guideGroup = svg.querySelector('[data-guides]');

    const clamp = (v) => Math.min(1, Math.max(0, v));
    const seg = (p, a, b) => clamp((p - a) / (b - a));
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const lerp = (a, b, t) => a + (b - a) * t;

    const apply = (p) => {
      // (섹션 높이 420vh 기준: 0 ~ 0.24 는 화면에 들어오는 구간, 그 뒤가 고정 구간)
      // 순서: 보조선 → 윤곽선이 '끝까지' 그려짐(0.6) → 완성된 선 그림을 잠시 보여 줌 → 옅은 색 → 실제 색 → 설명
      // ① 보조선: 0.03 → 0.30 사이에 하나씩 엇갈려 그어진다 (들어오는 동안 시작)
      guideEls.forEach((el, i) => {
        const a = 0.03 + (0.12 * i) / Math.max(1, guideEls.length - 1);
        el.style.strokeDashoffset = (1 - ease(seg(p, a, a + 0.15))).toFixed(4);
      });
      // ② 윤곽선: 긴 선부터 0.08 → 0.60 사이에 차례로, 0.60 에 모든 선이 다 그려진다
      const n = lineEls.length;
      lineEls.forEach((el, i) => {
        const a = 0.08 + (0.34 * i) / Math.max(1, n - 1);
        el.style.strokeDashoffset = (1 - ease(seg(p, a, a + 0.18))).toFixed(4);
      });
      // ③ 옅은 색(0.66 → 0.76) → ④ 실제 색(0.76 → 0.9): 선 그림이 완성된 뒤에 시작한다
      const tint = seg(p, 0.66, 0.76);
      const full = ease(seg(p, 0.76, 0.9));
      color.style.opacity = (0.32 * tint + 0.68 * full).toFixed(3);
      color.style.filter = `saturate(${lerp(0.25, 1, full).toFixed(3)}) brightness(${lerp(1.22, 1, full).toFixed(3)})`;
      guideGroup.style.opacity = (1 - seg(p, 0.78, 0.88)).toFixed(3);
      lineGroup.style.opacity = (1 - 0.92 * seg(p, 0.84, 0.95)).toFixed(3);
      // 설명
      const t = ease(seg(p, 0.9, 0.98));
      text.style.opacity = t.toFixed(3);
      text.style.transform = `translateY(${((1 - t) * 24).toFixed(1)}px)`;
    };

    if (reducedMotion) {
      apply(1);
      return undefined;
    }

    let raf = 0;
    let visible = false;
    const draw = () => {
      raf = 0;
      const r = pin.getBoundingClientRect();
      // 섹션 윗변이 화면 아래에 닿을 때 0 → 섹션 아랫변이 화면 아래에 닿을 때 1
      const p = clamp((window.innerHeight - r.top) / Math.max(1, pin.offsetHeight));
      apply(p);
      if (visible) raf = requestAnimationFrame(draw);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(draw);
    });
    io.observe(pin);
    draw();
    return () => {
      visible = false;
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  return (
    <section className={styles.draw} aria-labelledby="nowplus-draw-title">
      <h2 id="nowplus-draw-title" className={styles.srOnly}>
        Iconic Polaroid design — 선으로 그려진 뒤 색이 채워지는 Polaroid Now+
      </h2>
      <div ref={pinRef} className={styles.drawPin}>
        <div className={styles.drawStage}>
          <div className={styles.drawFigure} style={{ aspectRatio: `${W + pad[0] * 2} / ${H + pad[1] * 2}` }}>
            <img
              ref={colorRef}
              className={styles.drawColor}
              src={colorImage}
              alt="코랄 컬러 Polaroid Now+ 정면"
              decoding="async"
              style={{
                left: `${(pad[0] / (W + pad[0] * 2)) * 100}%`,
                top: `${(pad[1] / (H + pad[1] * 2)) * 100}%`,
                width: `${(W / (W + pad[0] * 2)) * 100}%`,
              }}
            />
            <svg ref={svgRef} className={styles.drawSvg} viewBox={VIEW} aria-hidden="true" focusable="false">
              <g data-guides="" className={styles.drawGuides}>
                {guides.map(([x1, y1, x2, y2], i) => (
                  <line key={`g${i}`} data-guide="" x1={x1} y1={y1} x2={x2} y2={y2} pathLength="1" />
                ))}
                {circles.map(([cx, cy, r], i) => (
                  <circle key={`c${i}`} data-guide="" cx={cx} cy={cy} r={Math.round(r * 1.12)} pathLength="1" />
                ))}
              </g>
              <g data-lines="" className={styles.drawLines}>
                {paths.map((d, i) => (
                  <path key={i} data-line="" d={d} pathLength="1" />
                ))}
              </g>
            </svg>
          </div>
          <p ref={textRef} className={styles.drawText}>
            {TEXT}
          </p>
        </div>
      </div>
    </section>
  );
}
