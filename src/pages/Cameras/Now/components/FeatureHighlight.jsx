import styles from './FeatureHighlight.module.css';

/**
 * Figma의 기능 소개 섹션(04 Feature — Autofocus / 05 Feature — Double Exposure / 06 Feature — Sharpness) 1개 블록.
 * 세 섹션 모두 동일한 "Feature BG Photo"(exposure/temperature 보정된 톤) 풀블리드 사진을
 * 배경으로 깔고, 그 위에 기능 스와치 이미지 + 카피를 올리는 구조다.
 * 원본은 스크롤에 따라 ghost 헤드라인의 투명도가 바뀌는 모션이 있지만,
 * 정적 페이지 1차 구현이라 ghost 목록은 고정 투명도로만 표현한다.
 */
export default function FeatureHighlight({ feature }) {
  return (
    <div className={styles.feature}>
      <div className={styles.inner}>
        <img className={styles.image} src={feature.image} alt={feature.headline} />
        <div className={styles.copy}>
          <span className={styles.tag}>
            {feature.tag} · {feature.tagLabel}
          </span>
          <p className={styles.headline}>{feature.headline}</p>
          <ul className={styles.ghostList} aria-hidden="true">
            {feature.ghosts.map((ghost) => (
              <li key={ghost.text} className={styles.ghost} style={{ opacity: ghost.opacity }}>
                {ghost.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
