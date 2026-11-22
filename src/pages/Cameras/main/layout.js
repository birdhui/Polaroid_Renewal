/**
 * 시안 좌표(가로 1920 기준 px)를 CSS 변수로 넘기는 도우미 (담당: 정준혁)
 * CSS 에서는 calc(var(--l) * var(--px)) 처럼 --px(= 화면 폭 / 1920)를 곱해 쓴다.
 */

/** [left, top, width, height] → --l, --t, --w, --h. offset 으로 기준점을 옮길 수 있다. */
export function boxVars([l, t, w, h], [ox, oy] = [0, 0]) {
  return { '--l': l - ox, '--t': t - oy, '--w': w, '--h': h };
}

/** 여러 상자를 모두 감싸는 상자 */
export function unionBox(boxes) {
  const l = Math.min(...boxes.map((b) => b[0]));
  const t = Math.min(...boxes.map((b) => b[1]));
  const r = Math.max(...boxes.map((b) => b[0] + b[2]));
  const btm = Math.max(...boxes.map((b) => b[1] + b[3]));
  return [l, t, r - l, btm - t];
}

/** 감싸는 상자(outer) 안에서의 위치를 % 로 → 화면 폭이 바뀌어도 비율이 유지된다 */
export function percentBox([l, t, w, h], [ol, ot, ow, oh]) {
  return {
    left: `${((l - ol) / ow) * 100}%`,
    top: `${((t - ot) / oh) * 100}%`,
    width: `${(w / ow) * 100}%`,
    height: `${(h / oh) * 100}%`,
  };
}
