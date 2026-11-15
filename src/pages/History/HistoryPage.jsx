import styles from './HistoryPage.module.css';

/**
 * History — 브랜드 히스토리
 * 세부 디자인과 기능은 담당자 배정 후 이 폴더 안에서 개발한다.
 * 이 페이지에서만 쓰는 컴포넌트는 ./components/ 에 둔다.
 */
export default function HistoryPage() {
  return (
    <section className={styles.page} aria-labelledby="history-title">
      <h1 id="history-title">History</h1>
    </section>
  );
}
