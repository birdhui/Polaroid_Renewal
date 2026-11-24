import { useState } from 'react';
import CornerBrackets from './CornerBrackets.jsx';
import styles from './FeatureShowcase.module.css';

/**
 * Figma 주석("04, 05, 06 레이어는 하나의 화면이고 오른쪽 텍스트를 선택하면
 * 왼쪽의 영상이 바뀌는")에 따라 기능 3종을 하나의 화면 + 선택 전환으로 구현한다.
 * 선택한 기능이 위(진하게)로 오고, 나머지 둘은 Figma 04·05·06 프레임의 순서·투명도대로 아래에 흐리게 나온다.
 * 흐린 문장을 누르면 그 기능이 선택된다.
 */
export default function FeatureShowcase({ heading, features, background }) {
  const [activeId, setActiveId] = useState(features[0].id);
  const active = features.find((feature) => feature.id === activeId);
  const byId = (id) => features.find((feature) => feature.id === id);

  return (
    <section className={styles.section} aria-label={heading}>
      <img className={styles.background} src={background} alt="" />

      <img
        className={styles.image}
        style={{ '--iy': active.imageTop, '--is': active.imageSize }}
        src={active.image}
        alt={active.headline}
      />
      <CornerBrackets className={styles.frame} />

      <span className={styles.tagPill} aria-hidden="true" />
      <p className={styles.tagCode}>{active.tag}</p>
      <p className={styles.tagLabel}>{active.tagLabel}</p>

      <h3 className={styles.headline}>{active.headline}</h3>
      <span className={`${styles.rule} ${styles.ruleTop}`} aria-hidden="true" />
      <span className={`${styles.rule} ${styles.ruleBottom}`} aria-hidden="true" />

      {active.ghosts.map((ghost, index) => {
        const target = byId(ghost.id);
        return (
          <button
            key={ghost.id}
            type="button"
            className={`${styles.ghost} ${index === 0 ? styles.ghostFirst : styles.ghostSecond}`}
            style={{ color: `rgba(21, 21, 21, ${ghost.opacity})` }}
            aria-label={target.headline}
            onClick={() => setActiveId(ghost.id)}
          >
            {target.headline}
          </button>
        );
      })}
    </section>
  );
}
