import BrandLockup from '../BrandLockup/BrandLockup.jsx';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion.js';
import styles from './CamerasHero.module.css';

/**
 * Cameras 히어로: 전체 화면 배경 + 가운데 로크업(페이지 h1) + SCROLL 안내.
 * SCROLL 안내는 주소(URL)에 해시를 남기지 않고 본문 섹션으로 스크롤한 뒤
 * 그 섹션으로 포커스를 옮긴다(키보드 사용자도 같은 위치에서 이어서 읽도록).
 */
export default function CamerasHero({ hero, nextId }) {
  const { image, brand, product } = hero;
  const reducedMotion = usePrefersReducedMotion();

  const handleScrollToNext = () => {
    const target = document.getElementById(nextId);
    if (!target) return;
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    target.focus({ preventScroll: true });
  };

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

      <button type="button" className={styles.hint} onClick={handleScrollToNext} aria-controls={nextId}>
        <span className={styles.hintLabel} aria-hidden="true">
          SCROLL
        </span>
        <svg className={styles.hintIcon} width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className={styles.visuallyHidden}>본문으로 이동</span>
      </button>
    </section>
  );
}
