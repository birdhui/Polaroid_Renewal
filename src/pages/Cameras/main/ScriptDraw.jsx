import { useId } from 'react';
import styles from './ScriptDraw.module.css';

/**
 * 손글씨 모델명 — 화면에 들어오면 펜으로 쓰듯 그려진다 (담당: 정준혁)
 * 원본 이미지(script-*.webp)를 그대로 쓰고, 펜 경로(strokes.paths)를 따라 굵은 선을 그어 나가는 마스크로 드러낸다.
 * 펜 경로는 ./scriptStrokes.js 를 쓴다 — 왼쪽 끝에서 출발해 글자를 차례로 '한 붓 그리기' 순서로 이어 따라간다.
 * 선 끝은 평평하게(butt) 그어, 조각이 시작될 때 둥근 점이 먼저 툭 튀어나오지 않게 한다.
 * 조각마다 그 부분 잉크 두께에 맞춘 굵기로 그어, 한 번 그리면 끝까지 그대로 둔다(다 그린 뒤 다시 손보지 않는다).
 *
 * play: true 가 되는 순간 그리기 시작 / reducedMotion: 동작 줄이기 설정이면 처음부터 다 보인다.
 */
const TOTAL_MS = 1800;

export default function ScriptDraw({ src, strokes, play, reducedMotion, className, style }) {
  const maskId = `script-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const { w, h, sw, paths } = strokes;

  const showAll = reducedMotion;
  const total = paths.reduce((sum, p) => sum + p.len, 0);
  let elapsed = 0;

  return (
    <svg
      className={`${styles.svg} ${className ?? ''}`}
      style={style}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      focusable="false"
    >
      {!showAll && (
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={w} height={h}>
            {paths.map((p) => {
              const dur = (TOTAL_MS * p.len) / total;
              const delay = elapsed;
              elapsed += dur;
              return (
                <path
                  key={p.d}
                  className={`${styles.stroke} ${play ? styles.play : ''}`}
                  d={p.d}
                  pathLength="1"
                  strokeWidth={p.w ?? sw}
                  style={{ '--dur': `${dur}ms`, '--delay': `${delay}ms` }}
                />
              );
            })}
          </mask>
        </defs>
      )}
      <image href={src} width={w} height={h} mask={showAll ? undefined : `url(#${maskId})`} />
    </svg>
  );
}
