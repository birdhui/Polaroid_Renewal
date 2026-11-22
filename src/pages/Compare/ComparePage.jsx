import CompareFinder from '@/pages/Compare/components/CompareFinder/CompareFinder.jsx';
import CompareHero from '@/pages/Compare/components/CompareHero/CompareHero.jsx';
import styles from './ComparePage.module.css';

/**
 * Compare — 나에게 맞는 카메라 찾기 (feat/compare)
 * 히어로 + STEP 1~3 선택. STEP 3 까지 마치면 선택에 맞는 추천 카메라 3개가 아래에 나타난다.
 * 페이지 전용 컴포넌트는 ./components/, 훅은 ./hooks/, 데이터는 ./data/ 에 둔다.
 */
export default function ComparePage() {
  return (
    <div className={styles.page}>
      <CompareHero />
      {/* 히어로의 "찾아보기" 버튼이 이 지점으로 이동한다 (CompareHero 의 FINDER_ID) */}
      <div id="compare-finder">
        <CompareFinder />
      </div>
    </div>
  );
}
