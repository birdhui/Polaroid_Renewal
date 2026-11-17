import BrandLockup from '../BrandLockup/BrandLockup.jsx';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion.js';
import styles from './CamerasHero.module.css';

/** YouTube 배경 영상 주소: 음소거 자동 재생 · 반복 · 컨트롤 숨김 */
function youtubeBgSrc(id) {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    playlist: id,
    controls: '0',
    playsinline: '1',
    rel: '0',
    disablekb: '1',
    iv_load_policy: '3',
    modestbranding: '1',
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

/**
 * Cameras 히어로: 전체 화면 배경(영상 → 이미지 → 그라데이션 순) + 가운데 로크업(페이지 h1) + SCROLL 안내.
 * SCROLL 안내는 주소(URL)에 해시를 남기지 않고 본문 섹션으로 스크롤한 뒤
 * 그 섹션으로 포커스를 옮긴다(키보드 사용자도 같은 위치에서 이어서 읽도록).
 */
export default function CamerasHero({ hero, nextId }) {
  const { image, video, brand, product } = hero;
  const showVideo = Boolean(video?.youtubeId) && !reducedMotion;
  const reducedMotion = usePrefersReducedMotion();

  const handleScrollToNext = () => {
    const target = document.getElementById(nextId);
    if (!target) return;
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    target.focus({ preventScroll: true });
  };

  return (
    <section className={styles.hero} aria-labelledby="cameras-title">
      {showVideo ? (
        <div className={styles.bg} aria-hidden="true">
          <iframe
            className={styles.video}
            src={youtubeBgSrc(video.youtubeId)}
            title="Cameras 히어로 배경 영상"
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            tabIndex={-1}
          />
        </div>
      ) : image.src ? (
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
