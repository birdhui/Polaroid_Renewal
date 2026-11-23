import { useEffect, useId, useRef } from 'react';
import styles from './ScriptDraw.module.css';

/**
 * 손글씨 모델명 — 화면에 들어오면 펜으로 쓰듯 그려진다 (담당: 정준혁)
 * 원본 이미지(script-*.webp)를 그대로 쓰고, '드러나는 시각' 지도(strokes.time)를 마스크로 써서
 * 시각 t 까지의 픽셀만 보이게 한다. 매 프레임 t 를 0 → 1 로 올리면 펜이 한 획씩 지나가며 쓰인다.
 *  - 지도는 ./scriptStrokes.js 참고. 펜이 지나가는 획의 잉크만 드러나므로, 다음 획이 미리 보이지 않는다.
 *  - 한 번 드러난 픽셀은 그대로 남고, 다 그린 뒤 다시 손보는 단계가 없다.
 * 원리: SVG 필터로 지도 밝기를 '문턱(1 - t) 이상이면 흰색'으로 바꿔 마스크로 쓴다 (slope=K, intercept 를 매 프레임 갱신).
 *
 * play: true 가 되는 순간 그리기 시작 / reducedMotion: 동작 줄이기 설정이면 처음부터 다 보인다.
 */
const TOTAL_MS = 1800;
/** 펜 끝의 부드러운 정도 — 클수록 경계가 또렷하다 */
const K = 520;

const interceptAt = (t) => 1 - K * (1 - t);

export default function ScriptDraw({ src, strokes, play, reducedMotion, className, style }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const maskId = `script-mask-${uid}`;
  const filterId = `script-filter-${uid}`;
  const funcsRef = useRef([]);
  const { w, h, time } = strokes;

  useEffect(() => {
    if (!play || reducedMotion) return undefined;
    let raf = 0;
    let start = 0;
    const step = (now) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / TOTAL_MS);
      const b = String(interceptAt(t));
      funcsRef.current.forEach((f) => f?.setAttribute('intercept', b));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [play, reducedMotion]);

  if (reducedMotion) {
    return (
      <svg className={`${styles.svg} ${className ?? ''}`} style={style} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
        <image href={src} width={w} height={h} />
      </svg>
    );
  }

  // 시작 전에는 아무것도 보이지 않도록 t 를 살짝 음수로
  const initial = String(interceptAt(-2 / K));

  return (
    <svg
      className={`${styles.svg} ${className ?? ''}`}
      style={style}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id={filterId} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feComponentTransfer>
            {['R', 'G', 'B'].map((c, i) => {
              const Func = `feFunc${c}`;
              return (
                <Func
                  key={c}
                  ref={(el) => {
                    funcsRef.current[i] = el;
                  }}
                  type="linear"
                  slope={K}
                  intercept={initial}
                />
              );
            })}
          </feComponentTransfer>
        </filter>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={w} height={h}>
          <image href={time} width={w} height={h} filter={`url(#${filterId})`} />
        </mask>
      </defs>
      <image href={src} width={w} height={h} mask={`url(#${maskId})`} />
    </svg>
  );
}
