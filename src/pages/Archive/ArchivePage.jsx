import styles from './ArchivePage.module.css';

/**
 * Archive — 사용자 이미지 업로드·폴라로이드 프레임 편집 (브라우저에서만 처리, 서버 없음) (담당: 이나라)
 * 세부 디자인과 기능은 확정된 화면 기획서를 받은 뒤 이 폴더 안에서 개발한다.
 * 페이지 전용 컴포넌트는 ./components/, 훅은 ./hooks/, 데이터는 ./data/ 에 둔다.
 */
export default function ArchivePage() {
  return (
    <section className={styles.page} aria-labelledby="archive-title">
      <h1 id="archive-title">Archive</h1>
    </section>
  );
}
