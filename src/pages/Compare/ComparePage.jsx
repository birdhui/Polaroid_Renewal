import CompareFinder from '@/pages/Compare/components/CompareFinder/CompareFinder.jsx';
import CompareHero from '@/pages/Compare/components/CompareHero/CompareHero.jsx';
import styles from './ComparePage.module.css';

/**
 * Compare — 나에게 맞는 카메라 찾기 (feat/compare)
 * 히어로 + STEP 1~3 선택. 결과 화면과 제품 비교는 확정된 시안이 없어 포함하지 않는다.
 * 페이지 전용 컴포넌트는 ./components/, 훅은 ./hooks/, 데이터는 ./data/ 에 둔다.
 */
export default function ComparePage() {
  return (
    <div className={styles.page}>
      <CompareHero />
      <CompareFinder />
    </div>
  );
}
