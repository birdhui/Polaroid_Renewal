import CompareHeroCameras from './CompareHeroCameras.jsx';
import styles from './CompareHero.module.css';

/** 히어로의 "찾아보기" 버튼이 이동할 섹션 (ComparePage 에서 이 id 를 단다) */
const FINDER_ID = 'compare-finder';

/**
 * Compare 히어로 — 카메라가 깔린 배경 위에 가운데 정렬된 안내 문구와 "찾아보기" 버튼.
 * 카메라는 개별 이미지로 깔려 있고(CompareHeroCameras), 처음 열릴 때 가운데로 모이는 모션이 한 번 나온다.
 * 문구는 전부 텍스트로 올린다.
 */
export default function CompareHero() {
  // 버튼을 누르면 아래 STEP 섹션으로 이동한다. 모션 감소 설정이면 부드러운 스크롤을 쓰지 않는다.
  function goToFinder() {
    const target = document.getElementById(FINDER_ID);
    if (!target) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  return (
    <header className={styles.hero}>
      <CompareHeroCameras />
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Find &amp; Compare</p>
        <h1 className={styles.title}>Which Polaroid camera is right for you?</h1>
        <p className={styles.subtitle}>
          나에게 맞는 카메라를 찾고,
          <br />
          가격과 기능까지 비교해 보세요.
        </p>
        <button type="button" className={styles.cta} onClick={goToFinder}>
          찾아보기
        </button>
      </div>
    </header>
  );
}
