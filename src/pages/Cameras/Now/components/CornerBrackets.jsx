import styles from './CornerBrackets.module.css';

/**
 * Figma 카메라 뷰파인더 스타일 모서리 브래킷(ㄱ자 4개).
 * 위치·크기·선 두께는 className으로 넘기는 CSS 변수(--x --y --w --h --arm --stroke)로 정한다.
 * TODO: Figma 원본 SVG(Vector 48 등)를 받을 수 있게 되면 이미지로 교체. 지금은 CSS로 그린 근사값이다.
 */
export default function CornerBrackets({ className = '' }) {
  return (
    <span className={`${styles.frame} ${className}`} aria-hidden="true">
      <i className={`${styles.corner} ${styles.topLeft}`} />
      <i className={`${styles.corner} ${styles.topRight}`} />
      <i className={`${styles.corner} ${styles.bottomLeft}`} />
      <i className={`${styles.corner} ${styles.bottomRight}`} />
    </span>
  );
}
