import styles from './SiteFooter.module.css';

/**
 * 공통 Footer 자리. (공통 파일 — 수정 전 PM 협의)
 * 디자인과 내용이 확정되면 이 컴포넌트 하나만 채운다. 페이지별로 Footer 를 따로 만들지 않는다.
 * Landing 마지막 장면(Footer)도 이 컴포넌트와 연결한다.
 */
export default function SiteFooter() {
  return <footer className={styles.footer} />;
}
