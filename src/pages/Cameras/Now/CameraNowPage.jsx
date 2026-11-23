import styles from './CameraNowPage.module.css';

/**
 * Cameras › Polaroid Now 상세 페이지 (브랜치: feat/cameras-now)
 * 세부 디자인과 기능은 확정된 화면 기획서(Figma)를 받은 뒤 이 폴더 안에서 개발한다.
 * 페이지 전용 컴포넌트는 ./components/, 훅은 ./hooks/, 데이터는 ./data/ 에 둔다.
 * 이미지·영상은 src/assets/cameras/ 또는 public/assets/cameras/ 에 둔다.
 */
export default function CameraNowPage() {
  return (
    <section className={styles.page} aria-labelledby="camera-now-title">
      <h1 id="camera-now-title">Polaroid Now</h1>
    </section>
  );
}
