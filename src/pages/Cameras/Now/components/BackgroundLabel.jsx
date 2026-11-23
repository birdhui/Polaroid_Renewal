import styles from './BackgroundLabel.module.css';

/**
 * Figma의 모든 섹션 하단에 깔리는 큰 영문 배경 레이블 ("Three ways to make every
 * moment count"). 원본은 스크롤에 따라 다음 섹션으로 걸치는 모션이 있지만,
 * 정적 구현에서는 옅은 투명도의 고정 장식 문구로만 표현한다.
 */
export default function BackgroundLabel({ lines }) {
  return (
    <p className={styles.label} aria-hidden="true">
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </p>
  );
}
