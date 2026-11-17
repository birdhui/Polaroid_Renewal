import heroImage from '@/assets/compare/hero-living-room.webp';
import styles from './CompareHero.module.css';

/**
 * Compare 히어로 — 배경 사진 위에 제목과 한 줄 안내.
 * 시안의 히어로 인터랙션은 범위에서 제외한다.
 */
export default function CompareHero() {
  return (
    <header className={styles.hero}>
      <img className={styles.image} src={heroImage} alt="" fetchPriority="high" decoding="async" />
      <div className={styles.copy}>
        <h1 className={styles.title}>
          Find Your
          <br />
          Polaroid
        </h1>
        <p className={styles.subtitle}>당신에게 어울리는 카메라를 찾아보세요</p>
      </div>
    </header>
  );
}
