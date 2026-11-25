import { useEffect, useRef } from 'react';
import { mountSiteCursor } from './siteCursor.js';
import styles from './SiteCursor.module.css';

/**
 * 공통 커서 (공통 파일) — App 에서 한 번만 그려 모든 페이지(메인 포함)에 쓴다. 페이지를 옮겨도 끊기지 않는다.
 * 그리는 방식과 값은 siteCursor.js 참고.
 */
export default function SiteCursor() {
  const ref = useRef(null);
  useEffect(() => mountSiteCursor(ref.current), []);
  return <canvas ref={ref} id="kc-cv" className={styles.canvas} aria-hidden="true" />;
}
