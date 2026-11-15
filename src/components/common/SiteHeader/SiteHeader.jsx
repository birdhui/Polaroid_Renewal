import { Link, NavLink } from 'react-router';
import { NAV_ITEMS, ROUTES } from '@/app/routes.js';
import styles from './SiteHeader.module.css';

/**
 * 공통 헤더: 타이틀 로고(→ Landing) + 서브페이지 메뉴.
 * 디자인은 확정되지 않았으므로 구조만 제공한다. 로고 이미지가 정해지면 텍스트를 교체한다. (공통 파일)
 */
export default function SiteHeader() {
  return (
    <header className={styles.header}>
      <Link to={ROUTES.landing} className={styles.logo} aria-label="Polaroid 홈으로 이동">
        Polaroid
      </Link>
      <nav aria-label="주요 메뉴">
        <ul className={styles.list}>
          {NAV_ITEMS.map(({ label, path }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) => (isActive ? `${styles.link} ${styles.active}` : styles.link)}
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
