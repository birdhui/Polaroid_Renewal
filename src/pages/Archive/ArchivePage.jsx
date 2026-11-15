import styles from './ArchivePage.module.css';

/**
 * Archive — 사진·콘텐츠 아카이브
 * 세부 디자인과 기능은 담당자 배정 후 이 폴더 안에서 개발한다.
 * 이 페이지에서만 쓰는 컴포넌트는 ./components/ 에 둔다.
 */
export default function ArchivePage() {
  return (
    <section className={styles.page} aria-labelledby="archive-title">
      <h1 id="archive-title">Archive</h1>
    </section>
  );
}
