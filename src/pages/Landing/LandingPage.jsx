import styles from './LandingPage.module.css';

/**
 * Landing — 브랜드 첫 진입 화면
 * 세부 디자인과 기능은 담당자 배정 후 이 폴더 안에서 개발한다.
 * 이 페이지에서만 쓰는 컴포넌트는 ./components/ 에 둔다.
 */
export default function LandingPage() {
  return (
    <section className={styles.page} aria-labelledby="landing-title">
      <h1 id="landing-title">Landing</h1>
    </section>
  );
}
