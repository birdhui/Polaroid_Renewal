import styles from './CompareLoading.module.css';

/**
 * 채팅 섹션과 추천 결과 사이의 빈 베이지 섹션 — 로딩 섹션이 들어올 자리다.
 * 아직 디자인이 없어 내용 없이 높이와 배경만 잡아 둔다. 디자인이 정해지면 이 안을 채운다.
 */
export default function CompareLoading() {
  return <section className={styles.loading} aria-hidden="true" />;
}
