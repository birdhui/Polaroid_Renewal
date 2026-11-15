import styles from './CamerasPage.module.css';

/**
 * Cameras — 카메라 제품군 소개
 * 세부 디자인과 기능은 담당자 배정 후 이 폴더 안에서 개발한다.
 * 이 페이지에서만 쓰는 컴포넌트는 ./components/ 에 둔다.
 */
export default function CamerasPage() {
  return (
    <section className={styles.page} aria-labelledby="cameras-title">
      <h1 id="cameras-title">Cameras</h1>
    </section>
  );
}
