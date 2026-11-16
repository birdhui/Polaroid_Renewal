import styles from './CamerasPage.module.css';

/**
 * Cameras — 카메라 제품군 소개 (담당: 정준혁)
 * 세부 디자인과 기능은 확정된 화면 기획서를 받은 뒤 이 폴더 안에서 개발한다.
 * 페이지 전용 컴포넌트는 ./components/, 훅은 ./hooks/, 데이터는 ./data/ 에 둔다.
 */
export default function CamerasPage() {
  return (
    <section className={styles.page} aria-labelledby="cameras-title">
      <h1 id="cameras-title">Cameras</h1>
    </section>
  );
}
