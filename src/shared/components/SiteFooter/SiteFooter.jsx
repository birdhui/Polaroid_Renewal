import { Link } from 'react-router';
import { ROUTES } from '@/app/routes.js';
import styles from './SiteFooter.module.css';

/**
 * 공통 Footer. (공통 파일 — 수정 전 PM 협의)
 * 구조·스타일은 Cameras 시안(polaroid-shop) 푸터와 같다. 페이지별로 Footer 를 따로 만들지 않는다.
 * 브랜드 소개 문구와 메뉴 항목은 확정 전이라 자리 표시([…])로 둔다. 확정되면 FOOTER_COLUMNS·문구만 채운다.
 * Landing 마지막 장면(Footer)도 이 컴포넌트와 연결한다.
 */
const BAR_COLORS = ['var(--footer-red)', 'var(--footer-orange)', 'var(--footer-yellow)', 'var(--footer-green)', 'var(--footer-blue)'];

const FOOTER_COLUMNS = [
  { title: 'CAMERAS', items: 3 },
  { title: 'FILM', items: 3 },
  { title: 'PRINTERS', items: 2 },
  { title: 'COLLABS', items: 2 },
  { title: 'SUPPORT', items: 4 },
];

const LEGAL_LINKS = ['이용약관', '개인정보처리방침', '쿠키 설정'];

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Link to={ROUTES.landing} className={styles.wordmark} aria-label="Polaroid 홈으로 이동">
            polaroid
            <span className={styles.bar} aria-hidden="true">
              {BAR_COLORS.map((c) => (
                <i key={c} style={{ background: c }} />
              ))}
            </span>
          </Link>
          <p className={styles.tagline}>[브랜드 소개 한 줄 — 추가 예정]</p>
        </div>
        <div className={styles.nav}>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className={styles.col}>
              <h4>{col.title}</h4>
              <ul>
                {Array.from({ length: col.items }, (_, i) => (
                  <li key={i}>[메뉴]</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.bottom}>
        <span>© Polaroid 2026. All rights reserved</span>
        <nav aria-label="약관">
          {LEGAL_LINKS.map((label, i) => (
            <span key={label} className={styles.legalItem}>
              {i > 0 && <span aria-hidden="true">|</span>}
              <a href="#">{label}</a>
            </span>
          ))}
        </nav>
      </div>
    </footer>
  );
}
