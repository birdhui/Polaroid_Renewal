import CompareHeroCameras from './CompareHeroCameras.jsx';
import styles from './CompareHero.module.css';

/**
 * Compare 히어로 — 카메라가 깔린 배경 위에 가운데 정렬된 안내 문구와 "찾아보기" 버튼.
 * 카메라는 개별 이미지로 깔려 있고(CompareHeroCameras), 처음 열릴 때 가운데로 모이는 모션이 한 번 나온다.
 * 문구는 전부 텍스트로 올린다.
 * "찾아보기"를 누르면 ComparePage 가 (onStart) 히어로를 사라지게 하고 그 자리에 채팅 화면을 띄운다. 스크롤로 이동하지 않는다.
 */
export default function CompareHero({ onStart, leaving = false }) {
  return (
    <header className={styles.hero} data-leaving={leaving}>
      <CompareHeroCameras />
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Find &amp; Compare</p>
        <h1 className={styles.title}>Which Polaroid camera is right for you?</h1>
        <p className={styles.subtitle}>
          나에게 맞는 카메라를 찾고,
          <br />
          가격과 기능까지 비교해 보세요.
        </p>
        <button type="button" className={styles.cta} onClick={onStart} disabled={leaving}>
          찾아보기
        </button>
      </div>
    </header>
  );
}
