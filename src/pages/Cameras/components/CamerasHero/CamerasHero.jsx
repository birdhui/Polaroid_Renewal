import BrandLockup from '../BrandLockup/BrandLockup.jsx';
import styles from './CamerasHero.module.css';

/**
 * Cameras 히어로: 전체 화면 배경 + 가운데 로크업(페이지 h1) + SCROLL 안내.
 * SCROLL 안내는 본문 섹션으로 건너뛰는 링크로도 동작한다(키보드 접근).
 */
export default function CamerasHero({ hero, nextId }) {
  const { image, brand, product } = hero;

  return (
    <section className={styles.hero} aria-labelledby="cameras-title">
      {image.src ? (
        <img
          className={styles.bg}
          src={image.src}
          alt={image.alt}
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      ) : (
        <div className={`${styles.bg} ${styles.bgPlaceholder}`} aria-hidden="true" />
      )}
      <div className={styles.scrim} aria-hidden="true" />

      <BrandLockup id="cameras-title" as="h1" brand={brand} product={product} className={styles.lockup} />

      <a className={styles.hint} href={`#${nextId}`}>
        <span className={styles.hintLabel}>SCROLL</span>
        <svg className={styles.hintIcon} width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className={styles.visuallyHidden}>본문으로 이동</span>
      </a>
    </section>
  );
}
