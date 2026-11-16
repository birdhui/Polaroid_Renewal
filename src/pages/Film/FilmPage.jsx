import styles from './FilmPage.module.css';

/**
 * Film — 필름 제품군 소개 (담당: 손다은)
 * 세부 디자인과 기능은 확정된 화면 기획서를 받은 뒤 이 폴더 안에서 개발한다.
 * 페이지 전용 컴포넌트는 ./components/, 훅은 ./hooks/, 데이터는 ./data/ 에 둔다.
 */
export default function FilmPage() {
  return (
    <section className={styles.page} aria-labelledby="film-title">
      <h1 id="film-title">Film</h1>
    </section>
  );
}
