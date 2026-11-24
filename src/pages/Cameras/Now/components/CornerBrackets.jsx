import styles from './CornerBrackets.module.css';

/**
 * Figma "Vector 48" — 카메라 뷰파인더 스타일의 모서리 브래킷(ㄱ자 테두리) 4개.
 * Intro의 eyebrow+Now 워드마크 그룹을 감싸는 장식으로 쓰인다.
 */
export default function CornerBrackets({ children, className = '' }) {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      <span className={`${styles.corner} ${styles.topLeft}`} aria-hidden="true" />
      <span className={`${styles.corner} ${styles.topRight}`} aria-hidden="true" />
      <span className={`${styles.corner} ${styles.bottomLeft}`} aria-hidden="true" />
      <span className={`${styles.corner} ${styles.bottomRight}`} aria-hidden="true" />
      {children}
    </div>
  );
}
