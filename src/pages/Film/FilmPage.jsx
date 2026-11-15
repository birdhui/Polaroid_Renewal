import styles from './FilmPage.module.css';

/**
 * Film — 필름 제품군 소개
 * 세부 디자인과 기능은 담당자 배정 후 이 폴더 안에서 개발한다.
 * 이 페이지에서만 쓰는 컴포넌트는 ./components/ 에 둔다.
 */
export default function FilmPage() {
  return (
    <section className={styles.page} aria-labelledby="film-title">
      <h1 id="film-title">Film</h1>
    </section>
  );
}
