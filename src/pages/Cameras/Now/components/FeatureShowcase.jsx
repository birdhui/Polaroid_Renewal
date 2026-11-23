import { useState } from 'react';
import styles from './FeatureShowcase.module.css';

/**
 * Figma 주석("04, 05, 06 레이어는 하나의 화면이고 오른쪽 텍스트를 선택하면
 * 왼쪽의 영상이 바뀌는")에 따라, 기능 3종을 스크롤로 쌓인 3개 섹션이 아니라
 * 하나의 화면 + 탭 전환으로 구현한다. 오른쪽 헤드라인을 클릭하면 왼쪽 이미지와
 * 태그가 함께 바뀐다.
 */
export default function FeatureShowcase({ heading, features }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = features[activeIndex];

  return (
    <section className={styles.section} aria-label={heading}>
      <div className={styles.inner}>
        <img className={styles.image} src={active.image} alt={active.headline} />
        <div className={styles.copy}>
          <span className={styles.tag}>
            {active.tag} · {active.tagLabel}
          </span>
          <ul className={styles.tabList}>
            {features.map((feature, index) => (
              <li key={feature.id}>
                <button
                  type="button"
                  className={`${styles.tab} ${index === activeIndex ? styles.tabActive : ''}`}
                  aria-pressed={index === activeIndex}
                  onClick={() => setActiveIndex(index)}
                >
                  {feature.headline}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
