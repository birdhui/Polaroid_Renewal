import styles from './HistoryPage.module.css';

/**
 * History — 브랜드 히스토리 (담당: 모진아)
 * 세부 디자인과 기능은 확정된 화면 기획서를 받은 뒤 이 폴더 안에서 개발한다.
 * 페이지 전용 컴포넌트는 ./components/, 훅은 ./hooks/, 데이터는 ./data/ 에 둔다.
 */
export default function HistoryPage() {
  return (
    <section className={styles.page} aria-labelledby="history-title">
      <h1 id="history-title">History</h1>
    </section>
  );
}
