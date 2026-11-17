import { Link } from 'react-router';
import { NAV_ITEMS, ROUTES } from '@/app/routes.js';
import logo from '@/assets/shared/images/logo-polaroid-white.webp';
import styles from './SiteFooter.module.css';

/**
 * 공통 Footer. (공통 파일 — 수정 전 PM 협의)
 * 페이지별로 Footer 를 따로 만들지 않는다. Landing 마지막 장면(Footer)도 이 컴포넌트와 연결한다.
 * 로고 이미지는 임시(시안을 PNG로 렌더한 것)다. 공식 로고 SVG 가 정해지면 교체한다.
 */
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
