import { Link } from 'react-router';
import { NAV_ITEMS, ROUTES } from '@/app/routes.js';
import logo from '@/assets/shared/images/logo-polaroid-white.webp';
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
        <Link to={ROUTES.landing} className={styles.logo} aria-label="Polaroid 홈으로 이동">
          <img className={styles.logoImage} src={logo} alt="" width="552" height="143" loading="lazy" />
        </Link>
        <nav aria-label="푸터 메뉴">
          <ul className={styles.list}>
            {NAV_ITEMS.map(({ label, path }) => (
              <li key={path}>
                <Link to={path} className={styles.link}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
